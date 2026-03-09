import { useEffect, useRef } from 'react';
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

export default function MapPreview({ points = [], heightClass = 'h-[320px]', markerVariant = 'default' }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersLayer = useRef(null);

    useEffect(() => {
        if (mapInstance.current || !mapRef.current) return undefined;

        mapInstance.current = L.map(mapRef.current, {
            zoomControl: true,
            scrollWheelZoom: false,
        }).setView([DEFAULT_LAT, DEFAULT_LNG], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstance.current);

        markersLayer.current = L.layerGroup().addTo(mapInstance.current);

        setTimeout(() => mapInstance.current?.invalidateSize(), 120);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markersLayer.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !markersLayer.current) return;

        markersLayer.current.clearLayers();

        if (!points.length) {
            mapInstance.current.setView([DEFAULT_LAT, DEFAULT_LNG], 11);
            return;
        }

        const bounds = [];

        points.forEach((point) => {
            const lat = Number(point.latitude);
            const lng = Number(point.longitude);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return;

            const popupTitle = point.name || 'Unnamed location';
            const popupSubtitle = point.subtitle ? `<br/>${point.subtitle}` : '';
            const popupHtml = `<strong>${popupTitle}</strong>${popupSubtitle}`;

            const marker = markerVariant === 'red-dot'
                ? L.circleMarker([lat, lng], {
                    radius: 7,
                    color: '#b91c1c',
                    weight: 2,
                    fillColor: '#ef4444',
                    fillOpacity: 0.8,
                })
                : L.marker([lat, lng]);
            marker.bindPopup(popupHtml);
            marker.addTo(markersLayer.current);
            bounds.push([lat, lng]);
        });

        if (!bounds.length) {
            mapInstance.current.setView([DEFAULT_LAT, DEFAULT_LNG], 11);
            return;
        }

        mapInstance.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    }, [points, markerVariant]);

    return (
        <div className={`w-full ${heightClass} border-2 border-surface-100 rounded-xl overflow-hidden shadow-inner`}>
            <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
        </div>
    );
}
