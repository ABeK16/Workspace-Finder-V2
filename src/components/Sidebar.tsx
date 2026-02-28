import { useState, FormEvent, useEffect } from "react";
import { Place, SavedPlace, Review } from "../types";
import { Search, MapPin, Star, Wifi, Plug, Mic } from "lucide-react";

interface SidebarProps {
  onSearch: (query: string, type: string) => void;
  savedPlaces: SavedPlace[];
  recommendations: Place[];
  onSelectPlace: (placeId: string) => void;
  isSearching: boolean;
  username?: string;
}

export function Sidebar({ onSearch, savedPlaces, recommendations, onSelectPlace, isSearching, username }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("cafe");
  const [activeTab, setActiveTab] = useState<"search" | "favorites" | "reviews">("search");
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (activeTab === "reviews") {
      import("../lib/api").then(api => api.getAllReviews()).then(setAllReviews).catch(console.error);
    }
  }, [activeTab]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, type);
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          {username ? `WorkSpace Finder for ${username}` : "WorkSpace Finder"}
        </h1>
        
        <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "search" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Find
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "favorites" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Favs ({savedPlaces.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "reviews" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Reviews
          </button>
        </div>

        {activeTab === "search" && (
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search area..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["cafe", "library", "coworking_space", "book_store"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setQuery(t.replace("_", " "));
                    onSearch(t.replace("_", " "), t);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                    type === t 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Search Area"}
            </button>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === "favorites" ? (
          savedPlaces.length > 0 ? (
            savedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  if (place.details?.name) setQuery(place.details.name);
                  onSelectPlace(place.google_place_id);
                }}
                className="p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {place.details?.name || "Loading..."}
                  </h3>
                  <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-medium text-yellow-700">
                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                    {place.work_rating}
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mb-2">{place.details?.address || "Address unavailable"}</p>
                
                {place.details?.opening_hours && (
                  <div className="text-xs mb-2">
                    <span className={place.details.opening_hours.open_now ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {place.details.opening_hours.open_now ? "Open Now" : "Closed"}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400">
                  {place.wifi_speed_rating > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      <Wifi className="w-2.5 h-2.5" />
                      {place.wifi_speed_mbps ? `${place.wifi_speed_mbps} Mbps` : `${place.wifi_speed_rating}/5`}
                    </span>
                  )}
                  {place.outlet_rating > 0 && (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                      <Plug className="w-2.5 h-2.5" />
                      {place.outlet_rating}/5
                    </span>
                  )}
                  {place.noise_level > 0 && (
                    <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      <Mic className="w-2.5 h-2.5" />
                      {place.noise_level}/5
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              No favorites yet.
              <br />
              Search and rate places to add them here!
            </div>
          )
        ) : activeTab === "reviews" ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Community Reviews</h3>
            {allReviews.length > 0 ? (
              allReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => onSelectPlace(review.google_place_id)}
                  className="p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 line-clamp-2 italic">"{review.comment}"</p>
                  )}
                  <div className="mt-2 text-[10px] text-blue-600 font-medium">
                    View Place Details →
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                No reviews collected yet.
                <br />
                Be the first to share your experience!
              </div>
            )}
          </div>
        ) : (
          <>
            {recommendations.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Top Recommendations (within 10km)</h3>
                <div className="space-y-2">
                  {recommendations.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => {
                        setQuery(place.name);
                        onSelectPlace(place.id);
                      }}
                      className="p-3 bg-blue-50 border border-blue-100 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {place.name}
                        </h3>
                        <div className="flex items-center bg-white px-1.5 py-0.5 rounded text-xs font-medium text-gray-700 border border-gray-200">
                          <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {place.rating || "-"}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-500 truncate flex-1">{place.address}</p>
                        {place.distance !== undefined && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1 rounded ml-2 whitespace-nowrap">
                            {place.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      {place.opening_hours && (
                        <div className="text-xs">
                          <span className={place.opening_hours.open_now ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {place.opening_hours.open_now ? "Open Now" : "Closed"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 px-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Recommendations</h3>
                <p className="text-xs text-gray-400 italic">No highly-rated laptop-friendly spots found within 10km of your location.</p>
              </div>
            )}
            
            <div className="text-center py-10 text-gray-400 text-sm italic">
              Search results will appear on the map.
              <br />
              Click a marker to view details.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
