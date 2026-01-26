import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, restaurant, orderType } = location.state || {};

  if (!order || !restaurant) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Success Icon */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-full luxury-gradient flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center">Payment Successful!</h1>
          <p className="text-muted-foreground text-center">
            {orderType === 'dine_in' ? 'Your table is ready' : 'Your order is confirmed'}
          </p>
        </div>

        {/* QR Code Card */}
        <Card className="p-6 space-y-4 luxury-shadow">
          <div className="text-center space-y-2">
            <h2 className="font-semibold text-lg">Your QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Show this code at {restaurant.name} to confirm your booking
            </p>
          </div>

          <div className="flex justify-center p-6 bg-white rounded-lg">
            <QRCodeSVG
              value={order.qr_code}
              size={200}
              level="H"
              includeMargin
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restaurant</span>
              <span className="font-medium">{restaurant.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{orderType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-primary">
                {order.total_amount.toLocaleString()} MMK
              </span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/orders')}
            className="w-full luxury-gradient"
            size="lg"
          >
            View My Orders
          </Button>
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          A confirmation has been sent to your registered email
        </p>
      </div>
    </div>
  );
};

export default Confirmation;
