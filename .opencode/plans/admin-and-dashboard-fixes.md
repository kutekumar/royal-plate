# Admin & Dashboard Fix Plan

## Step 1: Fix Admin Owners Page

### 1a. Create SQL Migration
**File:** `supabase/migrations/add_admin_owners_function.sql`

```sql
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
```

### 1b. Refactor AdminOwners.tsx
**File:** `src/pages/admin/AdminOwners.tsx`

Replace the entire `fetchOwners` function (lines 43-76) with a single RPC call:
```typescript
const fetchOwners = useCallback(async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admin_owners');
    if (error) throw error;
    setOwners(data || []);
  } catch (err: any) {
    console.error('Error fetching owners:', err);
    toast.error('Failed to load owners');
  } finally {
    setLoading(false);
  }
}, []);
```

Remove the `fetchRestaurants` useEffect entirely since the RPC already includes restaurant data. Also remove the `restaurants` state.

## Step 2: Fix Admin Users Modal Positioning

### 2a. Fix Detail Dialog overflow
**File:** `src/pages/admin/AdminUsers.tsx`, line ~348

Change:
```tsx
<DialogContent className="sm:max-w-2xl rounded-2xl border-gray-100 shadow-2xl">
```
To:
```tsx
<DialogContent className="sm:max-w-2xl rounded-2xl border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto z-[60]">
```

### 2b. Fix "View Details" button for mobile
**File:** `src/pages/admin/AdminUsers.tsx`, line ~331

Change:
```tsx
className="... opacity-0 group-hover:opacity-100"
```
To:
```tsx
className="... md:opacity-0 md:group-hover:opacity-100 opacity-100"
```

### 2c. Fix DialogFooter conflicting classes
**File:** `src/pages/admin/AdminUsers.tsx`, line ~411

Change:
```tsx
<DialogFooter className="flex justify-between gap-3 pt-2">
```
To:
```tsx
<DialogFooter className="justify-between gap-3 pt-2">
```

## Step 3: Add Pagination to MenuManagement.tsx

**File:** `src/components/dashboard/MenuManagement.tsx`

### 3a. Add state variables (near line 20)
```typescript
const [menuPage, setMenuPage] = useState(1);
const [menuViewMode, setMenuViewMode] = useState<'grid' | 'list'>('grid');
const ITEMS_PER_PAGE = 12;
```

### 3b. Compute paginated items
```typescript
const totalMenuPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
const paginatedItems = filteredItems.slice(
  (menuPage - 1) * ITEMS_PER_PAGE,
  menuPage * ITEMS_PER_PAGE
);
```

### 3c. Add pagination component after the items grid (near bottom of return)
```tsx
{totalMenuPages > 1 && (
  <div className="flex items-center justify-center gap-2 py-6">
    <button
      onClick={() => setMenuPage(p => Math.max(1, p - 1))}
      disabled={menuPage === 1}
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    {Array.from({ length: totalMenuPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalMenuPages || Math.abs(p - menuPage) <= 1)
      .map((p, idx, arr) => (
        <React.Fragment key={p}>
          {idx > 0 && arr[idx - 1] !== p - 1 && (
            <span className="text-gray-400 text-xs">...</span>
          )}
          <button
            onClick={() => setMenuPage(p)}
            className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${
              menuPage === p
                ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg'
            }`}
          >
            {p}
          </button>
        </React.Fragment>
      ))}
    <button
      onClick={() => setMenuPage(p => Math.min(totalMenuPages, p + 1))}
      disabled={menuPage === totalMenuPages}
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
)}
```

### 3d. Reset page when search/filter changes
Add `setMenuPage(1)` in the search/filter change handlers.

### 3e. Replace `<div className="grid ...">` that maps items:
Change from `items.map` to `paginatedItems.map`.

## Step 4: Add Pagination to RestaurantBlogManagement.tsx

**File:** `src/components/dashboard/RestaurantBlogManagement.tsx`

Same pattern as Step 3 but with:
- `POSTS_PER_PAGE = 9`
- State: `blogPage`
- Filtered posts → paginatedPosts
- Reset blogPage when search/filter changes

## Step 5: Upgrade OrdersManagement.tsx Pagination Styling

**File:** `src/components/dashboard/OrdersManagement.tsx`

Replace the current pagination (around lines 376-408) with the premium glassmorphism pagination matching Food.tsx style (same as Step 3c).

## Step 6: Overhaul RestaurantDashboard.tsx Stats

**File:** `src/pages/dashboard/RestaurantDashboard.tsx`

### 6a. Add framer-motion animated counters
Import `useMotionValue`, `useTransform`, `animate`, `useInView` from framer-motion.

### 6b. Replace each stat card with premium version:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(83,109,254,0.15)' }}
  className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 p-5 shadow-lg"
>
  {/* Gradient accent bar */}
  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
  {/* Icon with gradient bg */}
  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} bg-opacity-10 flex items-center justify-center mb-3 shadow-lg`}>
    {card.icon}
  </div>
  {/* Animated counter */}
  <p className="text-3xl font-bold text-[#1D2956]">{animatedValue}</p>
  <p className="text-gray-500 text-xs font-medium mt-1">{card.label}</p>
</motion.div>
```

### 6c. Add staggered entrance animation for all cards

## Step 7: Loading Skeletons & Tab Transitions

### 7a. Add skeleton component for dashboard tabs
Create a reusable `DashboardSkeleton` component with:
- Shimmer gradient animation
- Card-shaped placeholders
- Match the layout of each tab

### 7b. Wrap tab content in `AnimatePresence mode="wait"`
Add crossfade transition when switching tabs.

## Files Modified (Summary)
| File | Changes |
|------|---------|
| `supabase/migrations/add_admin_owners_function.sql` | **NEW** - SECURITY DEFINER RPC |
| `src/pages/admin/AdminOwners.tsx` | Refactor fetchOwners, remove fetchRestaurants |
| `src/pages/admin/AdminUsers.tsx` | Fix modal overflow, mobile button, z-index |
| `src/components/dashboard/MenuManagement.tsx` | Add pagination (12/page) |
| `src/components/dashboard/RestaurantBlogManagement.tsx` | Add pagination (9/page) |
| `src/components/dashboard/OrdersManagement.tsx` | Upgrade pagination styling |
| `src/pages/dashboard/RestaurantDashboard.tsx` | Premium stats cards with animations |
