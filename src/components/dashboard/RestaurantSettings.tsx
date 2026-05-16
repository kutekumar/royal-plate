import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, Loader2, Store, MapPin, Phone, Clock, FileText, Image as ImageIcon, CheckCircle2, X, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const RestaurantSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', description: '', image_url: '', open_hours: '' });

  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'about', label: 'About', icon: FileText },
  ];

  useEffect(() => {
    if (user) fetchRestaurantData();
  }, [user]);

  const fetchRestaurantData = async () => {
    try {
      const { data } = await supabase.from('restaurants').select('*').eq('owner_id', user?.id).single();
      if (!data) return;

      setRestaurantId(data.id);
      setFormData({ name: data.name, address: data.address, phone: data.phone || '', description: data.description || '', image_url: data.image_url || '', open_hours: data.open_hours || '' });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('restaurants').update({
        name: formData.name, address: formData.address, phone: formData.phone, description: formData.description, image_url: formData.image_url, open_hours: formData.open_hours,
      }).eq('id', restaurantId);

      if (error) throw error;
      toast.success('Restaurant information updated successfully!');
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Failed to update restaurant information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-royal-blue rounded-full animate-pulse-soft" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-royal-blue font-montserrat">Settings</h2>
        <p className="text-sm text-gray-500">Manage your restaurant profile and information</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Section Navigation */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive ? 'bg-royal-blue text-white shadow-sm shadow-royal-blue/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cover Photo - Always shown */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Restaurant cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No cover image set</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 right-4">
                <label className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-xs font-semibold text-gray-700 shadow-sm cursor-pointer hover:bg-white transition-all flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Change Cover
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="hidden"
                    placeholder="Paste image URL..."
                  />
                </label>
              </div>
            </div>

            {/* Image URL Input */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Paste image URL..."
                  className="flex-1 bg-transparent text-xs text-gray-600 placeholder:text-gray-400 border-none outline-none"
                />
                {formData.image_url && (
                  <button onClick={() => setFormData({ ...formData, image_url: '' })} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* General Section */}
              {activeSection === 'general' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-royal-blue font-montserrat">General Information</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Basic details about your restaurant</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Restaurant Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-11 pl-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contact Section */}
              {activeSection === 'contact' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-royal-blue font-montserrat">Contact Information</h3>
                    <p className="text-xs text-gray-500 mt-0.5">How customers can reach you</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 pl-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hours Section */}
              {activeSection === 'hours' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-royal-blue font-montserrat">Operating Hours</h3>
                    <p className="text-xs text-gray-500 mt-0.5">When your restaurant is open</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Open Hours</Label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={formData.open_hours} onChange={(e) => setFormData({ ...formData, open_hours: e.target.value })} placeholder="9:00 AM - 10:00 PM" className="h-11 pl-10 text-sm border-gray-200 rounded-xl focus:ring-royal-blue/20" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* About Section */}
              {activeSection === 'about' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-royal-blue font-montserrat">About</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Tell customers your story</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      placeholder="Tell customers about your restaurant..."
                      className="border-gray-200 rounded-xl text-sm focus:ring-royal-blue/20 resize-none"
                    />
                    <p className="text-[10px] text-gray-400">{formData.description.length} characters</p>
                  </div>
                </motion.div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <p className="text-[11px] text-gray-400">Changes are saved to your restaurant profile</p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-sm shadow-royal-blue/20 hover:shadow-md hover:shadow-royal-blue/30 transition-all rounded-xl h-10 px-6 text-sm font-semibold gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
