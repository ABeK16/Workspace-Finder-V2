import { SavedPlace } from "../types";

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const response = await fetch("/api/places");
  if (!response.ok) {
    throw new Error("Failed to fetch saved places");
  }
  return response.json();
}

export async function savePlace(place: Partial<SavedPlace> & { google_place_id: string }): Promise<SavedPlace> {
  const response = await fetch("/api/places", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(place),
  });
  if (!response.ok) {
    throw new Error("Failed to save place");
  }
  return response.json();
}

export async function deletePlace(id: number): Promise<void> {
  const response = await fetch(`/api/places/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete place");
  }
}

export async function getConfig(): Promise<{ googleMapsApiKey: string }> {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Failed to fetch config");
  }
  return response.json();
}

export async function getAllReviews(): Promise<import("../types").Review[]> {
  const response = await fetch("/api/reviews");
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
}

export async function getReviews(placeId: string): Promise<import("../types").Review[]> {
  const response = await fetch(`/api/reviews/${placeId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
}

export async function addReview(review: { google_place_id: string; rating: number; comment: string }): Promise<import("../types").Review> {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });
  if (!response.ok) {
    throw new Error("Failed to add review");
  }
  return response.json();
}
