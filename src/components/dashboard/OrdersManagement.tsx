import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, ShoppingBag, DollarSign } from 'lucide-react';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

interface Order {
  id: string;
  customerName: string;
  items: string[];
  type: 'dine-in' | 'takeaway';
  total: number;
  status: OrderStatus;
  time: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'John Doe',
    items: ['Mohinga', 'Tea'],
    type: 'dine-in',
    total: 4500,
    status: 'pending',
    time: '10:30 AM'
  },
  {
    id: 'ORD-002',
    customerName: 'Jane Smith',
    items: ['Shan Noodles', 'Coffee'],
    type: 'takeaway',
    total: 5000,
    status: 'preparing',
    time: '10:45 AM'
  },
  {
    id: 'ORD-003',
    customerName: 'David Wilson',
    items: ['Laphet Thoke', 'Fresh Lime Juice'],
    type: 'dine-in',
    total: 6000,
    status: 'ready',
    time: '11:00 AM'
  }
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      preparing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      ready: 'bg-green-500/20 text-green-700 dark:text-green-400',
      completed: 'bg-gray-500/20 text-gray-700 dark:text-gray-400'
    };
    return variants[status];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {orders.filter(o => o.status !== 'completed').length} Active
        </Badge>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="border-border/50 luxury-shadow hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {order.id}
                    <Badge variant={order.type === 'dine-in' ? 'default' : 'secondary'}>
                      {order.type === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {order.customerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.time}
                    </span>
                  </CardDescription>
                </div>
                <Badge className={getStatusBadge(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <ShoppingBag className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Items:</p>
                    <p className="text-sm text-muted-foreground">{order.items.join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-lg font-bold text-foreground">{order.total} MMK</span>
                  </div>

                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersManagement;
