import { useEffect, useRef, useState } from "react";
import { Place, SavedPlace } from "../types";

interface MapProps {
  places: Place[];
  savedPlaces: SavedPlace[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string) => void;
  isLoaded: boolean;
  onError?: (error: Error) => void;
}

export function Map({ places, savedPlaces, selectedPlaceId, onPlaceSelect, isLoaded, onError }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        mapInstanceRef.current = new Map(mapRef.current, {
          center: { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapId: "DEMO_MAP_ID", // Required for cloud-based maps styling if needed
        });

        // Try to get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              mapInstanceRef.current?.setCenter(pos);
              new Marker({
                position: pos,
                map: mapInstanceRef.current,
                title: "Your Location",
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "white",
                },
              });
            },
            () => {
              console.warn("Geolocation permission denied or error.");
            }
          );
        }
      } catch (err) {
        console.error("Failed to initialize map:", err);
        if (onError) onError(err instanceof Error ? err : new Error("Failed to initialize map"));
      }
    };

    initMap();
  }, [isLoaded, onError]);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      try {
        const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        let hasMarkers = false;

        // Add markers for search results
        places.forEach((place) => {
          const marker = new Marker({
            position: place.location,
            map: mapInstanceRef.current,
            title: place.name,
            icon: selectedPlaceId === place.id ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          });

          marker.addListener("click", () => {
            onPlaceSelect(place.id);
          });

          markersRef.current.push(marker);
          bounds.extend(place.location);
          hasMarkers = true;
        });

        // Add markers for saved places
        savedPlaces.forEach((saved) => {
          if (saved.details) {
            const marker = new Marker({
              position: saved.details.location,
              map: mapInstanceRef.current,
              title: saved.details.name,
              icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue for saved
              zIndex: 100, // On top
            });

            marker.addListener("click", () => {
              onPlaceSelect(saved.google_place_id);
            });

            markersRef.current.push(marker);
            bounds.extend(saved.details.location);
            hasMarkers = true;
          }
        });
        
        if (hasMarkers && !selectedPlaceId) {
          mapInstanceRef.current?.fitBounds(bounds);
        }
      } catch (err) {
        console.error("Failed to update markers:", err);
        // We might not want to show a full error screen for marker updates, 
        // but for now let's log it.
      }
    };

    updateMarkers();

  }, [places, savedPlaces, selectedPlaceId, onPlaceSelect]);

  // Pan to selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlaceId) return;
    
    const place = places.find(p => p.id === selectedPlaceId) || savedPlaces.find(p => p.google_place_id === selectedPlaceId)?.details;
    
    if (place) {
      mapInstanceRef.current.panTo(place.location);
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedPlaceId, places, savedPlaces]);

  return <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-sm border border-gray-200" />;
}
