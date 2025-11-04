import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, CheckCircle2, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';

interface ScannedOrder {
  orderId: string;
  customerName: string;
  items: string[];
  total: number;
  type: string;
}

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    setScannedOrder(null);

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      scannerDivId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Parse QR code data
        try {
          const orderData = JSON.parse(decodedText);
          setScannedOrder({
            orderId: orderData.orderId || 'Unknown',
            customerName: orderData.customerName || 'Guest',
            items: orderData.items || [],
            total: orderData.total || 0,
            type: orderData.type || 'dine-in'
          });
          toast.success('QR Code scanned successfully!');
          scanner.clear();
          setScanning(false);
        } catch (e) {
          // If not JSON, treat as order ID
          setScannedOrder({
            orderId: decodedText,
            customerName: 'Guest Customer',
            items: ['Mock Item 1', 'Mock Item 2'],
            total: 5000,
            type: 'dine-in'
          });
          toast.success('QR Code scanned successfully!');
          scanner.clear();
          setScanning(false);
        }
      },
      (error) => {
        // Ignore errors during scanning
        console.log('Scanning...', error);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setScanning(false);
    }
  };

  const markAsServed = () => {
    toast.success(`Order ${scannedOrder?.orderId} marked as served!`);
    setScannedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">QR Code Scanner</h2>
        <p className="text-muted-foreground">Scan customer booking QR codes</p>
      </div>

      <Card className="border-border/50 luxury-shadow">
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
          <CardDescription>Point your camera at the customer's QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scanning && !scannedOrder && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Camera className="w-16 h-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Click the button below to start scanning
              </p>
              <Button onClick={startScanning} className="luxury-gradient">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanner
              </Button>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div id={scannerDivId} className="w-full"></div>
              <Button onClick={stopScanning} variant="outline" className="w-full">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Scanner
              </Button>
            </div>
          )}

          {scannedOrder && (
            <div className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  QR Code successfully scanned!
                </AlertDescription>
              </Alert>

              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Order Details
                    <Badge variant="outline">{scannedOrder.orderId}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{scannedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge>{scannedOrder.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{scannedOrder.items.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold text-primary">{scannedOrder.total} MMK</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={markAsServed} className="flex-1 luxury-gradient">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Served
                    </Button>
                    <Button onClick={() => setScannedOrder(null)} variant="outline" className="flex-1">
                      Scan Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;
