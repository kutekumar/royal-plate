import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Loader2, Search, Image as ImageIcon, FolderOpen, LayoutGrid, List, Package, Star, Eye, EyeOff, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
}

const MenuManagement = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuPage, setMenuPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [formData, setFormData] = useState({ name: '', description: '', price: '', image_url: '' });

  useEffect(() => {
    if (user) fetchRestaurantAndMenu();
  }, [user]);

  const fetchRestaurantAndMenu = async () => {
    try {
      const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user?.id).single();
      if (!restaurant) return;
      setRestaurantId(restaurant.id);

      const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('created_at', { ascending: false });
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', image_url: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item.id);
    setFormData({ name: item.name, description: item.description || '', price: item.price.toString(), image_url: item.image_url || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast.success('Menu item deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !restaurantId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const itemData = { name: formData.name, description: formData.description || null, price: parseFloat(formData.price), image_url: formData.image_url || null, restaurant_id: restaurantId };

      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(itemData).eq('id', editingItem);
        if (error) throw error;
        setMenuItems(prev => prev.map(item => item.id === editingItem ? { ...item, ...itemData } : item));
        toast.success('Menu item updated');
      } else {
        const { data, error } = await supabase.from('menu_items').insert([{ ...itemData, available: true }]).select().single();
        if (error) throw error;
        setMenuItems(prev => [data, ...prev]);
        toast.success('Menu item added');
      }

      setIsDialogOpen(false);
      setFormData({ name: '', description: '', price: '', image_url: '' });
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    try {
      const { error } = await supabase.from('menu_items').update({ available: !item.available }).eq('id', id);
      if (error) throw error;
      setMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
      toast.success(item.available ? 'Item hidden from menu' : 'Item now visible on menu');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const filteredItems = menuItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMenuPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((menuPage - 1) * ITEMS_PER_PAGE, menuPage * ITEMS_PER_PAGE);

  const availableCount = menuItems.filter(i => i.available).length;
  const hiddenCount = menuItems.filter(i => !i.available).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-royal-blue font-montserrat">Menu</h2>
          <p className="text-sm text-gray-500">Curate your restaurant offerings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-royal-blue text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-royal-blue text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button onClick={handleAdd} className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 hover:shadow-md hover:shadow-royal-blue/30 transition-all rounded-xl px-4 h-9 text-xs font-semibold gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <div className="px-3 py-2 bg-white rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-500 font-medium">{menuItems.length} Total</p>
          </div>
          <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-[10px] text-emerald-700 font-medium">{availableCount} Available</p>
          </div>
          <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-500 font-medium">{hiddenCount} Hidden</p>
          </div>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setMenuPage(1); }}
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue/40 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-royal-blue rounded-full animate-pulse-soft" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Loading menu...</p>
          </div>
        </div>
      ) : menuItems.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">Your menu is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add your first menu item to get started</p>
          <Button onClick={handleAdd} className="mt-4 bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Menu Item
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {paginatedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/40 hover:border-gray-200 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {!item.available && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-white/90 rounded-xl text-xs font-semibold text-gray-500 shadow-sm border border-gray-200">Currently Hidden</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:bg-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <p className="text-base font-bold text-royal-blue font-montserrat flex-shrink-0">{item.price.toLocaleString()} <span className="text-[9px] font-medium text-gray-500">MMK</span></p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                        item.available ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {item.available ? (
                        <><Eye className="w-3 h-3" /> Visible</>
                      ) : (
                        <><EyeOff className="w-3 h-3" /> Hidden</>
                      )}
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium">ID: {item.id.substring(0, 6)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <AnimatePresence>
            {paginatedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                  {item.description && <p className="text-[11px] text-gray-500 truncate">{item.description}</p>}
                </div>
                <p className="text-sm font-bold text-royal-blue font-montserrat flex-shrink-0">{item.price.toLocaleString()} MMK</p>
                <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item.id)} className="data-[state=checked]:bg-emerald-500" />
                <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-royal-blue hover:border-royal-blue/20 transition-all opacity-0 group-hover:opacity-100">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
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
              <Fragment key={p}>
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
              </Fragment>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-gray-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-royal-blue font-montserrat">{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Image preview */}
            {formData.image_url && (
              <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-white"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="h-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Traditional Mohinga"
                  className="h-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Price (MMK) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                  className="h-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the dish..."
                rows={3}
                className="w-full h-24 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue/40 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-10 px-5 border-gray-200 text-sm">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm rounded-xl h-10 px-5 text-sm font-semibold">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
