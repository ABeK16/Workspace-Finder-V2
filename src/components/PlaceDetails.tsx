import { useState, useEffect } from "react";
import { Place, SavedPlace, Review } from "../types";
import { Star, Wifi, Plug, MapPin, Save, Trash2, Clock, MessageSquare, Mic } from "lucide-react";
import { getReviews, addReview } from "../lib/api";

interface PlaceDetailsProps {
  place: Place;
  savedPlace?: SavedPlace;
  onSave: (placeId: string, data: Partial<SavedPlace>) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export function PlaceDetails({ place, savedPlace, onSave, onDelete, onClose }: PlaceDetailsProps) {
  const [workRating, setWorkRating] = useState(savedPlace?.work_rating || 0);
  const [wifiRating, setWifiRating] = useState(savedPlace?.wifi_speed_rating || 0);
  const [wifiMbps, setWifiMbps] = useState(savedPlace?.wifi_speed_mbps || "");
  const [hasOutlets, setHasOutlets] = useState(savedPlace?.has_outlets || false);
  const [outletRating, setOutletRating] = useState(savedPlace?.outlet_rating || 0);
  const [noiseLevel, setNoiseLevel] = useState<number>(savedPlace?.noise_level || 0);
  const [notes, setNotes] = useState(savedPlace?.notes || "");
  const [isEditing, setIsEditing] = useState(!savedPlace);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  useEffect(() => {
    if (place.id) {
      getReviews(place.id).then(setReviews).catch(console.error);
    }
  }, [place.id]);

  const handleSave = () => {
    onSave(place.id, {
      work_rating: workRating,
      wifi_speed_rating: wifiRating,
      wifi_speed_mbps: wifiMbps,
      has_outlets: hasOutlets,
      outlet_rating: outletRating,
      noise_level: noiseLevel,
      notes: notes,
    });
    setIsEditing(false);
  };

  const handleSubmitReview = async () => {
    if (newReviewRating === 0) return;
    setIsSubmittingReview(true);
    try {
      const review = await addReview({
        google_place_id: place.id,
        rating: newReviewRating,
        comment: newReviewComment,
      });
      setReviews([review, ...reviews]);
      setNewReviewRating(0);
      setNewReviewComment("");
    } catch (error) {
      console.error("Failed to submit review", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
      
      {/* --- MULTIPLE IMAGES CAROUSEL --- */}
      {place.photos && place.photos.length > 0 && (
        <div className="relative h-40 w-full">
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory h-full w-full"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hides scrollbar in Firefox/IE
          >
            {/* Hides scrollbar in Webkit browsers (Chrome/Safari) */}
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            
            {place.photos.map((photoUrl, index) => (
              <img 
                key={index}
                src={photoUrl} 
                alt={`${place.name} - Photo ${index + 1}`} 
                className="w-full h-full object-cover flex-shrink-0 snap-center"
              />
            ))}
          </div>

          {/* Swipe Indicator (only shows if there is more than 1 photo) */}
          {place.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full pointer-events-none">
              1 of {place.photos.length} • Swipe
            </div>
          )}

          <button 
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
      
      <div className="p-4 overflow-y-auto flex-1">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{place.name}</h2>
          {!place.photos && (
             <button 
             onClick={onClose}
             className="text-gray-500 hover:text-gray-700"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
          )}
        </div>
        
        <div className="flex items-start text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{place.address}</span>
        </div>

        {/* --- OPENING HOURS INDICATOR --- */}
        {place.opening_hours && (
          <div className="mb-4">
            <div className="flex items-center text-sm mb-1">
              <Clock className="w-4 h-4 mr-1 flex-shrink-0 text-gray-500" />
              <span className={place.opening_hours.open_now ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {place.opening_hours.open_now ? "Open Now" : "Closed"}
              </span>
            </div>
            {place.opening_hours.weekday_text && (
              <div className="ml-5 text-xs text-gray-500 space-y-0.5 border-l-2 border-gray-100 pl-2">
                {place.opening_hours.weekday_text.map((day, i) => (
                  <div key={i}>{day}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === "details" ? (
          <>
            {savedPlace && !isEditing ? (
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Work Rating</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (savedPlace.work_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">WiFi Speed</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Wifi 
                          key={level} 
                          className={`w-4 h-4 ${level <= (savedPlace.wifi_speed_rating || 0) ? "text-blue-500" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                    {savedPlace.wifi_speed_mbps && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                        {savedPlace.wifi_speed_mbps} Mbps
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Power Outlets</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Plug 
                          key={level} 
                          className={`w-4 h-4 ${level <= (savedPlace.outlet_rating || 0) ? "text-green-500" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                    <Plug className={`w-4 h-4 ${savedPlace.has_outlets ? "text-green-500" : "text-gray-300"}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Quietness</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Mic 
                          key={level} 
                          className={`w-4 h-4 ${level <= (savedPlace.noise_level || 0) ? "text-purple-500" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {savedPlace.notes && (
                  <div className="text-sm text-gray-600 mt-2 italic">
                    "{savedPlace.notes}"
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-2 border-t border-gray-200">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(savedPlace.id)}
                    className="flex-shrink-0 bg-red-50 border border-red-200 text-red-600 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border-t border-gray-100 pt-4 mt-2">
                <h3 className="font-medium text-gray-900">Rate this workspace</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Work Friendliness</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setWorkRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= workRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">WiFi Speed</label>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      <input 
                        type="text"
                        value={wifiMbps}
                        onChange={(e) => setWifiMbps(e.target.value)}
                        placeholder="Mbps"
                        className="w-12 bg-transparent text-xs font-mono outline-none text-right"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">Mbps</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button 
                        key={level} 
                        onClick={() => setWifiRating(level)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Wifi 
                          className={`w-6 h-6 ${level <= wifiRating ? "text-blue-500" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Power Outlets</label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button 
                          key={level} 
                          onClick={() => setOutletRating(level)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Plug 
                            className={`w-6 h-6 ${level <= outletRating ? "text-green-500" : "text-gray-300"}`} 
                          />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setHasOutlets(!hasOutlets)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${hasOutlets ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                    >
                      <Plug className="w-4 h-4" />
                      <span className="text-xs font-medium">Available</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Quietness Level</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button 
                        key={level} 
                        onClick={() => setNoiseLevel(level)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Mic 
                          className={`w-6 h-6 ${level <= noiseLevel ? "text-purple-500" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20"
                    placeholder="Quiet spot? Good coffee?"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {savedPlace && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savedPlace ? "Update" : "Save Place"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* Review List */}
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No reviews yet. Be the first to review!
                </div>
              )}
            </div>

            {/* Add Review Form */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Write a Review</h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setNewReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-6 h-6 ${star <= newReviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                    />
                  </button>
                ))}
              </div>
              <textarea 
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20 mb-2"
                placeholder="Share your experience..."
              />
              <button 
                onClick={handleSubmitReview}
                disabled={newReviewRating === 0 || isSubmittingReview}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}