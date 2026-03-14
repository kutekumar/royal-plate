import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BottomNav } from '@/components/BottomNav';
import { MessageCircle, Sparkles, Clock, ChevronDown, Heart, Bookmark, Share2, Search, SlidersHorizontal, X, Newspaper, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import PageTransition from '@/components/PageTransition';

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
  restaurants?: {
    name: string | null;
    image_url: string | null;
  };
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

const Blog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Record<string, BlogComment[]>>({});
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [expandedContentPostIds, setExpandedContentPostIds] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'restaurant'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState<Array<{id: string, name: string}>>([]);

  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user for blog comments:', error);
      }
      setCurrentUserId(authData?.user?.id ?? null);
      await fetchPosts();
      await fetchRestaurants();
    };
    void init();
  }, []);

  // Entrance animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, []);

  // List animation
  useEffect(() => {
    if (listRef.current && !loadingPosts) {
      gsap.fromTo(
        listRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [posts, loadingPosts]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error loading restaurants', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          restaurants (
            name,
            image_url
          ),
          comments_count:blog_comments(count)
        `)
        .eq('is_published', true);

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      if (selectedRestaurant) {
        query = query.eq('restaurant_id', selectedRestaurant);
      }

      switch (sortBy) {
        case 'oldest':
          query = query.order('is_pinned', { ascending: false })
                   .order('created_at', { ascending: true });
          break;
        case 'restaurant':
          query = query.order('is_pinned', { ascending: false })
                   .order('restaurants.name', { ascending: true })
                   .order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_pinned', { ascending: false })
                   .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading blog posts', error);
        setPosts([]);
        return;
      }

      const normalized = (data as any[] | null)?.map((row) => ({
          ...row,
          comments_count:
            Array.isArray(row.comments_count) &&
            row.comments_count.length > 0 &&
            typeof row.comments_count[0]?.count === 'number'
              ? row.comments_count[0].count
              : 0,
        })) || [];

      setPosts(normalized as BlogPost[]);
    } catch (err) {
      console.error('Unexpected error loading blog posts', err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim() && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedRestaurant && post.restaurant_id !== selectedRestaurant) {
      return false;
    }
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'restaurant') {
      const nameA = a.restaurants?.name?.toLowerCase() || '';
      const nameB = b.restaurants?.name?.toLowerCase() || '';
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleContentExpand = (postId: string) => {
    setExpandedContentPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const toggleComments = async (postId: string) => {
    const next = new Set(expandedPostIds);
    if (next.has(postId)) {
      next.delete(postId);
      setExpandedPostIds(next);
      return;
    }

    next.add(postId);
    setExpandedPostIds(next);

    if (!comments[postId]) {
      await fetchComments(postId);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));

      let { data, error } = await supabase
        .from('blog_comments_with_profiles')
        .select('*')
        .eq('blog_post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        const fallbackResult = await supabase
          .from('blog_comments')
          .select(`*, profiles:customer_id (full_name)`)
          .eq('blog_post_id', postId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error loading comments', error);
        return;
      }

      const map: Record<string, BlogComment[]> = { ...comments };
      map[postId] = (data as BlogComment[]) || [];
      setComments(map);
    } catch (err) {
      console.error('Unexpected error loading comments', err);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = (newComment[postId] || '').trim();
    if (!content || !currentUserId) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          blog_post_id: postId,
          customer_id: currentUserId,
          content
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding comment', error);
        return;
      }

      setTimeout(() => {
        fetchComments(postId);
      }, 100);
      
      setComments((prev) => {
        const existing = prev[postId] || [];
        return { ...prev, [postId]: [...existing, data as BlogComment] };
      });
      setNewComment((prev) => ({ ...prev, [postId]: '' }));

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        )
      );

      if (!expandedPostIds.has(postId)) {
        const next = new Set(expandedPostIds);
        next.add(postId);
        setExpandedPostIds(next);
      }
    } catch (err) {
      console.error('Unexpected error adding comment', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderPostSkeleton = () => (
    <div className="rounded-3xl bg-white overflow-hidden shadow-sm border border-gray-100/80 animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
      </div>
    </div>
  );

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <PageTransition>
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

          {/* ── Header ── */}
          <div ref={headerRef} className="flex items-center justify-between px-5 pt-6 pb-3 z-10 bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-lg shadow-black/5">
        <div>
          <h1 className="text-[#1D2956] text-xl font-bold tracking-tight leading-none">Updates</h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.25em] mt-0.5">Stories & Promotions</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border transition-all text-xs font-bold ${
            showFilters || selectedRestaurant !== '' || sortBy !== 'newest'
              ? 'border-[#536DFE] bg-[#536DFE] text-white shadow-md shadow-[#536DFE]/30'
              : 'border-gray-200 bg-white text-[#1D2956] shadow-sm'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-5 pb-3 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-10 bg-white border border-gray-200 rounded-2xl text-[#1D2956] text-sm placeholder-gray-400 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/15 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="mx-5 mb-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm z-10">
          <div className="space-y-3">
            <div>
              <p className="text-[#1D2956] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Restaurant</p>
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-[#1D2956] text-sm focus:outline-none focus:border-[#536DFE] transition-all"
              >
                <option value="">All Restaurants</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[#1D2956] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Sort By</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Newest', value: 'newest' },
                  { label: 'Oldest', value: 'oldest' },
                  { label: 'Restaurant', value: 'restaurant' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as typeof sortBy)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
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
            {(selectedRestaurant !== '' || sortBy !== 'newest') && (
              <button
                onClick={() => { setSelectedRestaurant(''); setSortBy('newest'); }}
                className="flex items-center gap-1 text-gray-400 hover:text-[#536DFE] text-[11px] font-semibold transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Results Count ── */}
      <div className="px-5 pb-2 z-10">
        <p className="text-gray-400 text-[11px] font-medium">
          {loadingPosts ? 'Loading...' : `${sortedPosts.length} stor${sortedPosts.length !== 1 ? 'ies' : 'y'}`}
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
        {loadingPosts ? (
          <div className="space-y-3">
            {renderPostSkeleton()}
            {renderPostSkeleton()}
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 flex items-center justify-center mb-5 shadow-inner">
              <Newspaper className="w-10 h-10 text-[#536DFE]/40" />
            </div>
            <p className="text-[#1D2956] font-bold text-base mb-1">No stories yet</p>
            <p className="text-gray-400 text-sm max-w-[200px]">
              {posts.length === 0 
                ? 'Restaurants will share promotions and updates here' 
                : 'No posts match your filters'}
            </p>
            {(searchQuery || selectedRestaurant) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedRestaurant(''); }}
                className="mt-5 px-5 py-2.5 bg-[#536DFE] text-white rounded-2xl text-sm font-bold shadow-md shadow-[#536DFE]/30 transition-all active:scale-95"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div ref={listRef} className="space-y-4">
            {sortedPosts.map((post, index) => {
              const postComments = comments[post.id] || [];
              const commentsExpanded = expandedPostIds.has(post.id);
              const initials = (post.restaurants?.name || 'R').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="rounded-3xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 active:scale-[0.98] border border-gray-100/80 group"
                >
                  {/* ── Hero Image ── */}
                  {post.hero_image_url && (
                    <div
                      className="relative h-48 overflow-hidden cursor-pointer brand-featured-filter"
                      onClick={() => toggleContentExpand(post.id)}
                    >
                      <img
                        src={post.hero_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brand-shimmer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Pinned badge */}
                      {post.is_pinned && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xl shadow-[#536DFE]/40"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Featured
                        </motion.div>
                      )}

                      {/* Restaurant overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                          {post.restaurants?.image_url ? (
                            <img src={post.restaurants.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white text-[9px] font-bold">{initials}</span>
                          )}
                        </div>
                        <span className="text-white text-xs font-semibold drop-shadow">{post.restaurants?.name || 'Featured'}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Content ── */}
                  <div className="p-4">
                    {/* Restaurant row (if no hero image) */}
                    {!post.hero_image_url && (
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-9 h-9 ring-1 ring-gray-100 shadow-sm">
                          {post.restaurants?.image_url && (
                            <AvatarImage src={post.restaurants.image_url} alt={post.restaurants?.name || ''} />
                          )}
                          <AvatarFallback className="bg-[#536DFE]/10 text-[#536DFE] text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-[#1D2956] text-xs font-bold">{post.restaurants?.name || 'Restaurant'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(post.created_at)}
                          </div>
                        </div>
                        {post.is_pinned && (
                          <Badge className="bg-[#536DFE] text-white text-[9px] font-bold uppercase px-2 py-1 rounded-full">
                            Featured
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Title & Content */}
                    <div className="cursor-pointer" onClick={() => toggleContentExpand(post.id)}>
                      <h2 className="text-[#1D2956] text-base font-bold leading-tight mb-2 group-hover:text-[#536DFE] transition-colors">
                        {post.title}
                      </h2>
                      {post.hero_image_url && (
                        <p className="text-gray-400 text-[10px] flex items-center gap-1 mb-2">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(post.created_at)}
                        </p>
                      )}
                      <div
                        className={`text-gray-500 text-sm leading-relaxed ${!expandedContentPostIds.has(post.id) ? 'line-clamp-2' : ''}`}
                        dangerouslySetInnerHTML={{
                          __html: expandedContentPostIds.has(post.id)
                            ? post.content
                            : post.excerpt || (post.content.length > 120 ? post.content.slice(0, 120) + '…' : post.content)
                        }}
                      />
                    </div>

                    {/* ── Footer Actions ── */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-[#536DFE] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">{post.comments_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#536DFE] transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#536DFE] transition-colors">
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleContentExpand(post.id)}
                        className="text-[#536DFE] text-xs font-bold uppercase tracking-wider hover:text-[#536DFE]/70 transition-colors flex items-center gap-1"
                      >
                        {expandedContentPostIds.has(post.id) ? 'Less' : 'Read'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedContentPostIds.has(post.id) ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* ── Comments Section ── */}
                  {commentsExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/80 p-4 space-y-3">
                      <p className="text-[#1D2956] text-xs font-bold uppercase tracking-wider">Comments</p>
                      
                      {loadingComments[post.id] && (
                        <p className="text-gray-400 text-xs">Loading comments…</p>
                      )}

                      {!loadingComments[post.id] && postComments.length === 0 && (
                        <p className="text-gray-400 text-xs">No comments yet. Be the first to share your thoughts.</p>
                      )}

                      {!loadingComments[post.id] && postComments.filter(c => !c.parent_comment_id).map((c) => {
                        const displayName = c.display_name || `Guest ${c.customer_id.slice(0, 6).toUpperCase()}`;
                        const commentInitials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

                        return (
                          <div key={c.id} className="flex items-start gap-2.5 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#536DFE] to-[#1D2956] text-[9px] flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                              {commentInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[#1D2956] text-xs font-bold truncate">{displayName}</span>
                                <span className="text-gray-400 text-[10px] whitespace-nowrap">{formatTimeAgo(c.created_at)}</span>
                              </div>
                              <p className="text-gray-600 text-xs leading-relaxed">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Comment */}
                      <div className="pt-2">
                        <Textarea
                          placeholder={currentUserId ? 'Share your thoughts…' : 'Sign in to comment.'}
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          disabled={!currentUserId || !!submittingComment[post.id]}
                          className="h-16 text-xs resize-none border-gray-200 bg-white text-[#1D2956] placeholder:text-gray-400 focus-visible:ring-[#536DFE]/40 rounded-2xl"
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            className="h-8 px-4 text-[11px] rounded-xl bg-[#536DFE] hover:bg-[#536DFE]/90 text-white shadow-sm font-bold"
                            disabled={!currentUserId || !newComment[post.id]?.trim() || !!submittingComment[post.id]}
                            onClick={() => handleAddComment(post.id)}
                          >
                            {submittingComment[post.id] ? 'Posting…' : 'Post'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
        </div>
      </PageTransition>
    </>
  );
};

export default Blog;
