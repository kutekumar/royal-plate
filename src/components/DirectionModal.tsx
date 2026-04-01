import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DirectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantAddress: string;
  destination: {
    lat: number;
    lng: number;
  };
  userLocation: { lat: number; lng: number } | null;
}

const DirectionModal: React.FC<DirectionModalProps> = ({
  isOpen,
  onClose,
  restaurantName,
  restaurantAddress,
  destination,
  userLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !mapRef.current || !destination.lat || !destination.lng) return;

    const startLat = userLocation?.lat || 16.8661;
    const startLng = userLocation?.lng || 96.1951;

    const initMap = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([
        [startLat, startLng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstanceRef.current = map;

      const destinationIcon = L.divIcon({
        className: 'custom-destination-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #536DFE, #6B7FFF);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(83, 109, 254, 0.5);
          ">
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(45deg);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const destMarker = L.marker([destination.lat, destination.lng], {
        icon: destinationIcon,
      }).addTo(map);
      destMarker.bindPopup(`
        <div style="padding: 8px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px; color: #1D2956;">${restaurantName}</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${restaurantAddress}</p>
        </div>
      `);
      destinationMarkerRef.current = destMarker;

      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: #22c55e;
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 2px 10px rgba(34, 197, 94, 0.5);
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 12,
          fillColor: '#22c55e',
          color: 'white',
          weight: 3,
          fillOpacity: 1,
        }).addTo(map);
        userMarkerRef.current = userMarker;
      }

      fetchRoute(startLat, startLng, destination.lat, destination.lng, map);
    };

    const fetchRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number, map: L.Map) => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMin = Math.round(route.duration / 60);
          
          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} min`,
          });

          if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
          }

          const routeCoords = route.geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
          );

          const routeLine = L.polyline(routeCoords, {
            color: '#536DFE',
            weight: 6,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '10, 10',
          }).addTo(map);

          routeLayerRef.current = routeLine;

          setTimeout(() => {
            setIsAnimating(true);
            animateRoute(routeCoords, map);
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        const line = L.polyline([
          [fromLat, fromLng],
          [toLat, toLng],
        ], {
          color: '#536DFE',
          weight: 6,
          opacity: 0.8,
          dashArray: '10, 10',
        }).addTo(map);
        routeLayerRef.current = line;
        setIsAnimating(true);
      }
    };

    const animateRoute = (coords: [number, number][], map: L.Map) => {
      let currentIndex = 0;
      const totalPoints = coords.length;
      
      const animatedLine = L.polyline([], {
        color: '#536DFE',
        weight: 6,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const step = Math.max(1, Math.floor(totalPoints / 100));

      const animate = () => {
        if (currentIndex < totalPoints) {
          const currentCoords = coords.slice(0, currentIndex + 1);
          animatedLine.setLatLngs(currentCoords);
          
          const progress = ((currentIndex + 1) / totalPoints) * 100;
          setAnimationProgress(progress);
          
          currentIndex += step;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animate();
    };

    initMap();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, destination, userLocation, restaurantName, restaurantAddress]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="absolute top-0 left-0 right-0 z-[9999] px-5 pt-12 pb-5 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold">Get Directions</h2>
                <p className="text-white/70 text-sm mt-1">{restaurantName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>

          {/* Map Container */}
          <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Route Info & Animation */}
          {routeInfo && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-32 left-5 right-5 z-[9999]"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#536DFE]/20 to-[#6B7FFF]/20 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-[#536DFE]" />
                    </div>
                    <div>
                      <p className="text-[#1D2956] font-bold text-lg">{routeInfo.distance}</p>
                      <p className="text-gray-400 text-xs">Estimated distance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#536DFE] font-bold text-lg">{routeInfo.duration}</p>
                    <p className="text-gray-400 text-xs">Travel time</p>
                  </div>
                </div>

                {/* Animation Progress Bar */}
                {isAnimating && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs font-medium">Route calculation...</span>
                      <span className="text-[#536DFE] text-xs font-bold">{Math.round(animationProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#536DFE] to-[#6B7FFF]"
                        initial={{ width: 0 }}
                        animate={{ width: `${animationProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}

                {!isAnimating && animationProgress === 100 && (
                  <div className="mt-3 flex items-center gap-2 text-green-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">Route ready!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Location Markers Legend */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-32 left-5 z-[9999]"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                <span className="text-gray-600 text-xs font-medium">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#536DFE] rounded-full border-2 border-white" />
                <span className="text-gray-600 text-xs font-medium">{restaurantName}</span>
              </div>
            </div>
          </motion.div>

          {/* Done Button */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-6 left-5 right-5 z-[9999]"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-[#536DFE]/40 hover:shadow-2xl hover:shadow-[#536DFE]/60 transition-all"
              style={{ position: 'relative', zIndex: 9999 }}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DirectionModal;