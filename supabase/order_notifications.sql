-- Schema for order_notifications table and trigger-based population
-- Apply this in your Supabase SQL editor or via migrations.

-- 1) Notification table: one row per order event for a restaurant
create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.profiles(id),
  title text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

-- Indexes to optimize lookups for a given restaurant
create index if not exists idx_order_notifications_restaurant_created
  on public.order_notifications (restaurant_id, created_at desc);

create index if not exists idx_order_notifications_restaurant_status
  on public.order_notifications (restaurant_id, status);

-- 2) Trigger function: create notification on new order insert
create or replace function public.handle_new_order_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  customer_name text;
  total_amount_numeric numeric;
begin
  -- Attempt to get customer display name (optional)
  select p.full_name
  into customer_name
  from public.profiles p
  where p.id = new.customer_id;

  if customer_name is null or length(trim(customer_name)) = 0 then
    customer_name := 'New customer';
  end if;

  -- Ensure total_amount is numeric-safe
  total_amount_numeric := new.total_amount::numeric;

  -- IMPORTANT:
  -- Do NOT cast or depend on order_status enum here.
  -- Only store plain text so we never break orders insert.
  insert into public.order_notifications (
    order_id,
    restaurant_id,
    customer_id,
    title,
    message,
    status
  )
  values (
    new.id,
    new.restaurant_id,
    new.customer_id,
    'New order received',
    format(
      '%s placed an order of %s MMK (%s)',
      customer_name,
      coalesce(to_char(total_amount_numeric, 'FM999,999,999'), '0'),
      coalesce(new.status::text, 'paid')
    ),
    'unread'
  );

  return new;
end;
$$;

-- 3) Trigger on orders table
drop trigger if exists on_new_order_notification on public.orders;

create trigger on_new_order_notification
after insert on public.orders
for each row
execute procedure public.handle_new_order_notification();

-- 4) Row Level Security: allow restaurant owners to read their notifications
-- Adjust these policies based on your existing auth/role system.

alter table public.order_notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'order_notifications'
      and policyname = 'Restaurant owners can read own notifications'
  ) then
    create policy "Restaurant owners can read own notifications"
    on public.order_notifications
    for select
    using (
      -- Assuming you link restaurants.owner_id to auth.uid()
      exists (
        select 1
        from public.restaurants r
        where r.id = order_notifications.restaurant_id
          and r.owner_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'order_notifications'
      and policyname = 'Restaurant owners can update own notifications'
  ) then
    create policy "Restaurant owners can update own notifications"
    on public.order_notifications
    for update
    using (
      exists (
        select 1
        from public.restaurants r
        where r.id = order_notifications.restaurant_id
          and r.owner_id = auth.uid()
      )
    );
  end if;
end$$;