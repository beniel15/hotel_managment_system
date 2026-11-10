import React, { useEffect, useRef } from 'react';

const GoogleMapView = ({ center = { lat: 9.9252, lng: 78.1198 }, hotels = [], onSelectHotel }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const defaultLat = center.lat || 9.9252;
    const defaultLng = center.lng || 78.1198;

    if (window.google && window.google.maps) {
      // Initialize interactive Google Map instance
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: defaultLat, lng: defaultLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
      } else {
        mapInstanceRef.current.setCenter({ lat: defaultLat, lng: defaultLng });
      }

      // Clear previous markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();

      // Place pin markers on Google Map for each surrounding hotel
      hotels.forEach((hotel) => {
        const hLat = hotel.lat || defaultLat;
        const hLng = hotel.lng || defaultLng;

        const marker = new window.google.maps.Marker({
          position: { lat: hLat, lng: hLng },
          map: mapInstanceRef.current,
          title: hotel.name,
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });

        const minPrice = hotel.rooms?.[0]?.pricePerNight || 2499;

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 6px; max-width: 200px; font-family: sans-serif;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #003580;">${hotel.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">${hotel.locationName || hotel.city}</p>
              <div style="font-size: 12px; font-weight: bold; color: #006ce4;">₹ ${minPrice.toLocaleString('en-IN')} / night</div>
              <div style="font-size: 11px; color: #fbbf24; margin-top: 2px;">★ ${hotel.rating || 4.5} (${hotel.reviewsCount || 100}+ reviews)</div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          if (onSelectHotel) onSelectHotel(hotel);
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: hLat, lng: hLng });
      });

      if (hotels.length > 1) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  }, [center, hotels]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-300 shadow-md">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default GoogleMapView;
