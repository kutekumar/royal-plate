import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

const RestaurantSettings = () => {
  const [formData, setFormData] = useState({
    name: 'Yangon Bistro',
    address: '123 Main Street, Yangon',
    phone: '+95 9 123 456 789',
    description: 'Premium Myanmar cuisine with a modern twist. Experience authentic flavors in a luxurious setting.',
    coverPhoto: '/placeholder.svg',
    openHours: '9:00 AM - 10:00 PM'
  });

  const handleSave = () => {
    toast.success('Restaurant information updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Restaurant Settings</h2>
        <p className="text-muted-foreground">Update your restaurant information</p>
      </div>

      <Card className="border-border/50 luxury-shadow">
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Update your restaurant details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Photo */}
          <div className="space-y-2">
            <Label>Cover Photo</Label>
            <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
              <img
                src={formData.coverPhoto}
                alt="Restaurant cover"
                className="w-full h-full object-cover"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </Button>
            </div>
          </div>

          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Open Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Open Hours</Label>
            <Input
              id="hours"
              value={formData.openHours}
              onChange={(e) => setFormData({ ...formData, openHours: e.target.value })}
              placeholder="9:00 AM - 10:00 PM"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Tell customers about your restaurant..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="luxury-gradient">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSettings;
