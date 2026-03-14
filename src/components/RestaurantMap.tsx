import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../utils/location';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Restaurant {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center?: Coordinates;
  zoom?: number;
  height?: string;
  onMarkerClick?: (restaurantId: string) => void;
  selectedRestaurantId?: string;
}

export default function RestaurantMap({
  restaurants,
  center = { latitude: 16.8661, longitude: 96.1951 }, // Yangon center
  zoom = 13,
  height = '400px',
  onMarkerClick,
  selectedRestaurantId,
}: RestaurantMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(
      [center.latitude, center.longitude],
      zoom
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Create custom icon for Royal Plate restaurants
    const royalPlateIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: white;
          border: 3px solid #536DFE;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <img src="/logo.png" alt="Royal Plate" style="width: 24px; height: 24px; object-fit: contain;" />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    // Add markers for restaurants with coordinates
    const validRestaurants = restaurants.filter(
      (r) => r.latitude && r.longitude
    );

    validRestaurants.forEach((restaurant) => {
      if (!restaurant.latitude || !restaurant.longitude) return;

      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        icon: royalPlateIcon,
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #536DFE; font-size: 14px;">${restaurant.name}</strong>
          ${restaurant.address ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${restaurant.address}</p>` : ''}
        </div>
      `);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(restaurant.id));
      }

      markersRef.current.set(restaurant.id, marker);
    });

    // Fit bounds to show all markers
    if (validRestaurants.length > 0) {
      const bounds = L.latLngBounds(
        validRestaurants.map((r) => [r.latitude!, r.longitude!])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [restaurants, onMarkerClick]);

  // Highlight selected restaurant
  useEffect(() => {
    if (!selectedRestaurantId || !mapRef.current) return;

    const marker = markersRef.current.get(selectedRestaurantId);
    if (marker) {
      marker.openPopup();
      mapRef.current.setView(marker.getLatLng(), 15, { animate: true });
    }
  }, [selectedRestaurantId]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className="shadow-lg"
    />
  );
}
