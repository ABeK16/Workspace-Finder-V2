/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { Map } from "./components/Map";
import { Sidebar } from "./components/Sidebar";
import { PlaceDetails } from "./components/PlaceDetails";
import Auth from "./components/Auth";
import { useGoogleMaps } from "./lib/useGoogleMaps";
import { getSavedPlaces, savePlace, deletePlace } from "./lib/api";
import { supabase } from "./lib/supabaseClient";
import { Place, SavedPlace } from "./types";
import { Loader2, User } from "lucide-react";

export default function App() {
  const { isLoaded, error, setError } = useGoogleMaps();
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch saved places
  const fetchSavedPlaces = useCallback(async () => {
    try {
      const data = await getSavedPlaces();
      setSavedPlaces(data);
    } catch (err) {
      console.error("Failed to fetch saved places", err);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPlaces();
  }, [fetchSavedPlaces]);

  // Get user location and fetch recommendations
  useEffect(() => {
    if (!isLoaded) return;

    const getUserLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(location);
            
            // Fetch recommendations
            try {
              const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
              const request = {
                textQuery: "best laptop friendly cafe",
                locationBias: { center: location, radius: 2000 },
                fields: ["id", "displayName", "formattedAddress", "location", "photos", "rating", "userRatingCount", "regularOpeningHours"],
              };
              
              const { places: results } = await Place.searchByText(request);
              
              // Filter for high rating and map
              const topPlaces = await Promise.all(results
                .filter(p => (p.rating || 0) >= 4.0)
                .slice(0, 3)
                .map(async (p) => {
                  let isOpen = undefined;
                  try {
                    isOpen = await p.isOpen();
                  } catch (e) {
                    // ignore
                  }
                  
                  return {
                    id: p.id as string,
                    name: p.displayName as string,
                    address: p.formattedAddress as string,
                    location: {
                      lat: p.location?.lat() || 0,
                      lng: p.location?.lng() || 0,
                    },
                    rating: p.rating as number,
                    user_ratings_total: p.userRatingCount as number,
                    photos: p.photos?.map(photo => photo.getURI()) || [],
                    opening_hours: {
                      open_now: isOpen === true,
                      weekday_text: p.regularOpeningHours?.weekdayDescriptions,
                    }
                  };
                }));
                
              setRecommendations(topPlaces);
            } catch (e) {
              console.error("Failed to fetch recommendations", e);
            }
          },
          () => console.warn("Geolocation denied")
        );
      }
    };

    getUserLocation();
  }, [isLoaded]);

  // Enrich saved places with Google Maps data when map is loaded
  useEffect(() => {
    if (!isLoaded || savedPlaces.length === 0) return;

    const enrichPlaces = async () => {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      const enriched = await Promise.all(savedPlaces.map(async (saved) => {
        if (saved.details) return saved; // Already enriched
        
        try {
          // Use the new Places API to fetch details
          // Note: In a real app, you might want to cache this or be careful with quota.
          // The user guide says: "Pass these IDs to the Google Maps Place Details service to get the fresh name, photo, and address live."
          const place = new Place({ id: saved.google_place_id });
          await place.fetchFields({ fields: ["displayName", "formattedAddress", "location", "photos", "regularOpeningHours"] });
          
          const isOpen = await place.isOpen();

          return {
            ...saved,
            details: {
              id: saved.google_place_id,
              name: place.displayName as string,
              address: place.formattedAddress as string,
              location: {
                lat: place.location?.lat() || 0,
                lng: place.location?.lng() || 0,
              },
              photos: place.photos?.map(p => p.getURI()) || [],
              opening_hours: {
                open_now: isOpen === true,
                weekday_text: place.regularOpeningHours?.weekdayDescriptions,
              }
            }
          };
        } catch (e) {
          console.warn(`Failed to fetch details for ${saved.google_place_id}`, e);
          return saved;
        }
      }));
      
      // Only update if there are changes to avoid infinite loop
      const hasChanges = enriched.some((p, i) => p.details !== savedPlaces[i].details);
      if (hasChanges) {
        setSavedPlaces(enriched);
      }
    };

    enrichPlaces();
  }, [isLoaded, savedPlaces.length]); // Depend on length to trigger on new adds

  const handleSearch = async (query: string, type: string) => {
    if (!isLoaded) return;
    setIsSearching(true);
    setPlaces([]); // Clear previous results

    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      // Get current map center if possible, otherwise default
      // We can't easily access the map instance here, so we'll use a default or browser location
      // Ideally we'd pass the map bounds, but for now let's use a generic search
      // or rely on the user's current location if available.
      
      let center = { lat: 37.7749, lng: -122.4194 }; // SF Default
      
      // Simple way to get location for search bias
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition((pos) => {
            center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve();
          }, () => resolve());
        });
      }

      const request = {
        textQuery: `${query} ${type}`,
        locationBias: { center, radius: 5000 }, // 5km radius
        fields: ["id", "displayName", "formattedAddress", "location", "photos", "regularOpeningHours", "rating", "userRatingCount"],
      };

      const { places: results } = await Place.searchByText(request);

      const mappedPlaces: Place[] = await Promise.all(results.map(async (p) => {
        let isOpen = undefined;
        try {
          isOpen = await p.isOpen();
        } catch (e) {
          console.warn(`Failed to get isOpen for ${p.id}`, e);
        }

        return {
          id: p.id as string,
          name: p.displayName as string,
          address: p.formattedAddress as string,
          location: {
            lat: p.location?.lat() || 0,
            lng: p.location?.lng() || 0,
          },
          rating: p.rating as number,
          user_ratings_total: p.userRatingCount as number,
          photos: p.photos?.map(photo => photo.getURI()) || [],
          opening_hours: {
            open_now: isOpen === true,
            weekday_text: p.regularOpeningHours?.weekdayDescriptions,
          }
        };
      }));

      setPlaces(mappedPlaces);
      
      // If results found, select the first one? No, let user choose.
    } catch (err) {
      console.error("Search failed", err);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  const handleSavePlace = async (placeId: string, data: Partial<SavedPlace>) => {
    try {
      const saved = await savePlace({ ...data, google_place_id: placeId });
      
      // Update local state
      setSavedPlaces(prev => {
        const existing = prev.findIndex(p => p.google_place_id === placeId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...saved, details: updated[existing].details };
          return updated;
        } else {
          // We need to add the details immediately for UI responsiveness
          const placeDetails = places.find(p => p.id === placeId);
          return [...prev, { ...saved, details: placeDetails }];
        }
      });
      
      // Refresh to ensure sync
      // fetchSavedPlaces(); 
    } catch (err) {
      console.error("Failed to save place", err);
      alert("Failed to save place.");
    }
  };

  const handleDeletePlace = async (id: number) => {
    if (!confirm("Are you sure you want to remove this place?")) return;
    try {
      await deletePlace(id);
      setSavedPlaces(prev => prev.filter(p => p.id !== id));
      if (selectedPlaceId) {
        const place = savedPlaces.find(p => p.id === id);
        if (place && place.google_place_id === selectedPlaceId) {
          setSelectedPlaceId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete place", err);
    }
  };

  const selectedPlace = places.find(p => p.id === selectedPlaceId) || 
                        savedPlaces.find(p => p.google_place_id === selectedPlaceId)?.details;
  
  const savedPlaceData = savedPlaces.find(p => p.google_place_id === selectedPlaceId);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 text-red-600 p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold mb-4">Maps Configuration Required</h1>
          <p className="mb-4">{error.message}</p>
          <div className="text-left bg-white p-4 rounded-lg border border-red-200 text-sm text-gray-700 space-y-2">
            <p className="font-semibold">How to fix this:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>.</li>
              <li>Ensure your API Key is in the <code>.env</code> file.</li>
              <li>In the Console, go to <strong>APIs & Services &gt; Library</strong>.</li>
              <li>Search for and <strong>Enable</strong> these APIs:
                <ul className="list-disc ml-4 mt-1">
                  <li>Maps JavaScript API</li>
                  <li><strong>Places API (New)</strong> - <em>Critical for search</em></li>
                  <li>Geolocation API</li>
                </ul>
              </li>
            </ol>
          </div>
          <p className="text-xs mt-6 text-gray-500">After enabling, it may take a few minutes for the changes to propagate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <Sidebar 
        onSearch={handleSearch} 
        savedPlaces={savedPlaces}
        recommendations={recommendations}
        onSelectPlace={handleSelectPlace}
        isSearching={isSearching}
      />
      
      <div className="flex-1 relative">
        <button 
          onClick={() => setShowAuth(!showAuth)}
          className="absolute top-4 right-4 z-20 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700"
          title={session ? `Logged in as ${session.user.email}` : "Login / Sign Up"}
        >
          <User className={`w-6 h-6 ${session ? "text-blue-600" : "text-gray-400"}`} />
        </button>

        {showAuth && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative">
              <button 
                onClick={() => setShowAuth(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-40"
              >
                ✕
              </button>
              <Auth />
            </div>
          </div>
        )}

        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-500 font-medium">Loading Maps...</p>
            </div>
          </div>
        ) : (
          <Map 
            places={places}
            savedPlaces={savedPlaces}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={handleSelectPlace}
            isLoaded={isLoaded}
            onError={setError}
          />
        )}

        {selectedPlace && (
          <PlaceDetails 
            place={selectedPlace}
            savedPlace={savedPlaceData}
            onSave={handleSavePlace}
            onDelete={handleDeletePlace}
            onClose={() => setSelectedPlaceId(null)}
          />
        )}
      </div>
    </div>
  );
}

