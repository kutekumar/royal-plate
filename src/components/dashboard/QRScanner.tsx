import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, XCircle, Scan, Smartphone, Loader2, User, Store, ShoppingBag, Clock, Crown, ShieldCheck } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [verifying, setVerifying] = useState(false);

  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const initScanner = async () => {
    const container = document.getElementById('qr-reader');
    if (!container) {
      toast.error('Unable to start scanner. Please try again.');
      setScanning(false);
      return;
    }

    let scanTypes;
    if (!isSecure) {
      scanTypes = [Html5QrcodeScanType.SCAN_TYPE_FILE];
    } else {
      try {
        const devices = await Html5Qrcode.getCameras();
        const hasCamera = devices && devices.length > 0;
        scanTypes = hasCamera
          ? [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE]
          : [Html5QrcodeScanType.SCAN_TYPE_FILE];
        if (!hasCamera) {
          toast.info('No camera detected — using file upload mode');
        }
      } catch {
        scanTypes = [Html5QrcodeScanType.SCAN_TYPE_FILE];
        toast.info('Camera unavailable — using file upload mode');
      }
    }

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10, qrbox: { width: 280, height: 280 }, rememberLastUsedCamera: true, aspectRatio: 1.0, showTorchButtonIfSupported: true,
      supportedScanTypes: scanTypes,
    }, false);

    scanner.render(
      async (decodedText) => {
        setVerifying(true);
        try {
          let qrValue = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            qrValue = parsed.qr_code || parsed.qrCode || parsed.orderId || parsed.id || decodedText;
          } catch { }

          const { data, error } = await supabase.from('orders').select('*, profiles (full_name), restaurants (name)').eq('qr_code', qrValue).single();

          if (error || !data) {
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
        if (typeof errorMessage === 'string' && !errorMessage.toLowerCase().includes('not found') && !errorMessage.toLowerCase().includes('no qr code') && !errorMessage.toLowerCase().includes('inactive')) {
          console.debug('QR scan error:', errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
  };

  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => {
      initScanner();
    }, 350);
    return () => clearTimeout(timer);
  }, [scanning]);

  const startScanning = () => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch { }
      scannerRef.current = null;
    }
    setScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) { scannerRef.current.clear(); scannerRef.current = null; }
    setScanning(false);
  };

  useEffect(() => {
    return () => { if (scannerRef.current) { scannerRef.current.clear(); scannerRef.current = null; } };
  }, []);

  const markAsServed = async () => {
    if (!scannedOrder) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', scannedOrder.id);
      if (error) throw error;
      toast.success('Order marked as completed!');
      setScannedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-royal-blue font-montserrat">QR Scanner</h2>
        <p className="text-sm text-gray-500">Scan customer QR codes to verify and serve orders</p>
      </div>

      <AnimatePresence mode="wait">
        {!scanning && !scannedOrder && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="py-16 px-6 text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-royal-blue/10 to-brand-blue/10 border border-royal-blue/20 flex items-center justify-center">
                <Scan className="w-9 h-9 text-royal-blue" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-royal-blue font-montserrat mb-1">Ready to Scan</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Start the scanner to verify customer orders using their QR code</p>
              </div>
              {!isSecure && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 font-medium">
                  <Smartphone className="w-3.5 h-3.5" />
                  Camera requires HTTPS — image upload available
                </div>
              )}
              <Button onClick={startScanning} size="lg" className="bg-gradient-to-br from-royal-blue to-royal-blue-dark text-white shadow-lg shadow-royal-blue/20 hover:shadow-xl hover:shadow-royal-blue/30 transition-all rounded-xl h-12 px-8 text-sm font-semibold gap-2">
                <Camera className="w-5 h-5" />
                Start Scanner
              </Button>
            </div>
          </motion.div>
        )}

        {scanning && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-royal-blue font-montserrat">Scan QR Code</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Align the customer's QR code within the frame</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
                  <span className="text-[10px] font-medium text-green-600">Active</span>
                </div>
              </div>

              {verifying && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-royal-blue" />
                    <p className="text-sm font-medium text-gray-600">Verifying order...</p>
                  </div>
                </div>
              )}

              <div
                id="qr-reader"
                className="w-full rounded-2xl border-2 border-dashed border-royal-blue/20 bg-gradient-to-br from-royal-blue/[0.02] to-brand-blue/[0.02] px-4 py-6 md:px-6 md:py-8 flex flex-col items-stretch gap-4 relative"
              >
                <style>{`
                  #qr-reader__scan_region { display: flex !important; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; }
                  #qr-reader__scan_region img, #qr-reader__scan_region svg { margin: 0 auto; }
                  #html5-qrcode-select-camera { width: 100% !important; padding: 10px 16px !important; margin: 8px 0 4px 0 !important; border-radius: 12px !important; font-size: 0.8rem !important; border: 1px solid #e5e7eb !important; background: #f9fafb !important; }
                  #qr-reader__dashboard { display: flex; flex-direction: column; align-items: stretch; gap: 8px; padding-top: 4px; }
                  #qr-reader__dashboard .html5-qrcode-element, #qr-reader__dashboard button { display: block !important; width: 100% !important; margin: 2px 0 !important; text-align: center !important; }
                  #qr-reader__dashboard button { padding: 10px 16px !important; border-radius: 12px !important; font-size: 0.8rem !important; font-weight: 600 !important; transition: all 0.2s !important; }
                  #html5-qrcode-button-camera-stop { margin-top: 10px !important; background: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fecaca !important; }
                  #html5-qrcode-button-camera-start { background: #1D2956 !important; color: white !important; border: none !important; }
                  #qr-reader__scan_region video { border-radius: 16px; max-height: 280px; object-fit: cover; box-shadow: 0 4px 24px rgba(29,41,86,0.08); }
                  #qr-reader__dashboard_section_csr { border: none !important; }
                  #qr-reader__dashboard_section_swap_link { display: none !important; }
                  @media (min-width: 640px) { #qr-reader__dashboard { max-width: 420px; align-self: center; } }
                `}</style>

                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-royal-blue/5 border border-royal-blue/10 flex items-center justify-center mb-1">
                    <Camera className="w-7 h-7 text-royal-blue/60" />
                  </div>
                  <p className="text-xs text-gray-500 max-w-xs">Position the QR code within the scanning area. The scanner will automatically detect and verify the order.</p>
                </div>
              </div>

              <Button onClick={stopScanning} variant="outline" className="w-full rounded-xl h-11 border-gray-200 text-sm gap-2">
                <XCircle className="w-4 h-4" />
                Stop Scanner
              </Button>
            </div>
          </motion.div>
        )}

        {scannedOrder && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Success Banner */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Order Verified</p>
                  <p className="text-[11px] text-emerald-600">This QR code has been verified successfully</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Customer</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {scannedOrder.profiles?.full_name || 'Customer'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Restaurant</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    {scannedOrder.restaurants?.name}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                    {scannedOrder.order_type?.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Status</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {scannedOrder.status}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-2">Order Items</p>
                <ul className="space-y-1.5">
                  {scannedOrder.order_items?.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700"><span className="font-semibold text-gray-900">{item.quantity}x</span> {item.name}</span>
                      <span className="font-semibold text-gray-900">{(item.price * item.quantity).toLocaleString()} MMK</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-royal-blue/5 to-brand-blue/5 border border-royal-blue/10">
                <p className="text-sm font-semibold text-gray-700">Total Amount</p>
                <p className="text-xl font-bold text-royal-blue font-montserrat">{scannedOrder.total_amount.toLocaleString()} <span className="text-xs font-medium text-gray-500">MMK</span></p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={markAsServed} className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 transition-all rounded-xl h-11 text-sm font-semibold gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Completed
                </Button>
                <Button onClick={() => setScannedOrder(null)} variant="outline" className="flex-1 rounded-xl h-11 border-gray-200 text-sm gap-2">
                  <Scan className="w-4 h-4" />
                  Scan Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRScanner;
