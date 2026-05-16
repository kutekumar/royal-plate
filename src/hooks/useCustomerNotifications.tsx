import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomerNotification {
  id: string;
  customer_id: string;
  order_id: string | null;
  title: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
  blog_post_id?: string;
  blog_title?: string;
  is_blog_reply?: boolean;
}

interface UseCustomerNotificationsOptions {
  enableSound?: boolean;
}

const PAGE_SIZE = 5;

const getNotificationAudio = () => {
  const audio = new Audio('/sound/notification.mp3');
  audio.preload = 'auto';
  return audio;
};

function extractBlogTitleFromMessage(message: string): string | undefined {
  const match = message.match(/on ["']([^"']+)["']/);
  return match?.[1];
}

async function enhanceNotifications(data: any[]): Promise<CustomerNotification[]> {
  return Promise.all(
    data.map(async (notification: any) => {
      const enhanced = { ...notification } as CustomerNotification;
      if (notification.title === 'Comment Reply' && notification.message) {
        enhanced.is_blog_reply = true;
        enhanced.blog_title = extractBlogTitleFromMessage(notification.message);
      }
      return enhanced;
    })
  );
}

export function useCustomerNotifications(options: UseCustomerNotificationsOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetched, setInitialFetched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchedCountRef = useRef(0);

  const enableSound = options.enableSound ?? true;

  const playSound = useCallback(() => {
    if (!enableSound) return;
    try {
      const audio = getNotificationAudio();
      const attemptPlay = async () => {
        audio.currentTime = 0;
        try {
          await audio.play();
        } catch {
          const handleUserInteraction = () => {
            audio.play().catch(() => {});
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
          };
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('keydown', handleUserInteraction);
        }
      };
      attemptPlay();
    } catch {}
  }, [enableSound]);

  useEffect(() => {
    const fetchInitial = async () => {
      if (!user || initialFetched) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('Error fetching customer_notifications:', error);
        setNotifications([]);
      } else {
        const enhanced = await enhanceNotifications(data || []);
        setNotifications(enhanced);
        fetchedCountRef.current = data?.length || 0;
        setHasMore((data?.length || 0) === PAGE_SIZE);
      }

      setInitialFetched(true);
      setLoading(false);
    };
    fetchInitial();
  }, [user, initialFetched]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || loadingMore) return;
    setLoadingMore(true);

    const from = fetchedCountRef.current;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('customer_notifications')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error loading more notifications:', error);
      setHasMore(false);
    } else if (data) {
      const enhanced = await enhanceNotifications(data);
      setNotifications(prev => [...prev, ...enhanced]);
      fetchedCountRef.current = from + data.length;
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [user, hasMore, loadingMore]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`customer-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${user.id}`,
        },
        async (payload) => {
          const row: any = payload.new;
          const enhancedNotification: CustomerNotification = {
            ...row,
            is_blog_reply: row.title === 'Comment Reply',
            blog_title: row.title === 'Comment Reply' ? extractBlogTitleFromMessage(row.message) : undefined,
          };

          setNotifications((prev) => {
            if (prev.some((n) => n.id === enhancedNotification.id)) return prev;
            return [enhancedNotification, ...prev];
          });

          if (row.status === 'unread') playSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playSound]);

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const markAllAsRead = useCallback(async () => {
    if (!user || notifications.length === 0) return;
    const unreadIds = notifications.filter((n) => n.status === 'unread').map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('customer_notifications').update({ status: 'read' }).in('id', unreadIds);
    setNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, status: 'read' } : n))
    );
  }, [user, notifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;
    await supabase.from('customer_notifications').update({ status: 'read' }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setInitialFetched(false);
    setNotifications([]);
    setHasMore(true);
    fetchedCountRef.current = 0;
    setLoading(true);
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadingMore,
    loadMore,
    markAllAsRead,
    markAsRead,
    refresh,
  };
}
