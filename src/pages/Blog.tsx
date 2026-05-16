import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { MessageCircle, Heart, Bookmark, Search, SlidersHorizontal, X, Newspaper, TrendingUp, Clock, ChevronRight, Gem } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import BrandLoader from '@/components/BrandLoader';
import '@/styles/blog-enhancements.css';

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
  likes_count?: number;
};

const Blog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    const init = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
      }
      setCurrentUserId(authData?.user?.id ?? null);
      await fetchPosts();
      await fetchRestaurants();
    };
    void init();
  }, []);

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
        case 'popular':
          query = query.order('is_pinned', { ascending: false })
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
          likes_count: 0, // No blog_likes table in schema
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
    if (sortBy === 'popular') {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleLike = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to like posts');
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    // Toggle like locally (no blog_likes table in schema)
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + (isLiked ? -1 : 1) } : p
    ));
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
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
    <div className="rounded-2xl bg-white overflow-hidden shadow-sm border border-gray-100/80">
      <div className="h-48 skeleton-luxury" />
      <div className="p-4 space-y-3">
        <div className="h-3 skeleton-luxury rounded-full w-1/2" />
        <div className="h-5 skeleton-luxury rounded-full w-3/4" />
        <div className="h-3 skeleton-luxury rounded-full w-full" />
        <div className="h-3 skeleton-luxury rounded-full w-2/3" />
      </div>
    </div>
  );

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-b from-[#F8F9FA] via-[#FFFFFF] to-[#F8F9FA] font-poppins">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
          <div>
            <h1 className="text-[#1D2956] text-2xl font-bold tracking-tight">Blog</h1>
            <p className="text-gray-400 text-[11px] uppercase tracking-[0.2em] mt-0.5">Stories & Updates</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold ${
              showFilters || selectedRestaurant !== '' || sortBy !== 'newest'
                ? 'border-[#536DFE] bg-[#536DFE] text-white shadow-lg shadow-[#536DFE]/30'
                : 'border-gray-200 bg-white text-[#1D2956] shadow-sm hover:shadow-md'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="px-5 py-3 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-2xl text-[#1D2956] text-sm placeholder-gray-400 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/15 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="mx-5 mt-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm z-10">
            <div className="space-y-4">
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
                    { label: 'Popular', value: 'popular' },
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
        <div className="px-5 py-2 z-10">
          <p className="text-gray-400 text-[11px] font-medium">
            {loadingPosts ? 'Loading...' : `${sortedPosts.length} stor${sortedPosts.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-24">
          {loadingPosts ? (
            <div className="space-y-4">
              {renderPostSkeleton()}
              {renderPostSkeleton()}
              {renderPostSkeleton()}
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 flex items-center justify-center mb-5">
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
            <div className="space-y-4">
              {sortedPosts.map((post, index) => {
                const initials = (post.restaurants?.name || 'R').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
                const isLiked = likedPosts.has(post.id);
                const isBookmarked = bookmarkedPosts.has(post.id);

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/80 cursor-pointer group"
                  >
                    {/* ── Hero Image ── */}
                    {post.hero_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        
                        {/* Pinned badge */}
                        {post.is_pinned && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                            <Gem className="w-3 h-3" />
                            Featured
                          </div>
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
                          <div className="flex-1">
                            <span className="text-white text-xs font-semibold drop-shadow">{post.restaurants?.name || 'Restaurant'}</span>
                            <p className="text-white/70 text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
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

                      {/* Title & Excerpt */}
                      <h2 className="text-[#1D2956] text-base font-bold leading-tight mb-2 group-hover:text-[#536DFE] transition-colors">
                        {post.title}
                      </h2>
                      <div
                        className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3"
                        dangerouslySetInnerHTML={{
                          __html: post.excerpt || post.content.slice(0, 120) + '...'
                        }}
                      />

                      {/* ── Footer Actions ── */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                            className={`flex items-center gap-1.5 transition-colors ${
                              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs font-semibold">{post.likes_count || 0}</span>
                          </button>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">{post.comments_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
                            className={`transition-colors ${
                              isBookmarked ? 'text-[#536DFE]' : 'text-gray-400 hover:text-[#536DFE]'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#536DFE] transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default Blog;
