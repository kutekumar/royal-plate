import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type LoyaltyBadge =
  | 'Newbie'
  | 'Explorer'
  | 'Preferred'
  | 'Loyal Customer'
  | 'Super Customer';

export interface CustomerLoyaltySummary {
  customer_id: string;
  total_points: number;
  total_completed_orders: number;
  total_spent: number;
  current_badge: LoyaltyBadge;
  updated_at: string;
}

interface UseCustomerLoyaltyResult {
  loading: boolean;
  summary: CustomerLoyaltySummary | null;
  badgeLabel: string;
  badgeDescription: string;
  badgeIcon: 'sparkles' | 'compass' | 'star' | 'shield' | 'crown';
}

/**
 * Derive a stable badge icon + text mapping that matches the luxury/minimal style.
 */
const getBadgeMeta = (
  badge: LoyaltyBadge | undefined,
  orders: number
): { label: string; description: string; icon: UseCustomerLoyaltyResult['badgeIcon'] } => {
  if (!badge || orders <= 0) {
    return {
      label: 'Newbie',
      description: 'Start your journey and unlock exclusive dining perks.',
      icon: 'sparkles',
    };
  }

  switch (badge) {
    case 'Explorer':
      return {
        label: 'Explorer',
        description: 'You are discovering new places. Keep exploring.',
        icon: 'compass',
      };
    case 'Preferred':
      return {
        label: 'Preferred',
        description: 'A valued guest with consistent fine dining choices.',
        icon: 'star',
      };
    case 'Loyal Customer':
      return {
        label: 'Loyal Customer',
        description: 'One of our most loyal guests. Thank you for dining with us.',
        icon: 'shield',
      };
    case 'Super Customer':
      return {
        label: 'Super Customer',
        description: 'Elite status. Enjoy priority perks and curated experiences.',
        icon: 'crown',
      };
    default:
      return {
        label: 'Newbie',
        description: 'Start your journey and unlock exclusive dining perks.',
        icon: 'sparkles',
      };
  }
};

/**
 * Hook:
 * - Loads aggregated loyalty summary for the current authenticated customer
 *   from public.customer_loyalty_summary.
 * - If no row exists yet, it will attempt a one-time recalculation based on completed orders.
 */
export function useCustomerLoyalty(): UseCustomerLoyaltyResult {
  const { user } = useAuth();
  const [summary, setSummary] = useState<CustomerLoyaltySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setSummary(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1) Try to load existing summary
      const { data, error } = await supabase
        .from('customer_loyalty_summary')
        .select('*')
        .eq('customer_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setSummary({
          customer_id: data.customer_id,
          total_points: Number(data.total_points) || 0,
          total_completed_orders: Number(data.total_completed_orders) || 0,
          total_spent: Number(data.total_spent) || 0,
          current_badge: (data.current_badge as LoyaltyBadge) || 'Newbie',
          updated_at: data.updated_at,
        });
        setLoading(false);
        return;
      }

      // 2) If not exists yet, we can lazily compute from completed orders on the fly
      //    (defensive: in case some existing data predates the trigger)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('customer_id', user.id)
        .eq('status', 'completed');

      if (ordersError) {
        console.error('Failed to load loyalty summary:', ordersError);
        setSummary(null);
        setLoading(false);
        return;
      }

      const totalSpent = (orders || []).reduce(
        (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
        0
      );
      const totalCompletedOrders = orders?.length || 0;
      const totalPoints = Math.floor(totalSpent / 100000);
      let badge: LoyaltyBadge;

      if (totalCompletedOrders <= 0) badge = 'Newbie';
      else if (totalCompletedOrders <= 4) badge = 'Explorer';
      else if (totalCompletedOrders <= 9) badge = 'Preferred';
      else if (totalCompletedOrders <= 29) badge = 'Loyal Customer';
      else badge = 'Super Customer';

      const now = new Date().toISOString();

      setSummary({
        customer_id: user.id,
        total_points: totalPoints,
        total_completed_orders: totalCompletedOrders,
        total_spent: totalSpent,
        current_badge: badge,
        updated_at: now,
      });

      setLoading(false);
    };

    load();
  }, [user]);

  const meta = getBadgeMeta(summary?.current_badge, summary?.total_completed_orders || 0);

  return {
    loading,
    summary,
    badgeLabel: meta.label,
    badgeDescription: meta.description,
    badgeIcon: meta.icon,
  };
}