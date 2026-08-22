'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Compass, Camera, Calendar } from 'lucide-react';
import { fetchPlacePhoto } from '../lib/unsplash';

interface StopPoint {
  id: string;
  city_name: string;
  country_name?: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  arrival_date?: string;
  departure_date?: string;
  image_url?: string;
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

  // Map stop ID -> resolved Unsplash image URL
  const [placePhotos, setPlacePhotos] = useState<Record<string, string>>({});
  const [activeStop, setActiveStop] = useState<string | null>(selectedStopId || null);

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

  // Fetch Unsplash photos for all stops
  useEffect(() => {
    if (stops && stops.length > 0) {
      stops.forEach(async (stop) => {
        const photoUrl = await fetchPlacePhoto(stop.city_name, stop.image_url);
        setPlacePhotos((prev) => ({ ...prev, [stop.id]: photoUrl }));
      });
    }
  }, [stops]);

  useEffect(() => {
    if (selectedStopId) setActiveStop(selectedStopId);
  }, [selectedStopId]);

  if (!isClient || !MapContainer || !TileLayer || !Marker || !L) {
    return (
      <div className="w-full h-80 rounded-3xl bg-slate-100/90 border border-slate-200 flex flex-col items-center justify-center gap-3 animate-pulse">
        <Compass className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Interactive Route Map...</span>
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
        <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-110' : 'hover:scale-110'}">
          <div class="w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-amber-500 ring-4 ring-amber-500/40 shadow-amber-500/30'
              : 'bg-sky-500 ring-2 ring-white shadow-sky-500/20'
          } text-white font-black text-xs flex items-center justify-center shadow-lg transition-all">
            ${order}
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${
            isSelected ? 'bg-amber-500' : 'bg-sky-500'
          } rotate-45"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  return (
    <div className="space-y-3">
      {/* Map Canvas */}
      <div className="w-full h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md relative group">
        <MapContainer
          center={defaultCenter}
          zoom={stops.length > 1 ? 6 : 9}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
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

          {stops.map((stop) => {
            const isSelected = stop.id === activeStop;
            const photoUrl = placePhotos[stop.id] || stop.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80';

            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={createCustomIcon(stop.stop_order, isSelected)}
                eventHandlers={{
                  click: () => {
                    setActiveStop(stop.id);
                    if (onSelectStop) onSelectStop(stop.id);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="w-60 p-0 overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100">
                    {/* Unsplash Place Image */}
                    <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={stop.city_name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-md text-white font-extrabold text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-400" />
                        Stop #{stop.stop_order}
                      </div>
                      <div className="absolute bottom-2 left-2.5 right-2 text-white">
                        <h4 className="font-extrabold text-sm leading-tight text-white">{stop.city_name}</h4>
                        {stop.country_name && (
                          <span className="text-[10px] text-slate-200 font-medium">{stop.country_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Info content */}
                    <div className="p-3 space-y-2 text-xs">
                      {stop.arrival_date && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          <span>{stop.arrival_date}</span>
                          {stop.departure_date && <span> → {stop.departure_date}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-emerald-500" /> Photo via Unsplash
                        </span>
                        <span className="font-semibold text-sky-600">{stop.latitude.toFixed(2)}°, {stop.longitude.toFixed(2)}°</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stop Cards Carousel / List below map with Unsplash photos */}
      {stops.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {stops.map((stop) => {
            const isSelected = stop.id === activeStop;
            const photoUrl = placePhotos[stop.id] || stop.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={stop.id}
                onClick={() => {
                  setActiveStop(stop.id);
                  if (onSelectStop) onSelectStop(stop.id);
                }}
                className={`min-w-[140px] flex-1 p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                  <img src={photoUrl} alt={stop.city_name} className="w-full h-full object-cover" />
                  <div className="absolute top-0.5 left-0.5 bg-slate-900/80 text-white font-black text-[9px] px-1 rounded">
                    #{stop.stop_order}
                  </div>
                </div>
                <div className="min-w-0 pr-1">
                  <div className="font-extrabold text-xs text-slate-900 truncate">{stop.city_name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{stop.arrival_date || `Stop #${stop.stop_order}`}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

