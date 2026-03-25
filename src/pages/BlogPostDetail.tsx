import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BottomNav } from '@/components/BottomNav';
import { MessageCircle, Heart, Bookmark, ArrowLeft, Clock, Send, User, Share2, Eye, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
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

type BlogComment = {
  id: string;
  blog_post_id: string;
  customer_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  customer_name?: string | null;
  customer_email?: string | null;
  avatar_url?: string | null;
  display_name?: string;
};

const BlogPostDetail = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [readProgress, setReadProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentFocus, setCommentFocus] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.15]);
  const headerBg = useTransform(scrollYProgress, [0, 0.08], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.98)']);
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const init = async () => {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
      }
      setCurrentUserId(authData?.user?.id ?? null);
      
      if (postId) {
        await fetchPost();
        await fetchComments();
        await checkLikeStatus();
      }
    };
    void init();
  }, [postId]);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setReadProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll, { passive: true });
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const fetchPost = async () => {
    try {
      setLoadingPost(true);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          restaurants (
            name,
            image_url
          ),
          comments_count:blog_comments(count)
        `)
        .eq('id', postId)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error loading blog post:', error);
        toast.error('Post not found');
        navigate('/blog');
        return;
      }

      const normalized = {
        ...data,
        comments_count:
          Array.isArray(data.comments_count) &&
          data.comments_count.length > 0 &&
          typeof data.comments_count[0]?.count === 'number'
            ? data.comments_count[0].count
            : 0,
        likes_count: 0,
      };

      setPost(normalized as BlogPost);
      setLikesCount(normalized.likes_count || 0);
    } catch (err) {
      console.error('Unexpected error loading blog post:', err);
      toast.error('Failed to load post');
      navigate('/blog');
    } finally {
      setLoadingPost(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);

      const { data, error } = await supabase
        .from('blog_comments_with_profiles')
        .select('*')
        .eq('blog_post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      setComments((data as BlogComment[]) || []);
    } catch (err) {
      console.error('Unexpected error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkLikeStatus = async () => {};

  const toggleLike = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to like posts');
      return;
    }
    setIsLiked(prev => !prev);
    setLikesCount(prev => prev + (isLiked ? -1 : 1));
  };

  const toggleBookmark = () => {
    setIsBookmarked(prev => !prev);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || post?.content.slice(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content || !currentUserId) return;

    try {
      setSubmittingComment(true);

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
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
        return;
      }

      const { data: commentWithProfile } = await supabase
        .from('blog_comments_with_profiles')
        .select('*')
        .eq('id', data.id)
        .single();

      if (commentWithProfile) {
        setComments(prev => [...prev, commentWithProfile as BlogComment]);
      }

      setNewComment('');
      setCommentFocus(false);
      toast.success('Comment added!');
      
      if (post) {
        setPost(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : null);
      }
    } catch (err) {
      console.error('Unexpected error adding comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loadingPost) {
    return (
      <>
        <BrandLoader isLoading={true} />
        <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E8E0FF] font-poppins">
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#536DFE]/20 to-[#1D2956]/20 flex items-center justify-center mb-6 mx-auto shadow-xl">
                <div className="w-10 h-10 border-3 border-[#536DFE] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Loading story...</p>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return null;
  }

  const initials = (post.restaurants?.name || 'R').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <BrandLoader isLoading={isTransitioning} />
      <div className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F8F5FF] via-[#F0EBFF] to-[#E8E0FF] font-poppins">
        
        {/* Ambient Gradient Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/5 blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, -25, 0],
              y: [0, 30, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#E8E0FF]/40 to-[#F0EBFF]/20 blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [0, 15, 0],
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-gradient-to-bl from-[#6B7FFF]/8 to-transparent blur-3xl"
          />
        </div>

        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/30 backdrop-blur-sm">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#536DFE] via-[#6B7FFF] to-[#8B9FFF]"
            style={{ width: `${readProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* ── Animated Header ── */}
        <motion.div 
          className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto"
          style={{ backgroundColor: headerBg }}
        >
          <div className="flex items-center gap-3 px-4 pt-5 pb-3 backdrop-blur-xl">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/blog')}
              className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/5 border border-white/60 hover:bg-white transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-[#1D2956]" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[#1D2956] text-sm font-bold truncate">{post.title}</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/5 border border-white/60 hover:bg-white transition-all"
            >
              <Share2 className="w-4 h-4 text-[#1D2956]" />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Content ── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto pt-16 pb-24 scroll-smooth relative z-10">
          {/* Hero Image with Parallax Effect */}
          {post.hero_image_url && (
            <motion.div
              className="relative h-72 sm:h-80 overflow-hidden"
              style={{ opacity: heroOpacity, scale: heroScale }}
            >
              <img
                src={post.hero_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8F5FF]/60 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent" />
              
              {/* Floating Elements */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-6 left-5 right-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl"
                  >
                    {post.restaurants?.image_url ? (
                      <img src={post.restaurants.image_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">{initials}</span>
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold drop-shadow-lg">{post.restaurants?.name || 'Restaurant'}</p>
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Post Content */}
          <div className="px-5 py-6">
            {/* Restaurant Info (if no hero) */}
            {!post.hero_image_url && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 mb-6 p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-black/5 border border-white/60"
              >
                <Avatar className="w-14 h-14 ring-2 ring-[#536DFE]/20 shadow-lg">
                  {post.restaurants?.image_url && (
                    <AvatarImage src={post.restaurants.image_url} alt={post.restaurants?.name || ''} />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 text-[#536DFE] text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-[#1D2956] text-base font-bold">{post.restaurants?.name || 'Restaurant'}</p>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#1D2956] text-3xl sm:text-4xl font-bold leading-tight mb-6 tracking-tight"
            >
              {post.title}
            </motion.h1>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="blog-article prose-enhanced text-gray-800 text-base sm:text-lg prose prose-lg max-w-none mb-8 prose-headings:text-[#1D2956] prose-headings:font-bold prose-p:text-gray-700 prose-a:text-[#536DFE] prose-strong:text-[#1D2956]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Actions Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between py-5 px-5 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-black/5 border border-white/60 mb-8"
            >
              <div className="flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleLike}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <motion.div
                    animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <span className="text-sm font-bold">{likesCount}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#536DFE] transition-colors duration-300"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-bold">{post.comments_count || 0}</span>
                </motion.button>
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="w-6 h-6" />
                  <span className="text-sm font-bold">Read</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleBookmark}
                className={`transition-all duration-300 ${
                  isBookmarked ? 'text-[#536DFE]' : 'text-gray-400 hover:text-[#536DFE]'
                }`}
              >
                <motion.div
                  animate={isBookmarked ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>

          {/* Comments Section - Slide Up Panel */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                ref={commentRef}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-50 max-w-md mx-auto"
              >
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowComments(false)}
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                />
                
                {/* Panel */}
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-white to-[#F8F5FF] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
                >
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                  </div>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-[#1D2956] text-xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#1D2956] flex items-center justify-center shadow-lg">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      Comments
                      <span className="text-sm font-normal text-gray-400">({comments.length})</span>
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowComments(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </motion.button>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-3 border-[#536DFE] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : comments.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <motion.div 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 flex items-center justify-center mb-4 mx-auto shadow-inner"
                        >
                          <Sparkles className="w-10 h-10 text-[#536DFE]/40" />
                        </motion.div>
                        <p className="text-gray-500 text-sm font-medium">No comments yet</p>
                        <p className="text-gray-400 text-xs mt-1">Be the first to share your thoughts!</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {comments.map((comment, idx) => {
                            const displayName = comment.display_name || `Guest ${comment.customer_id.slice(0, 6).toUpperCase()}`;
                            const commentInitials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

                            return (
                              <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className="flex items-start gap-4 bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white/60 shadow-lg shadow-black/5"
                              >
                                <motion.div 
                                  whileHover={{ rotate: 5 }}
                                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#1D2956] text-sm flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
                                >
                                  {commentInitials}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[#1D2956] text-sm font-bold truncate">{displayName}</span>
                                    <span className="text-gray-400 text-xs whitespace-nowrap font-medium">{formatTimeAgo(comment.created_at)}</span>
                                  </div>
                                  <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="px-5 py-4 border-t border-gray-100 bg-white/50 backdrop-blur-md">
                    {currentUserId ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onFocus={() => setCommentFocus(true)}
                            onBlur={() => setCommentFocus(false)}
                            disabled={submittingComment}
                            className={`h-24 text-sm resize-none border-2 bg-white text-[#1D2956] placeholder:text-gray-400 rounded-2xl mb-3 transition-all duration-300 ${
                              commentFocus ? 'border-[#536DFE] shadow-lg shadow-[#536DFE]/20' : 'border-gray-200'
                            }`}
                          />
                          <AnimatePresence>
                            {commentFocus && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-lg"
                              >
                                <Sparkles className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="h-12 px-8 text-sm rounded-2xl bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] hover:from-[#536DFE]/90 hover:to-[#6B7FFF]/90 text-white shadow-xl shadow-[#536DFE]/30 font-bold transition-all duration-300"
                            disabled={!newComment.trim() || submittingComment}
                            onClick={handleAddComment}
                          >
                            {submittingComment ? (
                              <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Posting...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Post Comment
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 text-center"
                      >
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#536DFE]/10 to-[#1D2956]/10 flex items-center justify-center mb-4 mx-auto">
                          <User className="w-8 h-8 text-[#536DFE]" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Sign in to leave a comment</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default BlogPostDetail;
