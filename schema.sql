-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.blog_comment_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  blog_post_id uuid NOT NULL,
  comment_id uuid NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'New Blog Comment'::text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread'::text CHECK (status = ANY (ARRAY['unread'::text, 'read'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  comment_content text,
  CONSTRAINT blog_comment_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comment_notifications_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT blog_comment_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT blog_comment_notifications_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id),
  CONSTRAINT blog_comment_notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.blog_comments(id)
);


CREATE TABLE public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  content text NOT NULL,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_comment_id uuid,
  CONSTRAINT blog_comments_pkey PRIMARY KEY (id),
  CONSTRAINT blog_comments_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id),
  CONSTRAINT blog_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.blog_comments(id),
  CONSTRAINT blog_comments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);


CREATE TABLE public.blog_post_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  position integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blog_post_images_pkey PRIMARY KEY (id),
  CONSTRAINT blog_post_images_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id)
);
CREATE TABLE public.blog_post_menu_items (
  blog_post_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  CONSTRAINT blog_post_menu_items_pkey PRIMARY KEY (blog_post_id, menu_item_id),
  CONSTRAINT blog_post_menu_items_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id),
  CONSTRAINT blog_post_menu_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text DEFAULT lower(regexp_replace(COALESCE(title, ''::text), '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text)),
  content text NOT NULL,
  excerpt text,
  hero_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  phone text,
  company text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_loyalty_summary (
  customer_id uuid NOT NULL,
  total_points bigint NOT NULL DEFAULT 0,
  total_completed_orders bigint NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  current_badge text NOT NULL DEFAULT 'Newbie'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_loyalty_summary_pkey PRIMARY KEY (customer_id),
  CONSTRAINT customer_loyalty_summary_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.customer_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  order_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread'::text CHECK (status = ANY (ARRAY['unread'::text, 'read'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reply_content text,
  restaurant_name text,
  blog_post_id uuid,
  CONSTRAINT customer_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT customer_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT customer_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT customer_notifications_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.order_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  customer_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread'::text CHECK (status = ANY (ARRAY['unread'::text, 'read'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT order_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_notifications_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT order_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  order_type USER-DEFINED NOT NULL,
  payment_method USER-DEFINED NOT NULL,
  total_amount numeric NOT NULL,
  status USER-DEFINED DEFAULT 'paid'::order_status,
  qr_code text NOT NULL,
  order_items jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  party_size integer,
  reservation_date text,
  reservation_time text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT orders_customer_id_fkey1 FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.restaurant_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  order_id uuid,
  rating numeric NOT NULL CHECK (rating >= 1::numeric AND rating <= 5::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_ratings_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_ratings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT restaurant_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  description text,
  cuisine_type text,
  address text NOT NULL,
  phone text,
  image_url text,
  rating numeric DEFAULT 0,
  distance text,
  open_hours text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT restaurants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vip_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  interest text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vip_waitlist_pkey PRIMARY KEY (id)
);