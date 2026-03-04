import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_LAT = 1.14179057;
const DEFAULT_LNG = 104.01543149;

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPicker({ lat, lng, onChange, zoom = 13 }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const hasCoordinate = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
    const initialLat = hasCoordinate ? lat : DEFAULT_LAT;
    const initialLng = hasCoordinate ? lng : DEFAULT_LNG;

    const updatePosition = (nextLat, nextLng, changeView = true) => {
        if (!mapInstance.current || !markerRef.current) return;
        markerRef.current.setLatLng([nextLat, nextLng]);
        if (changeView) {
            mapInstance.current.setView([nextLat, nextLng], mapInstance.current.getZoom());
        }
        onChange(nextLat, nextLng);
    };

    useEffect(() => {
        if (mapInstance.current) return undefined;

        mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstance.current);

        markerRef.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.current);

        markerRef.current.on('dragend', () => {
            const position = markerRef.current.getLatLng();
            onChange(position.lat, position.lng);
        });

        mapInstance.current.on('click', (e) => {
            const { lat: clickedLat, lng: clickedLng } = e.latlng;
            updatePosition(clickedLat, clickedLng, false);
        });

        setTimeout(() => {
            mapInstance.current?.invalidateSize();
        }, 120);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !markerRef.current) return;
        mapInstance.current.invalidateSize();
        if (hasCoordinate) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
        }
    }, [lat, lng]);

    const searchLocation = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`,
            );
            const data = await response.json();
            setResults(Array.isArray(data) ? data : []);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const pickSearchResult = (item) => {
        const foundLat = Number(item.lat);
        const foundLng = Number(item.lon);
        if (Number.isNaN(foundLat) || Number.isNaN(foundLng)) return;
        updatePosition(foundLat, foundLng, true);
        setQuery(item.display_name || '');
        setResults([]);
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search address or place..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="button" className="btn-secondary" onClick={searchLocation} disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
                </button>
            </div>

            {results.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-lg border border-surface-200 bg-white">
                    {results.map((item) => (
                        <button
                            key={`${item.place_id}-${item.lat}-${item.lon}`}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 border-b border-surface-100 last:border-b-0"
                            onClick={() => pickSearchResult(item)}
                        >
                            {item.display_name}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full h-[360px] border-2 border-surface-100 rounded-xl overflow-hidden shadow-inner">
                <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
            </div>
        </div>
    );
}
