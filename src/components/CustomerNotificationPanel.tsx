import { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, ShoppingBag, Check, ChevronRight, Clock, Loader2, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerNotification } from '@/hooks/useCustomerNotifications';

interface CustomerNotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: CustomerNotification[];
  unreadCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onNotificationClick: (notification: CustomerNotification) => void;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (dateDay.getTime() === today.getTime()) return 'Today';
  if (dateDay.getTime() === yesterday.getTime()) return 'Yesterday';
  const diffDays = Math.floor((today.getTime() - dateDay.getTime()) / 86400000);
  if (diffDays < 7) return 'This Week';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'] as const;
type GroupKey = typeof GROUP_ORDER extends readonly (infer T)[] ? T : never;

export const CustomerNotificationPanel = ({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  hasMore,
  loadingMore,
  onLoadMore,
  markAsRead,
  markAllAsRead,
  onNotificationClick,
}: CustomerNotificationPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  const grouped = useMemo(() => {
    const groups = new Map<GroupKey, CustomerNotification[]>();
    for (const g of GROUP_ORDER) groups.set(g, []);
    for (const n of notifications) {
      const group = getDateGroup(n.created_at) as GroupKey;
      const arr = groups.get(group);
      if (arr) arr.push(n);
      else groups.get('Earlier')!.push(n);
    }
    return Array.from(groups.entries()).filter(([, items]) => items.length > 0);
  }, [notifications]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 flex flex-col"
            style={{ maxHeight: '75vh' }}
          >
            <div className="mx-auto w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-b-2xl border border-white/60 shadow-2xl shadow-black/10 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl border-b border-gray-100/80 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-lg shadow-[#536DFE]/25">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[#1D2956] text-sm font-bold leading-tight">Notifications</h3>
                    <p className="text-[9px] text-gray-400 font-medium tracking-wide">
                      {notifications.length === 0
                        ? 'No notifications'
                        : `${unreadCount} unread · ${notifications.length} total`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#536DFE]/10 text-[#536DFE] text-[10px] font-bold hover:bg-[#536DFE]/15 transition-all"
                    >
                      <Check className="w-3 h-3" />
                      Mark all read
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onOpenChange(false)}
                    className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 transition-all"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              {notifications.length === 0 ? (
                <div className="px-6 py-12 text-center flex-shrink-0">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100/80 flex items-center justify-center shadow-inner">
                    <Bell className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-[#1D2956] text-sm font-bold mb-1">All caught up!</p>
                  <p className="text-gray-400 text-xs">New notifications will appear here</p>
                </div>
              ) : (
                <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0">
                  {grouped.map(([groupLabel, items]) => (
                    <div key={groupLabel}>
                      <div className="px-4 pt-2.5 pb-1">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em]">
                          {groupLabel}
                        </span>
                      </div>
                      {items.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => onNotificationClick(notification)}
                          className={`w-full text-left px-4 py-2.5 transition-all border-b border-gray-50/80 last:border-b-0 active:bg-[#536DFE]/5 ${
                            notification.status === 'unread'
                              ? 'bg-gradient-to-r from-[#536DFE]/[0.03] to-transparent'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative mt-0.5 flex-shrink-0">
                              {notification.blog_post_id ? (
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/15">
                                  <MessageCircle className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-sm shadow-[#536DFE]/20">
                                  <ShoppingBag className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {notification.status === 'unread' && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#536DFE] border-[1.5px] border-white shadow-sm shadow-[#536DFE]/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-[11px] leading-snug ${
                                    notification.status === 'unread'
                                      ? 'font-bold text-[#1D2956]'
                                      : 'font-medium text-gray-500'
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <span className="text-[8px] text-gray-300 ml-auto flex-shrink-0">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed line-clamp-1 pr-2">
                                {notification.message}
                              </p>
                            </div>
                            {notification.status === 'unread' && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#536DFE] flex-shrink-0 mt-2 shadow-sm shadow-[#536DFE]/30" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="px-4 py-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-[11px] font-semibold hover:border-[#536DFE]/30 hover:text-[#536DFE] hover:bg-[#536DFE]/[0.02] transition-all disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Load more
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {!hasMore && notifications.length > PAGE_SIZE && (
                    <div className="px-4 py-3 text-center">
                      <span className="text-[9px] text-gray-300 font-medium">
                        All {notifications.length} notifications loaded
                      </span>
                    </div>
                  )}

                  <div className="h-2" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
