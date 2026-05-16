CREATE OR REPLACE FUNCTION public.get_admin_owners()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  restaurant_id uuid,
  restaurant_name text,
  restaurant_address text,
  role_created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.phone,
    r.id,
    r.name,
    r.address,
    ur.created_at
  FROM auth.users u
  JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'restaurant_owner'
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.restaurants r ON r.owner_id = u.id
  ORDER BY ur.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_owners() TO authenticated;
