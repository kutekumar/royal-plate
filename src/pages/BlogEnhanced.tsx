import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSoundContext } from '@/contexts/SoundContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Gem, Clock, ChevronDown, Heart, Bookmark, Search, SlidersHorizontal, X, Newspaper, TrendingUp, Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Lottie from 'lottie-react';
import '@/styles/blog-enhancements.css';

const loadingAnimation = {
  v: "5.7.1", fr: 60, ip: 0, op: 120, w: 200, h: 200, nm: "Loading", ddd: 0, assets: [],
  layers: [{
    ddd: 0, ind: 1, ty: 4, nm: "Circle", sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 1, k: [{ t: 0, s: [0] }, { t: 120, s: [360] }] },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] }
    },
    ao: 0,
    shapes: [
      { ty: "el", d: 1, s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] }, nm: "Ellipse Path" },
      { ty: "st", c: { a: 0, k: [0.325, 0.427, 0.996, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 }, lc: 2, lj: 1, ml: 4, nm: "Stroke" },
      { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: "Transform" }
    ],
    ip: 0, op: 120, st: 0, bm: 0
  }]
};

type BlogPost = {
  id: string;
  restaurant_id: string;
  author_id: string;
  title: string;
  excerpt: string | null;
  content: string;
  hero_image_url: string | null;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  restaurants?: { name: string | null; image_url: string | null; };
  comments_count?: number;
};

type BlogComment = {
  id: string;
  blog_post_id: string;
  customer_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  parent_comment_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  avatar_url?: string | null;
  display_name?: string;
};

const springTap = { type: "spring", stiffness: 400, damping: 17 };
const springLike = { type: "spring", stiffness: 300, damping: 12 };

const PostCard = ({ post, index, likedPosts, bookmarkedPosts, expandedPostIds, expandedContentPostIds, newComment, comments, loadingComments, submittingComment, currentUserId, onToggleLike, onToggleBookmark, onToggleComments, onToggleContent, onNewCommentChange, onSubmitComment, formatTimeAgo }: {
  post: BlogPost; index: number;
  likedPosts: Set<string>; bookmarkedPosts: Set<string>;
  expandedPostIds: Set<string>; expandedContentPostIds: Set<string>;
  newComment: Record<string, string>;
  comments: Record<string, BlogComment[]>;
  loadingComments: Record<string, boolean>;
  submittingComment: Record<string, boolean>;
  currentUserId: string | null;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onToggleComments: (id: string) => void;
  onToggleContent: (id: string) => void;
  onNewCommentChange: (id: string, val: string) => void;
  onSubmitComment: (id: string) => void;
  formatTimeAgo: (d: string) => string;
}) => {
  const postComments = comments[post.id] || [];
  const commentsExpanded = expandedPostIds.has(post.id);
  const isLiked = likedPosts.has(post.id);
  const isBookmarked = bookmarkedPosts.has(post.id);
  const initials = (post.restaurants?.name || 'R').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="blog-card rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-xl border border-gray-100/80 group transition-shadow duration-500"
    >
      {/* Hero Image */}
      {post.hero_image_url && (
        <div
          className="blog-image-container relative h-28 overflow-hidden cursor-pointer"
          onClick={() => onToggleContent(post.id)}
        >
          <img
            src={post.hero_image_url}
            alt={post.title}
            className="blog-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {post.is_pinned && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="badge-shine absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white text-[7px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xl shadow-[#536DFE]/40"
            >
              <TrendingUp className="w-2.5 h-2.5" />
              Featured
            </motion.div>
          )}
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                {post.restaurants?.image_url ? (
                  <img src={post.restaurants.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-[7px] font-bold">{initials}</span>
                )}
              </div>
            <span className="text-white text-[10px] font-semibold drop-shadow">{post.restaurants?.name || 'Featured'}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-2.5">
        {!post.hero_image_url && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-7 h-7 ring-1 ring-gray-100 shadow-sm">
              {post.restaurants?.image_url && <AvatarImage src={post.restaurants.image_url} alt={post.restaurants?.name || ''} />}
              <AvatarFallback className="bg-[#536DFE]/10 text-[#536DFE] text-[8px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-[#1D2956] text-[10px] font-bold">{post.restaurants?.name || 'Restaurant'}</p>
              <div className="flex items-center gap-1.5 text-[8px] text-gray-400">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(post.created_at)}
              </div>
            </div>
            {post.is_pinned && (
              <Badge className="bg-[#536DFE] text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full">Featured</Badge>
            )}
          </div>
        )}

        <div className="cursor-pointer" onClick={() => onToggleContent(post.id)}>
          <h2 className="text-[#1D2956] text-[11px] font-bold leading-tight mb-1 group-hover:text-[#536DFE] transition-colors">
            {post.title}
          </h2>
          {post.hero_image_url && (
            <p className="text-gray-400 text-[8px] flex items-center gap-1 mb-1.5">
              <Clock className="w-2.5 h-2.5" />
              {formatTimeAgo(post.created_at)}
            </p>
          )}
          <div
            className={`text-gray-500 text-[10px] leading-relaxed ${!expandedContentPostIds.has(post.id) ? 'line-clamp-2' : ''}`}
            dangerouslySetInnerHTML={{
              __html: expandedContentPostIds.has(post.id)
                ? post.content
                : post.excerpt || (post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content)
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleComments(post.id)}
              className="flex items-center gap-1 text-gray-400 hover:text-[#536DFE] transition-colors py-1 px-0.5"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="text-[9px] font-semibold">{post.comments_count || 0}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1 transition-colors py-1 px-0.5 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              </motion.div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleBookmark(post.id)}
              className={`flex items-center gap-1 transition-colors py-1 px-0.5 ${isBookmarked ? 'text-[#536DFE]' : 'text-gray-400 hover:text-[#536DFE]'}`}
            >
              <motion.div
                animate={isBookmarked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
              </motion.div>
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleContent(post.id)}
            className="text-[#536DFE] text-[9px] font-bold uppercase tracking-wider hover:text-[#536DFE]/70 transition-colors flex items-center gap-1"
          >
            {expandedContentPostIds.has(post.id) ? 'Less' : 'Read'}
            <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-300 ${expandedContentPostIds.has(post.id) ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence initial={false}>
        {commentsExpanded && (
          <motion.div
            key="comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50/80 p-2.5 space-y-2">
              <p className="text-[#1D2956] text-[9px] font-bold uppercase tracking-wider">Comments</p>

              {loadingComments[post.id] && (
                <div className="flex items-center justify-center py-3">
                  <Lottie animationData={loadingAnimation} loop style={{ width: 30, height: 30 }} />
                </div>
              )}

              {!loadingComments[post.id] && postComments.length === 0 && (
                <p className="text-gray-400 text-[9px]">No comments yet. Be the first to share your thoughts.</p>
              )}

              {!loadingComments[post.id] && postComments.filter(c => !c.parent_comment_id).map((c) => {
                const displayName = c.display_name || `Guest ${c.customer_id.slice(0, 6).toUpperCase()}`;
                const commentInitials = displayName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#536DFE] to-[#1D2956] text-[7px] flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                      {commentInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[#1D2956] text-[9px] font-bold truncate">{displayName}</span>
                        <span className="text-gray-400 text-[8px] whitespace-nowrap">{formatTimeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-gray-600 text-[9px] leading-relaxed">{c.content}</p>
                    </div>
                  </motion.div>
                );
              })}

              <div className="pt-1.5">
                <Textarea
                  placeholder={currentUserId ? 'Share your thoughts…' : 'Sign in to comment.'}
                  value={newComment[post.id] || ''}
                  onChange={(e) => onNewCommentChange(post.id, e.target.value)}
                  disabled={!currentUserId || !!submittingComment[post.id]}
                  className="min-h-[60px] text-base resize-none border-gray-200 bg-white text-[#1D2956] placeholder:text-gray-400 focus-visible:ring-[#536DFE]/40 rounded-2xl"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    className="h-6 px-2.5 text-[8px] rounded-xl bg-[#536DFE] hover:bg-[#536DFE]/90 text-white shadow-sm font-bold"
                    disabled={!currentUserId || !newComment[post.id]?.trim() || !!submittingComment[post.id]}
                    onClick={() => onSubmitComment(post.id)}
                  >
                    {submittingComment[post.id] ? (
                      <span className="flex items-center gap-1">
                        <Lottie animationData={loadingAnimation} loop style={{ width: 12, height: 12 }} />
                        Posting…
                      </span>
                    ) : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl bg-white overflow-hidden shadow-sm border border-gray-100/80">
    <div className="h-28 skeleton-luxury" />
    <div className="p-3 space-y-2">
      <div className="h-2.5 skeleton-luxury rounded-full w-1/2" />
      <div className="h-3 skeleton-luxury rounded-full w-3/4" />
      <div className="h-2.5 skeleton-luxury rounded-full w-full" />
    </div>
  </div>
);

const BlogEnhanced = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play } = useSoundContext();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Record<string, BlogComment[]>>({});
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [expandedContentPostIds, setExpandedContentPostIds] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'restaurant'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser();
      setCurrentUserId(authData?.user?.id ?? null);
      await fetchPosts();
      await fetchRestaurants();
    };
    void init();
  }, []);

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('id, name').order('name', { ascending: true });
    if (data) setRestaurants(data);
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      let query = supabase
        .from('blog_posts')
        .select(`*, restaurants (name, image_url), comments_count:blog_comments(count)`)
        .eq('is_published', true);

      if (searchQuery.trim()) query = query.ilike('title', `%${searchQuery.trim()}%`);
      if (selectedRestaurant) query = query.eq('restaurant_id', selectedRestaurant);

      switch (sortBy) {
        case 'oldest':
          query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: true }); break;
        default:
          query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) { setPosts([]); return; }

      const normalized = ((data as any[]) || []).map(row => ({
        ...row,
        comments_count: Array.isArray(row.comments_count) && row.comments_count.length > 0 && typeof row.comments_count[0]?.count === 'number' ? row.comments_count[0].count : 0,
      }));
      setPosts(normalized as BlogPost[]);
    } catch { setPosts([]); } finally { setLoadingPosts(false); }
  };

  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim() && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedRestaurant && post.restaurant_id !== selectedRestaurant) return false;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleContentExpand = (postId: string) => {
    setExpandedContentPostIds(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const toggleComments = async (postId: string) => {
    setExpandedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) { next.delete(postId); return next; }
      next.add(postId);
      if (!comments[postId]) fetchComments(postId);
      return next;
    });
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    let { data, error } = await supabase
      .from('blog_comments_with_profiles')
      .select('*')
      .eq('blog_post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      const fallback = await supabase
        .from('blog_comments')
        .select(`*, profiles:customer_id (full_name)`)
        .eq('blog_post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      data = fallback.data?.map((c: any) => ({
        id: c.id, blog_post_id: c.blog_post_id, customer_id: c.customer_id, content: c.content,
        is_edited: c.is_edited, is_deleted: c.is_deleted, created_at: c.created_at, updated_at: c.updated_at,
        parent_comment_id: c.parent_comment_id, customer_name: c.profiles?.full_name || null,
        customer_email: null, avatar_url: null,
      })) || [];
    }

    setComments(prev => ({ ...prev, [postId]: (data as BlogComment[]) || [] }));
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
  };

  const handleAddComment = async (postId: string) => {
    const content = (newComment[postId] || '').trim();
    if (!content || !currentUserId) return;
    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({ blog_post_id: postId, customer_id: currentUserId, content })
      .select('*')
      .single();

    if (!error && data) {
      setTimeout(() => fetchComments(postId), 100);
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data as BlogComment] }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    }
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      const adding = !next.has(postId);
      adding ? next.add(postId) : next.delete(postId);
      toast.success(adding ? 'Saved to bookmarks' : 'Removed from bookmarks');
      return next;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">
      {/* Scroll Progress (framer-motion driven - no re-renders) */}
      <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress, transformOrigin: 'left' }} />

      {/* Header */}
      <div ref={headerRef} className="glass-header flex items-center justify-between px-4 pt-5 pb-2 z-10">
        <div>
          <h1 className="text-[#1D2956] text-sm font-bold tracking-tight leading-none text-gradient-animated">Updates</h1>
          <p className="text-gray-400 text-[9px] uppercase tracking-[0.2em] mt-0.5">Stories & Promotions</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all text-[9px] font-bold ${
            showFilters || selectedRestaurant || sortBy !== 'newest'
              ? 'border-[#536DFE] bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
              : 'border-gray-200 bg-white text-[#1D2956] shadow-sm'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filter
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2 z-10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 bg-white border border-gray-200 rounded-2xl text-[#1D2956] text-base placeholder-gray-400 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/15 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mb-3 p-3 glass-card rounded-2xl z-10 overflow-hidden"
          >
            <div className="space-y-2">
              <div>
                <p className="text-[#1D2956] text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Restaurant</p>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-[#1D2956] text-base focus:outline-none focus:border-[#536DFE] transition-all"
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[#1D2956] text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5">Sort By</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: 'Newest', value: 'newest' },
                    { label: 'Oldest', value: 'oldest' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value as typeof sortBy)}
                      className={`px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition-all ${
                        sortBy === opt.value
                          ? 'bg-[#536DFE] text-white shadow-sm'
                          : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-[#536DFE]/40 hover:text-[#536DFE]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {(selectedRestaurant || sortBy !== 'newest') && (
                <button
                  onClick={() => { setSelectedRestaurant(''); setSortBy('newest'); }}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#536DFE] text-[9px] font-semibold transition-colors"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="px-4 pb-2 z-10">
            <p className="text-gray-400 text-[9px] font-medium">
              {loadingPosts ? 'Loading...' : `${sortedPosts.length} stor${sortedPosts.length !== 1 ? 'ies' : 'y'}`}
            </p>
      </div>

      {/* Post List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide overscroll-contain">
        {loadingPosts ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 flex items-center justify-center mb-4 shadow-inner">
              <Newspaper className="w-8 h-8 text-[#536DFE]/40" />
            </div>
            <p className="text-[#1D2956] font-bold text-xs mb-1">No stories yet</p>
            <p className="text-gray-400 text-[10px] max-w-[200px]">
              {posts.length === 0 ? 'Restaurants will share promotions and updates here' : 'No posts match your filters'}
            </p>
            {(searchQuery || selectedRestaurant) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearchQuery(''); setSelectedRestaurant(''); }}
                className="mt-3 px-3 py-1.5 bg-[#536DFE] text-white rounded-2xl text-[9px] font-bold shadow-md shadow-[#536DFE]/30 transition-all"
              >
                Clear filters
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {sortedPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                likedPosts={likedPosts}
                bookmarkedPosts={bookmarkedPosts}
                expandedPostIds={expandedPostIds}
                expandedContentPostIds={expandedContentPostIds}
                newComment={newComment}
                comments={comments}
                loadingComments={loadingComments}
                submittingComment={submittingComment}
                currentUserId={currentUserId}
                onToggleLike={toggleLike}
                onToggleBookmark={toggleBookmark}
                onToggleComments={toggleComments}
                onToggleContent={toggleContentExpand}
                onNewCommentChange={(id, val) => setNewComment(prev => ({ ...prev, [id]: val }))}
                onSubmitComment={handleAddComment}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogEnhanced;
