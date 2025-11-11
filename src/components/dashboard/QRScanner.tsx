import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Consider secure-context rules:
  // - Live camera requires HTTPS or localhost/127.0.0.1.
  // - File scan is allowed everywhere.
  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const startScanning = () => {
    // If a previous scanner exists, clear it first to avoid "element not found" issues
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }

    setScanning(true);

    // Defer initialization until after the DOM updates so #qr-reader definitely exists
    setTimeout(() => {
      const container = document.getElementById('qr-reader');
      if (!container) {
        console.error('qr-reader container not found at init time');
        toast.error('Unable to start scanner. Please try again.');
        setScanning(false);
        return;
      }

      // Always enable FILE mode so laptops/desktops can upload images.
      // On secure origins (localhost/HTTPS) also enable CAMERA mode.
      const config: any = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: isSecure
          ? [
              Html5QrcodeScanType.SCAN_TYPE_CAMERA,
              Html5QrcodeScanType.SCAN_TYPE_FILE,
            ]
          : [Html5QrcodeScanType.SCAN_TYPE_FILE],
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);

      scanner.render(
        async (decodedText) => {
          setVerifying(true);
          try {
            // Parse QR code content (supports plain or JSON payloads)
            let qrValue = decodedText;
            try {
              const parsed = JSON.parse(decodedText);
              qrValue =
                parsed.qr_code ||
                parsed.qrCode ||
                parsed.orderId ||
                parsed.id ||
                decodedText;
            } catch {
              // not JSON; use raw decodedText
            }

            // Match what Payment generates: qr_code stored equals qrData string
            const { data, error } = await supabase
              .from('orders')
              .select(
                `
                *,
                profiles (full_name),
                restaurants (name)
              `
              )
              .eq('qr_code', qrValue)
              .single();

            if (error || !data) {
              console.error('Order fetch error:', error);
              toast.error('Order not found for this QR code');
              return;
            }

            setScannedOrder(data);
            toast.success('Order verified successfully!');
            stopScanning();
          } catch (error) {
            console.error('Error verifying order:', error);
            toast.error('Failed to verify order');
          } finally {
            setVerifying(false);
          }
        },
        (errorMessage) => {
          // html5-qrcode emits many benign messages; only log significant ones
          if (
            typeof errorMessage === 'string' &&
            !errorMessage.toLowerCase().includes('not found') &&
            !errorMessage.toLowerCase().includes('no qr code') &&
            !errorMessage.toLowerCase().includes('inactive')
          ) {
            console.debug('QR scan error:', errorMessage);
          }
        }
      );

      scannerRef.current = scanner;
    }, 0);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  const markAsServed = async () => {
    if (!scannedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', scannedOrder.id);

      if (error) throw error;

      toast.success('Order marked as served!');
      setScannedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">QR Scanner</h2>
        <p className="text-muted-foreground">Scan customer booking QR codes</p>
      </div>

      {!scanning && !scannedOrder && (
        <Card className="border-border/50 luxury-shadow">
          <CardContent className="py-12 text-center space-y-4">
            <Camera className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-muted-foreground mb-2">
                Start the scanner to use your camera or upload a QR code image.
              </p>
              {!isSecure && (
                <p className="text-sm text-yellow-600 mb-2">
                  Live camera requires HTTPS or localhost. On this origin, only image upload will be available.
                </p>
              )}
              <Button onClick={startScanning} className="luxury-gradient" size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {scanning && (
        <Card className="border-border/50 luxury-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Scan QR Code</span>
              <span className="text-[0.65rem] font-normal text-muted-foreground">
                Align customer QR within the frame
              </span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              {isSecure
                ? 'Choose your camera if available, or upload a QR screenshot. Use landscape for best view.'
                : 'On this connection only image upload is available. Use a screenshot/photo of the QR code.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/*
              Scanner container:
              - Center scan-region icon/video
              - Make camera select full-width with bigger padding
              - Place Start/Stop/Scan File on separate lines with spacing
            */}
            <div
              id="qr-reader"
              className="
                w-full rounded-2xl border border-border/40 bg-muted/40
                px-3 py-4 md:px-5 md:py-6
                flex flex-col items-stretch
                gap-4
              "
            >
              {/* Style overrides for html5-qrcode DOM elements */}
              <style>{`
                /* 1. Center content in scan region (including default icon/video) */
                #qr-reader__scan_region {
                  display: flex !important;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                  gap: 8px;
                }

                #qr-reader__scan_region img,
                #qr-reader__scan_region svg {
                  margin: 0 auto;
                }

                /* 2. Make camera select large, touch-friendly, and separated */
                #html5-qrcode-select-camera {
                  width: 100% !important;
                  padding: 10px 14px !important;
                  margin: 8px 0 4px 0 !important;
                  border-radius: 9999px !important;
                  font-size: 0.8rem !important;
                }

                /* 3. Lay out dashboard controls vertically with spacing */
                #qr-reader__dashboard {
                  display: flex;
                  flex-direction: column;
                  align-items: stretch;
                  gap: 8px;
                  padding-top: 4px;
                }

                /* 4. Ensure each button is on its own line, full-width, with space */
                #qr-reader__dashboard .html5-qrcode-element,
                #qr-reader__dashboard button {
                  display: block !important;
                  width: 100% !important;
                  margin: 2px 0 !important;
                  text-align: center !important;
                }

                #qr-reader__dashboard button {
                  padding: 9px 14px !important;
                  border-radius: 9999px !important;
                  font-size: 0.8rem !important;
                }

                /* Specifically separate the camera stop button from others */
                #html5-qrcode-button-camera-stop {
                  margin-top: 10px !important;
                }

                /* Video aesthetics */
                #qr-reader__scan_region video {
                  border-radius: 18px;
                  max-height: 260px;
                  object-fit: cover;
                }

                @media (min-width: 640px) {
                  #qr-reader__dashboard {
                    max-width: 420px;
                    align-self: center;
                  }
                }
              `}</style>

              {/* Labels / helper text above controls */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="text-[0.7rem] font-semibold text-muted-foreground tracking-wide uppercase">
                  Select Camera
                </div>
                <div className="text-[0.65rem] text-muted-foreground">
                  Choose front or back camera from the dropdown below.
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <div className="text-[0.7rem] font-semibold text-foreground">
                  Scan Options
                </div>
                <div className="text-[0.65rem] text-muted-foreground">
                  Use “Start Scanning” for live camera or “Scan an Image File” to upload a QR screenshot.
                </div>
              </div>
            </div>

            {/* Helper layout hint */}
            <div className="text-[0.65rem] text-muted-foreground text-center px-3">
              If camera buttons or options are hidden, scroll inside the scanner box or rotate your phone.
            </div>

            <Button
              onClick={stopScanning}
              variant="outline"
              className="w-full mt-1 md:mt-2"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          </CardContent>
        </Card>
      )}

      {scannedOrder && (
        <Card className="border-border/50 luxury-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Order Details</CardTitle>
            <CardDescription>
              Order ID: {scannedOrder.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{scannedOrder.profiles?.full_name || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restaurant:</span>
                <span className="font-medium">{scannedOrder.restaurants?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Type:</span>
                <span className="font-medium capitalize">{scannedOrder.order_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{scannedOrder.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Items:</h4>
              <ul className="space-y-1">
                {scannedOrder.order_items.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.price * item.quantity).toLocaleString()} MMK</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">{scannedOrder.total_amount.toLocaleString()} MMK</span>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={markAsServed} className="flex-1 luxury-gradient" size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark as Served
              </Button>
              <Button onClick={() => setScannedOrder(null)} variant="outline" className="flex-1" size="lg">
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRScanner;
