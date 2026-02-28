export interface Place {
  id: string; // Google Place ID
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  distance?: number;
  user_ratings_total?: number;
  photos?: string[];
  types?: string[];
  isOpen?: boolean;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
    periods?: any[];
  };
}

export interface SavedPlace {
  id: number;
  google_place_id: string;
  work_rating: number;
  wifi_speed_rating: number;
  wifi_speed_mbps?: string;
  has_outlets: boolean;
  outlet_rating?: number;
  noise_level?: number;
  notes: string;
  created_at: string;
  // Enriched data from Google Maps
  details?: Place;
}

export interface PlaceSearchRequest {
  query: string;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  type?: string;
}

export interface Review {
  id: number;
  google_place_id: string;
  rating: number;
  comment: string;
  created_at: string;
}
