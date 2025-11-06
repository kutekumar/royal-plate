-- Create function to get customer details for orders
-- This function efficiently retrieves customer information for multiple order customer IDs

CREATE OR REPLACE FUNCTION public.get_order_customers(customer_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as user_id,
    p.full_name,
    au.email,
    p.phone
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.id = ANY(customer_ids);
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_order_customers(uuid[]) TO authenticated;

-- Create a more efficient fallback function that handles missing auth.users data
CREATE OR REPLACE FUNCTION public.get_order_customers_fallback(customer_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as user_id,
    p.full_name,
    COALESCE(au.email, ue.email, 'Email not available') as email,
    p.phone
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN public.user_emails ue ON ue.user_id = p.id
  WHERE p.id = ANY(customer_ids);
$$;

-- Grant permissions for the fallback function
GRANT EXECUTE ON FUNCTION public.get_order_customers_fallback(uuid[]) TO authenticated;