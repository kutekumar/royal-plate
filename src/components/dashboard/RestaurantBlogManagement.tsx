import { useEffect, useMemo, useState, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, BookOpenText, Plus, Image as ImageIcon, Trash2, Edit2, Pin, PinOff, Calendar, Loader2, CheckCircle2, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, Star, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RestaurantBlogPostDetail } from "./RestaurantBlogPostDetail";
import { motion, AnimatePresence } from "framer-motion";

type MenuItem = { id: string; name: string; image_url: string | null; price?: number | null };

type BlogPost = {
  id: string; restaurant_id: string; author_id: string; title: string; content: string;
  excerpt: string | null; hero_image_url: string | null; is_published: boolean;
  is_pinned: boolean; created_at: string; updated_at: string; linked_menu_items?: MenuItem[];
};

const RestaurantBlogManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'published' | 'drafts' | 'pinned'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [blogPage, setBlogPage] = useState(1);
  const POSTS_PER_PAGE = 9;

  const heroSuggestions = useMemo(() => menuItems.filter((m) => m.image_url), [menuItems]);

  useEffect(() => {
    const init = async () => {
      if (!user) { setLoadingInitial(false); return; }

      let resolvedRestaurantId: string | null = null;
      try {
        const { data: ownerProfile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).maybeSingle();
        if (ownerProfile?.restaurant_id) resolvedRestaurantId = ownerProfile.restaurant_id as string;
      } catch { }

      if (!resolvedRestaurantId) {
        try {
          const { data: restaurantRow } = await supabase.from("restaurants").select("id").eq("owner_id", user.id).maybeSingle();
          if (restaurantRow?.id) resolvedRestaurantId = restaurantRow.id as string;
        } catch { }
      }

      if (!resolvedRestaurantId) { setLoadingInitial(false); return; }
      setRestaurantId(resolvedRestaurantId);
      await Promise.all([loadMenuItems(resolvedRestaurantId), loadPosts(resolvedRestaurantId)]);
      setLoadingInitial(false);
    };
    void init();
  }, [user]);

  useEffect(() => {
    if (posts.length > 0) {
      const params = new URLSearchParams(location.search);
      const viewPostId = params.get('view');
      if (viewPostId) {
        const postToView = posts.find(post => post.id === viewPostId);
        if (postToView) { setSelectedPost(postToView); navigate('/dashboard?tab=blog', { replace: true }); }
      }
    }
  }, [posts, location.search, navigate]);

  const loadMenuItems = async (rId: string) => {
    const { data } = await supabase.from("menu_items").select("id, name, image_url, price").eq("restaurant_id", rId).order("name");
    setMenuItems((data as MenuItem[]) || []);
  };

  const loadPosts = async (rId: string) => {
    try {
      let query = supabase.from("blog_posts").select("*").eq("restaurant_id", rId);
      if (filterBy === 'published') query = query.eq('is_published', true);
      else if (filterBy === 'drafts') query = query.eq('is_published', false);
      else if (filterBy === 'pinned') query = query.eq('is_pinned', true);
      if (searchQuery.trim()) query = query.ilike('title', `%${searchQuery.trim()}%`);
      if (sortBy === 'oldest') query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: true });
      else if (sortBy === 'title') query = query.order("is_pinned", { ascending: false }).order("title", { ascending: true });
      else query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });

      const { data } = await query;
      const postsData = (data as BlogPost[]) || [];

      if (postsData.length > 0) {
        const ids = postsData.map(p => p.id);
        const { data: links } = await supabase.from("blog_post_menu_items").select("blog_post_id, menu_item_id").in("blog_post_id", ids);
        const linkByPost: Record<string, string[]> = {};
        (links || []).forEach((l: any) => { if (!linkByPost[l.blog_post_id]) linkByPost[l.blog_post_id] = []; linkByPost[l.blog_post_id].push(l.menu_item_id); });
        const menuMap: Record<string, MenuItem> = {};
        menuItems.forEach(m => { menuMap[m.id] = m; });
        setPosts(postsData.map(p => ({ ...p, linked_menu_items: (linkByPost[p.id] || []).map(id => menuMap[id]).filter(Boolean) as MenuItem[] })));
      } else setPosts([]);
    } catch { setPosts([]); }
  };

  const openCreate = () => navigate("/dashboard/blog/new");
  const openEdit = (post: BlogPost) => navigate(`/dashboard/blog/edit/${post.id}`);

  const handleTogglePin = async (post: BlogPost) => {
    if (!restaurantId) return;
    try {
      await supabase.from("blog_posts").update({ is_pinned: !post.is_pinned }).eq("id", post.id).eq("restaurant_id", restaurantId);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p));
    } catch (err) { console.error("Failed to toggle pin", err); }
  };

  const handleDelete = async (postId: string) => {
    if (!restaurantId) return;
    setDeletingId(postId);
    try {
      await supabase.from("blog_posts").delete().eq("id", postId).eq("restaurant_id", restaurantId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { } finally { setDeletingId(null); }
  };

  if (loadingInitial) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-royal-blue" />
          <span className="text-xs text-gray-500">Loading your blog studio...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-2.5 w-full bg-gray-100 rounded mb-2" />
              <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6">
        <p className="text-sm text-gray-500">No restaurant associated with this account. Once connected, you'll be able to publish posts here.</p>
      </div>
    );
  }

  const filteredAndSortedPosts = posts.filter(post => {
    if (searchQuery.trim() && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    switch (filterBy) {
      case 'published': return post.is_published;
      case 'drafts': return !post.is_published;
      case 'pinned': return post.is_pinned;
      default: return true;
    }
  }).sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalBlogPages = Math.max(1, Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredAndSortedPosts.slice((blogPage - 1) * POSTS_PER_PAGE, blogPage * POSTS_PER_PAGE);

  const filterCount = [searchQuery, filterBy !== 'all' ? filterBy : ''].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {selectedPost ? (
        <RestaurantBlogPostDetail
          post={selectedPost}
          onBack={() => setSelectedPost(null)}
          onEdit={(post) => { setSelectedPost(null); openEdit(post); }}
          onDelete={(postId) => { setSelectedPost(null); handleDelete(postId); }}
          onTogglePin={(post) => { handleTogglePin(post); if (selectedPost?.id === post.id) setSelectedPost(post); }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <BookOpenText className="w-4 h-4 text-royal-blue" />
                <span className="text-[10px] uppercase tracking-[0.16em] text-royal-blue/80 font-semibold">Blog Studio</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-royal-blue font-montserrat">Tell your food story</h2>
              <p className="text-sm text-gray-500 max-w-lg">Create elegant posts to highlight signature dishes, seasonal menus, and special offers.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 rounded-xl border-gray-200 h-9 text-xs font-semibold ${showFilters || filterCount > 0 ? 'bg-royal-blue text-white border-royal-blue' : ''}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {filterCount > 0 && <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">{filterCount}</span>}
              </Button>
              <Button size="sm" onClick={openCreate} className="gap-2 rounded-xl bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 h-9 text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" />
                New Post
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text" placeholder="Search posts..." value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setBlogPage(1); }}
                      className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue/40 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'published', 'drafts', 'pinned'] as const).map(f => (
                      <button key={f} onClick={() => { setFilterBy(f); setBlogPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                          filterBy === f ? 'bg-royal-blue text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? posts.length : posts.filter(p => f === 'published' ? p.is_published : f === 'drafts' ? !p.is_published : p.is_pinned).length})
                      </button>
                    ))}
                    <div className="flex-1" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="title">By Title</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts Grid */}
          {filteredAndSortedPosts.length === 0 && posts.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <BookOpenText className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-700">No blog posts yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first post to showcase your restaurant's story</p>
              <Button onClick={openCreate} className="mt-4 bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm rounded-xl h-9 text-xs font-semibold gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create Post
              </Button>
            </motion.div>
          )}

          {filteredAndSortedPosts.length === 0 && posts.length > 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500">No posts match your filters.</p>
              <button onClick={() => { setSearchQuery(''); setFilterBy('all'); setSortBy('newest'); }} className="text-xs text-royal-blue font-semibold mt-2 hover:underline">Clear filters</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {paginatedPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/40 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Pinned indicator */}
                  {post.is_pinned && (
                    <div className="h-1 bg-gradient-to-r from-royal-blue via-gold to-royal-blue/70" />
                  )}

                  {/* Hero Image */}
                  {post.hero_image_url && (
                    <div className="relative h-40 overflow-hidden bg-gray-50">
                      <img src={post.hero_image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Title + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{post.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.is_published ? (
                            <Badge className="h-5 px-2 text-[8px] bg-emerald-50 text-emerald-700 border-emerald-200/50 font-semibold flex items-center gap-1 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="h-5 px-2 text-[8px] border-gray-200 text-gray-500 font-semibold rounded-full">
                              <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                              Draft
                            </Badge>
                          )}
                          {post.is_pinned && (
                            <Badge className="h-5 px-2 text-[8px] bg-amber-50 text-amber-700 border-amber-200/50 font-semibold flex items-center gap-1 rounded-full">
                              <Star className="w-2.5 h-2.5" />
                              Highlight
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p
                      className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: post.excerpt || (post.content.length > 120 ? post.content.slice(0, 120) + '...' : post.content)
                      }}
                    />

                    {/* Linked menu items */}
                    {post.linked_menu_items && post.linked_menu_items.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.linked_menu_items.map(mi => (
                          <span key={mi.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-royal-blue/5 border border-royal-blue/10 text-[9px] text-royal-blue font-medium">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {mi.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); handleTogglePin(post); }}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                            post.is_pinned ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-amber-500 hover:border-amber-200'
                          }`}
                        >
                          {post.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                          className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-royal-blue hover:border-royal-blue/20 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} disabled={deletingId === post.id}
                          className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50"
                        >
                          {deletingId === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalBlogPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-6">
              <button
                onClick={() => setBlogPage(p => Math.max(1, p - 1))}
                disabled={blogPage === 1}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalBlogPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalBlogPages || Math.abs(p - blogPage) <= 1)
                .map((p, idx, arr) => (
                  <Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-gray-400 text-xs">...</span>
                    )}
                    <button
                      onClick={() => setBlogPage(p)}
                      className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all shadow-md ${
                        blogPage === p
                          ? 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30 scale-105'
                          : 'border border-white/60 bg-white/90 backdrop-blur-md text-gray-600 hover:border-[#536DFE]/50 hover:text-[#536DFE] hover:shadow-lg'
                      }`}
                    >
                      {p}
                    </button>
                  </Fragment>
                ))}
              <button
                onClick={() => setBlogPage(p => Math.min(totalBlogPages, p + 1))}
                disabled={blogPage === totalBlogPages}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/60 bg-white/90 backdrop-blur-md text-[#1D2956] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#536DFE]/50 hover:bg-gradient-to-br hover:from-[#536DFE]/5 hover:to-[#6B7FFF]/5 transition-all shadow-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantBlogManagement;
