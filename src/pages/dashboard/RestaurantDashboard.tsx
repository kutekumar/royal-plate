import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import OrdersManagement from '@/components/dashboard/OrdersManagement';
import QRScanner from '@/components/dashboard/QRScanner';
import MenuManagement from '@/components/dashboard/MenuManagement';
import RestaurantSettings from '@/components/dashboard/RestaurantSettings';

const RestaurantDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full luxury-gradient flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Restaurant Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage your restaurant</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="scanner" className="mt-0">
            <QRScanner />
          </TabsContent>

          <TabsContent value="menu" className="mt-0">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <RestaurantSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
