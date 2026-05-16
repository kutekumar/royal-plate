import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  LogOut,
  Trash2,
  Shield,
  FileText,
  ChevronRight,
  Info,
  User,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  Mail,
  ExternalLink,
  AlertTriangle,
  Check,
  X,
  Database,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';

import LogoImg from '@/imgs/logo.png';
import { useSoundContext } from '@/contexts/SoundContext';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { play, enabled: soundEnabled, setEnabled: setSoundEnabled } = useSoundContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    play('success');
    setShowLogoutConfirm(false);
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      play('error');
      toast.error('Failed to sign out');
    }
  };

  const handleClearCache = useCallback(async () => {
    setIsClearingCache(true);
    setShowClearCacheConfirm(false);
    try {
      // Clear local storage (except auth)
      const keysToKeep = ['supabase.auth.token'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          localStorage.removeItem(key);
        }
      });

      // Clear session storage
      sessionStorage.clear();

      // Clear cache storage (service worker caches)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setIsClearingCache(false);
    }
  }, []);

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.info('Please contact support to delete your account');
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          desc: 'Update your personal information',
          action: () => navigate('/profile'),
          color: 'from-[#536DFE] to-[#6B7FFF]',
        },
        {
          icon: Bell,
          label: 'Notifications',
          desc: 'Manage notification preferences',
          action: () => setNotificationsEnabled(!notificationsEnabled),
          toggle: true,
          toggleValue: notificationsEnabled,
          color: 'from-[#536DFE] to-[#6B7FFF]',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          desc: 'Toggle dark theme',
          action: () => setDarkMode(!darkMode),
          toggle: true,
          toggleValue: darkMode,
          color: 'from-[#1D2956] to-[#2D3966]',
        },
        {
          icon: Globe,
          label: 'Language',
          desc: 'English (US)',
          action: () => toast.info('Language settings coming soon'),
          color: 'from-[#1D2956] to-[#2D3966]',
        },
        {
          icon: soundEnabled ? Volume2 : VolumeX,
          label: 'Sound Effects',
          desc: soundEnabled ? 'Tap sounds enabled' : 'Tap sounds disabled',
          action: () => { play('tap'); setSoundEnabled(!soundEnabled); },
          toggle: true,
          toggleValue: soundEnabled,
          color: 'from-[#536DFE] to-[#6B7FFF]',
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: Database,
          label: 'Clear Cache',
          desc: 'Free up storage space',
          action: () => setShowClearCacheConfirm(true),
          color: 'from-[#FF6B6B] to-[#FF8E8E]',
        },
        {
          icon: RefreshCw,
          label: 'Sync Data',
          desc: 'Refresh your data',
          action: () => {
            toast.success('Data synced successfully');
          },
          color: 'from-[#4ECDC4] to-[#6EE7DF]',
        },
      ],
    },
    {
      title: 'Legal & Support',
      items: [
        {
          icon: Shield,
          label: 'Privacy Policy',
          desc: 'How we protect your data',
          action: () => toast.info('Privacy policy coming soon'),
          color: 'from-[#1D2956] to-[#2D3966]',
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          desc: 'Our terms and conditions',
          action: () => toast.info('Terms of service coming soon'),
          color: 'from-[#1D2956] to-[#2D3966]',
        },
        {
          icon: HelpCircle,
          label: 'Help & Support',
          desc: 'Get help with your account',
          action: () => toast.info('Support coming soon'),
          color: 'from-[#1D2956] to-[#2D3966]',
        },
        {
          icon: Mail,
          label: 'Contact Us',
          desc: 'Send us feedback',
          action: () => toast.info('Contact form coming soon'),
          color: 'from-[#1D2956] to-[#2D3966]',
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: LogOut,
          label: 'Sign Out',
          desc: 'Log out of your account',
          action: () => setShowLogoutConfirm(true),
          color: 'from-[#FF6B6B] to-[#FF8E8E]',
          danger: true,
        },
        {
          icon: Trash2,
          label: 'Delete Account',
          desc: 'Permanently delete your account',
          action: () => setShowDeleteConfirm(true),
          color: 'from-red-500 to-red-600',
          danger: true,
        },
      ],
    },
  ];

  return (
    <>
      
        <div className="relative flex h-screen w-full max-w-sm mx-auto flex-col overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FAFAFA] to-[#F0F0F2] font-poppins">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1
            }}
            style={{ willChange: 'transform, opacity' }}
            className="relative px-4 pt-6 pb-3 z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-transparent backdrop-blur-xl" />

            <div className="relative flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 hover:border-[#536DFE]/40 hover:shadow-xl transition-all shadow-lg shadow-black/5 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-[#1D2956]" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-[#1D2956] text-xl font-bold tracking-tight leading-none mb-1">
                  Settings
                </h1>
                <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-medium">
                  Manage your preferences
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-4 space-y-4">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3
              }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-white/60 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] flex items-center justify-center shadow-lg shadow-[#536DFE]/30">
                  <span className="text-white text-xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1D2956] font-bold text-base truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#536DFE]/10 to-[#6B7FFF]/10 flex items-center justify-center"
                >
                  <img src={LogoImg} alt="Royal Plate" className="w-6 h-6 object-contain" />
                </motion.div>
              </div>
            </motion.div>

            {/* Settings Groups */}
            {settingsGroups.map((group, groupIndex) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.4 + groupIndex * 0.1
                }}
              >
                <h3 className="text-[#1D2956] font-bold text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 px-1">
                  <div className={`w-1 h-3 rounded-full bg-gradient-to-b ${group.items[0].color}`} />
                  {group.title}
                </h3>
                <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/5 border border-white/60 overflow-hidden ${
                  group.title === 'Danger Zone' ? 'border-red-200/50' : ''
                }`}>
                  {group.items.map((item, itemIndex) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.5 + groupIndex * 0.1 + itemIndex * 0.05
                      }}
                      whileHover={{ x: 4, backgroundColor: item.danger ? 'rgba(255, 107, 107, 0.05)' : 'rgba(83, 109, 254, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all text-left ${
                        item.danger ? 'hover:bg-red-50/50' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${
                        item.danger
                          ? 'from-red-50 to-red-100'
                          : 'from-[#536DFE]/15 to-[#6B7FFF]/15'
                      } flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-[#536DFE]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${item.danger ? 'text-red-500' : 'text-[#1D2956]'}`}>
                          {item.label}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{item.desc}</p>
                      </div>
                      {item.toggle ? (
                        <div
                          className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                            item.toggleValue
                              ? 'bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] justify-end'
                              : 'bg-gray-200 justify-start'
                          }`}
                        >
                          <motion.div
                            layout
                            className="w-5 h-5 rounded-full bg-white shadow-lg"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </div>
                      ) : (
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${item.danger ? 'text-red-300' : 'text-gray-300'}`} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* App Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 1.0
              }}
              className="text-center py-4"
            >
              <img src={LogoImg} alt="Royal Plate" className="w-10 h-10 mx-auto mb-2 object-contain opacity-60" />
              <p className="text-[#1D2956] text-xs font-bold">Royal Plate</p>
              <p className="text-gray-400 text-[10px] mt-1">Version 1.0.0</p>
              <p className="text-gray-300 text-[9px] mt-1">
                Powered by Mingalar Mon
              </p>
            </motion.div>
          </div>

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-4 w-full max-w-sm shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-3">
                    <LogOut className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-[#1D2956] text-lg font-bold text-center mb-2">
                    Sign Out?
                  </h3>
                  <p className="text-gray-400 text-xs text-center mb-4">
                    Are you sure you want to sign out of your account?
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignOut}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
                    >
                      Sign Out
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear Cache Confirmation Modal */}
          <AnimatePresence>
            {showClearCacheConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowClearCacheConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-4 w-full max-w-sm shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mx-auto mb-3">
                    <Database className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-[#1D2956] text-lg font-bold text-center mb-2">
                    Clear Cache?
                  </h3>
                  <p className="text-gray-400 text-xs text-center mb-4">
                    This will clear temporary data. Your account and orders will not be affected.
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowClearCacheConfirm(false)}
                      className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClearCache}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
                    >
                      Clear Cache
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Account Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-4 w-full max-w-sm shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-[#1D2956] text-lg font-bold text-center mb-2">
                    Delete Account?
                  </h3>
                  <p className="text-gray-400 text-xs text-center mb-4">
                    This action is permanent. All your data, orders, and rewards will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </>
  );
};

export default Settings;
