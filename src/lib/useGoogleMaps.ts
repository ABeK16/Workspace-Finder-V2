import { useState, useEffect } from "react";
import { loadGoogleMaps } from "./google-maps";
import { getConfig } from "./api";

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Global handler for Google Maps authentication errors
    (window as any).gm_authFailure = () => {
      setError(new Error("Google Maps authentication failed. Please check your API key and enable the Maps JavaScript API in Google Cloud Console."));
    };

    async function init() {
      try {
        const config = await getConfig();
        if (!config.googleMapsApiKey) {
          throw new Error("Google Maps API Key is missing. Please check your .env file.");
        }
        setApiKey(config.googleMapsApiKey);
        await loadGoogleMaps(config.googleMapsApiKey);
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load Google Maps"));
      }
    }
    init();

    return () => {
      // Cleanup
      (window as any).gm_authFailure = undefined;
    };
  }, []);

  return { isLoaded, error, apiKey, setError };
}
