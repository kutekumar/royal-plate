import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Mohinga',
    price: 2000,
    category: 'Traditional',
    image: '/placeholder.svg',
    available: true
  },
  {
    id: '2',
    name: 'Shan Noodles',
    price: 2500,
    category: 'Noodles',
    image: '/placeholder.svg',
    available: true
  },
  {
    id: '3',
    name: 'Laphet Thoke',
    price: 3000,
    category: 'Salad',
    image: '/placeholder.svg',
    available: false
  }
];

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    available: true
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', category: '', image: '', available: true });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      available: item.available
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast.success('Menu item deleted');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingItem) {
      setMenuItems(menuItems.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData, price: parseFloat(formData.price) }
          : item
      ));
      toast.success('Menu item updated');
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image || '/placeholder.svg',
        available: formData.available
      };
      setMenuItems([...menuItems, newItem]);
      toast.success('Menu item added');
    }

    setIsDialogOpen(false);
  };

  const toggleAvailability = (id: string) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu Management</h2>
          <p className="text-muted-foreground">Manage your restaurant menu items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="luxury-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update' : 'Create'} a menu item for your restaurant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mohinga"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (MMK) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Traditional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/placeholder.svg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                />
                <Label htmlFor="available">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="luxury-gradient">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id} className="border-border/50 luxury-shadow">
            <CardHeader className="p-0">
              <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => toggleAvailability(item.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="text-xs">{item.category}</CardDescription>
                  </div>
                </div>
                <p className="text-xl font-bold text-primary">{item.price} MMK</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;
