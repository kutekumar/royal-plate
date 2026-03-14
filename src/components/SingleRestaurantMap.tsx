import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../utils/location';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SingleRestaurantMapProps {
  name: string;
  address: string;
  coordinates: Coordinates;
  height?: string;
  userLocation?: Coordinates | null;
}

export default function SingleRestaurantMap({
  name,
  address,
  coordinates,
  height = '300px',
  userLocation,
}: SingleRestaurantMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on restaurant
    const map = L.map(mapContainerRef.current).setView(
      [coordinates.latitude, coordinates.longitude],
      15
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Restaurant marker with custom icon
    const restaurantIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 50px;
          height: 50px;
          background: white;
          border: 4px solid #536DFE;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <img src="/logo.png" alt="Royal Plate" style="width: 30px; height: 30px; object-fit: contain;" />
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
    });

    const restaurantMarker = L.marker([coordinates.latitude, coordinates.longitude], {
      icon: restaurantIcon,
    }).addTo(map);

    restaurantMarker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="color: #536DFE; font-size: 16px;">${name}</strong>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${address}</p>
      </div>
    `).openPopup();

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(map).bindPopup('Your Location');

      // Draw line between user and restaurant
      L.polyline(
        [
          [userLocation.latitude, userLocation.longitude],
          [coordinates.latitude, coordinates.longitude],
        ],
        {
          color: '#536DFE',
          weight: 3,
          opacity: 0.6,
          dashArray: '10, 10',
        }
      ).addTo(map);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [coordinates.latitude, coordinates.longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, name, address, userLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className="shadow-lg"
    />
  );
}
