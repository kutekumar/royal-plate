import React, { lazy, Suspense, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, HashRouter, useLocation, matchPath } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { SoundProvider } from "./contexts/SoundContext";
import { NavigationProvider, useNavigationContext } from "./contexts/NavigationContext";
import PageShell from "./components/PageShell";
import { BottomNav } from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";

const NAV_ROUTES = ['/home', '/food', '/orders', '/blog', '/profile', '/settings'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 30,
    },
  },
});

const PageSkeleton = () => (
  <div className="h-full w-full bg-[#F5F5F7]" />
);

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const RestaurantDetails = lazy(() => import("./pages/RestaurantDetails"));
const RestaurantMenu = lazy(() => import("./pages/RestaurantMenu"));
const Payment = lazy(() => import("./pages/Payment"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const BlogEnhanced = lazy(() => import("./pages/BlogEnhanced"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const Food = lazy(() => import("./pages/Food"));
const Settings = lazy(() => import("./pages/Settings"));
const RestaurantDashboard = lazy(() => import("./pages/dashboard/RestaurantDashboard"));
const BlogEditor = lazy(() => import("./pages/dashboard/BlogEditor"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AllRestaurants = lazy(() => import("./pages/AllRestaurants"));
const NotFound = lazy(() => import("./pages/NotFound"));

interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: Array<'customer' | 'restaurant_owner' | 'admin'>;
}

const routes: RouteConfig[] = [
  { path: "/", element: <Onboarding /> },
  { path: "/auth", element: <Auth /> },
  { path: "/home", element: <Home />, requiresAuth: true },
  { path: "/orders", element: <Orders />, requiresAuth: true },
  { path: "/blog", element: <BlogEnhanced /> },
  { path: "/blog/:postId", element: <BlogPostDetail /> },
  { path: "/food", element: <Food />, requiresAuth: true },
  { path: "/profile", element: <Profile />, requiresAuth: true },
  { path: "/settings", element: <Settings />, requiresAuth: true },
  { path: "/restaurants", element: <AllRestaurants /> },
  { path: "/restaurant/:id", element: <RestaurantDetails /> },
  { path: "/restaurant/:id/menu", element: <RestaurantMenu /> },
  { path: "/payment", element: <Payment />, requiresAuth: true },
  { path: "/confirmation", element: <Confirmation />, requiresAuth: true },
  { path: "/dashboard", element: <RestaurantDashboard />, requiresAuth: true, allowedRoles: ['restaurant_owner'] },
  { path: "/dashboard/blog/new", element: <BlogEditor />, requiresAuth: true, allowedRoles: ['restaurant_owner'] },
  { path: "/dashboard/blog/edit/:postId", element: <BlogEditor />, requiresAuth: true, allowedRoles: ['restaurant_owner'] },
  { path: "/admin", element: <AdminDashboard />, requiresAuth: true, allowedRoles: ['admin'] },
  { path: "/admin/restaurants", element: <AdminRestaurants />, requiresAuth: true, allowedRoles: ['admin'] },
  { path: "/admin/owners", element: <AdminOwners />, requiresAuth: true, allowedRoles: ['admin'] },
  { path: "/admin/orders", element: <AdminOrders />, requiresAuth: true, allowedRoles: ['admin'] },
  { path: "/admin/users", element: <AdminUsers />, requiresAuth: true, allowedRoles: ['admin'] },
  { path: "*", element: <NotFound /> },
];

const AppRoutes = () => {
  const location = useLocation();
  const { direction } = useNavigationContext();

  const showNav = useMemo(() =>
    NAV_ROUTES.some((path) =>
      matchPath({ path, end: true }, location.pathname)
    ),
    [location.pathname]
  );

  return (
    <>
      <AnimatePresence mode="popLayout">
        <Routes location={location} key={location.pathname}>
          {routes.map((route) => {
            let content = route.element;
            if (route.requiresAuth) {
              content = (
                <ProtectedRoute allowedRoles={route.allowedRoles}>
                  {content}
                </ProtectedRoute>
              );
            }
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <PageShell direction={direction}>
                    <Suspense fallback={<PageSkeleton />}>
                      {content}
                    </Suspense>
                  </PageShell>
                }
              />
            );
          })}
        </Routes>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SoundProvider>
      <AuthProvider>
        <TooltipProvider>
          <NavigationProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </NavigationProvider>
        </TooltipProvider>
      </AuthProvider>
    </SoundProvider>
  </QueryClientProvider>
);

export default App;
