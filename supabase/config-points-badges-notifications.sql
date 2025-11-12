-- Schema additions for customer loyalty points, badges, and notifications
-- Applies to existing tables: auth.users, public.profiles, public.orders

-- 1) Loyalty summary per customer
create table if not exists public.customer_loyalty_summary (
  customer_id uuid primary key references auth.users(id) on delete cascade,
  total_points bigint not null default 0,
  total_completed_orders bigint not null default 0,
  total_spent numeric(18,2) not null default 0,
  current_badge text not null default 'Newbie',
  updated_at timestamptz not null default now()
);

-- 2) Notification table for customer-facing messages
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  title text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_notifications_customer_id_created_at
  on public.customer_notifications (customer_id, created_at desc);

-- 3) Helper function: compute badge from completed order count
create or replace function public.get_loyalty_badge(order_count bigint)
returns text
language plpgsql
stable
as $$
begin
  if order_count is null or order_count <= 0 then
    return 'Newbie';
  elsif order_count between 1 and 4 then
    return 'Explorer';
  elsif order_count between 5 and 9 then
    return 'Preferred';
  elsif order_count between 10 and 29 then
    return 'Loyal Customer';
  else
    return 'Super Customer';
  end if;
end;
$$;

-- 4) Upsert loyalty summary.
--    Points rule: 1 point per 100,000 MMK of lifetime PAID + COMPLETED spend
--    (so existing completed orders are fully counted; no regression).
--    Badge rule: based ONLY on COMPLETED orders (keeps profile history semantics).
create or replace function public.recalculate_customer_loyalty(p_customer_id uuid)
returns void
language plpgsql
as $$
declare
  v_total_spent numeric(18,2);
  v_total_orders bigint;
  v_points bigint;
  v_badge text;
begin
  select
    -- sum of all orders that are either paid (immediate earn) or completed (historical)
    coalesce(sum(
      case
        when o.status = 'paid' or o.status = 'completed' then o.total_amount
        else 0
      end
    ), 0),
    -- count of completed orders for badge tier
    coalesce(count(*) filter (where o.status = 'completed'), 0)
  into
    v_total_spent,
    v_total_orders
  from public.orders o
  where
    o.customer_id = p_customer_id;

  -- floor(total_spent / 100000)
  v_points := floor(coalesce(v_total_spent, 0) / 100000);
  v_badge := public.get_loyalty_badge(v_total_orders);

  insert into public.customer_loyalty_summary (
    customer_id,
    total_points,
    total_completed_orders,
    total_spent,
    current_badge,
    updated_at
  )
  values (
    p_customer_id,
    v_points,
    v_total_orders,
    v_total_spent,
    v_badge,
    now()
  )
  on conflict (customer_id) do update
  set
    total_points = excluded.total_points,
    total_completed_orders = excluded.total_completed_orders,
    total_spent = excluded.total_spent,
    current_badge = excluded.current_badge,
    updated_at = now();
end;
$$;

-- 5) Trigger: when an order is created with status 'paid', recalc loyalty + insert notification.
create or replace function public.handle_order_paid_loyalty()
returns trigger
language plpgsql
as $$
declare
  v_customer_id uuid;
  v_points_before bigint;
  v_points_after bigint;
  v_points_earned bigint;
begin
  v_customer_id := NEW.customer_id;

  -- Only fire for customer orders with initial status 'paid'
  if v_customer_id is null then
    return NEW;
  end if;

  if TG_OP = 'INSERT' and NEW.status = 'paid' then
    -- Capture points before recalculation
    select total_points
    into v_points_before
    from public.customer_loyalty_summary
    where customer_id = v_customer_id;

    v_points_before := coalesce(v_points_before, 0);

    -- Recalculate summary from all completed orders
    perform public.recalculate_customer_loyalty(v_customer_id);

    -- Get updated points
    select total_points
    into v_points_after
    from public.customer_loyalty_summary
    where customer_id = v_customer_id;

    v_points_after := coalesce(v_points_after, 0);
    v_points_earned := greatest(v_points_after - v_points_before, 0);

    -- Insert notification for this completed order with earned points info
    insert into public.customer_notifications (
      customer_id,
      order_id,
      title,
      message,
      status
    )
    values (
      v_customer_id,
      NEW.id,
      'Order placed',
      case
        when v_points_earned > 0 then
          format(
            'Your order has been placed successfully. You earned %s loyalty point(s). Your current balance is %s points.',
            v_points_earned,
            v_points_after
          )
        else
          format(
            'Your order has been placed successfully. Your current loyalty balance is %s points.',
            v_points_after
          )
      end,
      'unread'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_order_completed_loyalty on public.orders;
drop trigger if exists trg_order_paid_loyalty on public.orders;

create trigger trg_order_paid_loyalty
after insert on public.orders
for each row
execute function public.handle_order_paid_loyalty();