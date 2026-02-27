import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPicker({ lat, lng, onChange, zoom = 13 }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([lat || 1.14179057, lng || 104.01543149], zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            markerRef.current = L.marker([lat || 1.14179057, lng || 104.01543149], {
                draggable: true
            }).addTo(mapInstance.current);

            markerRef.current.on('dragend', () => {
                const position = markerRef.current.getLatLng();
                onChange(position.lat, position.lng);
            });

            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                markerRef.current.setLatLng([lat, lng]);
                onChange(lat, lng);
            });
        } else {
            if (lat && lng) {
                mapInstance.current.setView([lat, lng]);
                markerRef.current.setLatLng([lat, lng]);
            }
        }
    }, [lat, lng]);

    return (
        <div className="w-full h-[400px] border-2 border-surface-100 rounded-xl overflow-hidden shadow-inner">
            <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
        </div>
    );
}
