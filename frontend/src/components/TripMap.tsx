'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface StopPoint {
  id: string;
  city_name: string;
  country_name?: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  arrival_date?: string;
}

interface TripMapProps {
  stops: StopPoint[];
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
}

export default function TripMap({ stops, selectedStopId, onSelectStop }: TripMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);
  const [Polyline, setPolyline] = useState<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((leaflet) => {
      import('react-leaflet').then((reactLeaflet) => {
        setL(leaflet.default);
        setMapContainer(() => reactLeaflet.MapContainer);
        setTileLayer(() => reactLeaflet.TileLayer);
        setMarker(() => reactLeaflet.Marker);
        setPopup(() => reactLeaflet.Popup);
        setPolyline(() => reactLeaflet.Polyline);
      });
    });
  }, []);

  if (!isClient || !MapContainer || !TileLayer || !Marker || !L) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3 animate-pulse">
        <Compass className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-xs text-slate-500">Loading Interactive Globe Map...</span>
      </div>
    );
  }

  const defaultCenter: [number, number] = stops.length > 0
    ? [stops[0].latitude, stops[0].longitude]
    : [24.5854, 73.7125];

  const polylineCoords: [number, number][] = stops.map(s => [s.latitude, s.longitude]);

  const createCustomIcon = (order: number, isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-amber-500 ring-4 ring-amber-500/40 scale-125' : 'bg-sky-500 ring-2 ring-white'} text-white font-extrabold text-xs flex items-center justify-center shadow-xl transition-all">
            ${order}
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${isSelected ? 'bg-amber-500' : 'bg-sky-500'} rotate-45"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  return (
    <div className="w-full h-[400px] lg:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative">
      <MapContainer
        center={defaultCenter}
        zoom={stops.length > 1 ? 6 : 9}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            color="#0284c7"
            weight={4}
            opacity={0.85}
            dashArray="8, 12"
          />
        )}

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={createCustomIcon(stop.stop_order, stop.id === selectedStopId)}
            eventHandlers={{
              click: () => onSelectStop && onSelectStop(stop.id),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[160px]">
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 mb-1">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span>Stop #{stop.stop_order}: {stop.city_name}</span>
                </div>
                {stop.country_name && (
                  <div className="text-xs text-slate-500 mb-1.5">{stop.country_name}</div>
                )}
                {stop.arrival_date && (
                  <div className="text-[11px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full inline-block">
                    Arrive: {stop.arrival_date}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Route Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 glass-card px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-3 text-xs text-slate-700 font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <span>Trip Stops</span>
        </div>
        <div className="w-px h-3 bg-slate-300"></div>
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-sky-500" />
          <span>Highway Route</span>
        </div>
      </div>
    </div>
  );
}
