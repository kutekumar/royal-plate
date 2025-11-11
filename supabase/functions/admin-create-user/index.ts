// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), { status: 500 });
    }

    // Parse body
    const body = await req.json();
    const { email, password, full_name, phone, role, restaurant_id } = body as {
      email: string;
      password: string;
      full_name: string;
      phone?: string | null;
      role: "customer" | "restaurant_owner" | "admin";
      restaurant_id?: string | null;
    };

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Create two clients: one with the incoming user's auth (to check admin), one with service role (to perform admin ops)
    const adminCheckClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Verify requester is an admin
    const { data: userResp, error: userErr } = await adminCheckClient.auth.getUser();
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const requesterId = userResp.user.id;
    const { data: roleRow, error: roleErr } = await adminCheckClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .single();

    if (roleErr || !roleRow || roleRow.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403 });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user via Admin API
    const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create auth user" }), { status: 400 });
    }

    const newUserId = created.user.id;

    // Insert profile
    const { error: profileErr } = await serviceClient.from("profiles").insert({
      id: newUserId,
      full_name,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    });
    if (profileErr) {
      // Cleanup auth user if profile fails
      await serviceClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Failed to create profile: ${profileErr.message}` }), { status: 400 });
    }

    // Insert role
    const { error: roleInsErr } = await serviceClient.from("user_roles").insert({
      user_id: newUserId,
      role,
      created_at: new Date().toISOString(),
    });
    if (roleInsErr) {
      // Cleanup
      await serviceClient.from("profiles").delete().eq("id", newUserId);
      await serviceClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Failed to assign role: ${roleInsErr.message}` }), { status: 400 });
    }

    // Insert user email helper (best-effort)
    await serviceClient.from("user_emails").insert({
      user_id: newUserId,
      email,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // Link restaurant if needed
    if (role === "restaurant_owner" && restaurant_id) {
      const { error: ownerErr } = await serviceClient.from("restaurant_owners").insert({
        user_id: newUserId,
        restaurant_id,
        created_at: new Date().toISOString(),
      });
      if (ownerErr) {
        // Do not fail the whole request; just report
        return new Response(JSON.stringify({
          user_id: newUserId,
          warning: `User created but failed to link restaurant: ${ownerErr.message}`,
        }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ user_id: newUserId }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
});