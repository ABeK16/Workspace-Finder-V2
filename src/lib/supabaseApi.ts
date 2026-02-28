import { supabase } from './supabaseClient';

/**
 * Saves a Google Maps place_id to the user's favorites in Supabase.
 * Assumes a 'favorites' table exists with columns: id, user_id, place_id.
 * 
 * @param placeId The Google Maps Place ID to save
 * @returns An object containing the saved data or an error
 */
export async function saveFavoritePlace(placeId: string) {
  // 1. Get the current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: new Error('User must be authenticated to save favorites') };
  }

  // 2. Insert the favorite into the database
  const { data, error } = await supabase
    .from('favorites')
    .insert([
      { 
        user_id: user.id, 
        place_id: placeId 
      }
    ])
    .select();

  return { data, error };
}

/**
 * Fetches the current user's favorite place IDs from Supabase.
 */
export async function getFavoritePlaces() {
  const { data, error } = await supabase
    .from('favorites')
    .select('place_id');
    
  return { data, error };
}
