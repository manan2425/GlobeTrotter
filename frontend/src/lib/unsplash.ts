/**
 * Unsplash API Helper Service
 * Fetches place and destination photos using Unsplash API.
 * Uses NEXT_PUBLIC_UNSPLASH_ACCESS_KEY if configured in environment,
 * otherwise falls back gracefully to curated high-resolution destination images.
 */

const UNSPLASH_ACCESS_KEY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY)
  ? process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  : 'brf5QzE71c-1P9Ggng7YVbe8KYNI8x-I84yfQDDxmJg';

// Cache to prevent duplicate API requests for the same place/city during session
const photoCache = new Map<string, string>();

// Fallback curated city photos dictionary for instant high-quality rendering
const DEFAULT_PLACE_IMAGES: Record<string, string> = {
  'udaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  'jaipur': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
  'jodhpur': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
  'ahmedabad': 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?auto=format&fit=crop&w=800&q=80',
  'mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  'delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80'
};

export async function fetchPlacePhoto(query: string, fallbackUrl?: string): Promise<string> {
  if (!query) return fallbackUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

  const normalizedQuery = query.toLowerCase().trim();

  if (photoCache.has(normalizedQuery)) {
    return photoCache.get(normalizedQuery)!;
  }

  // If user provides Unsplash API Key, fetch live from Unsplash API
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' landmark travel')}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const photoUrl = data.results[0].urls.regular || data.results[0].urls.small;
          photoCache.set(normalizedQuery, photoUrl);
          return photoUrl;
        }
      }
    } catch (err) {
      console.warn(`Unsplash API fetch failed for "${query}", using fallback:`, err);
    }
  }

  // Fallback 1: Direct matching curated dictionary
  for (const [key, url] of Object.entries(DEFAULT_PLACE_IMAGES)) {
    if (normalizedQuery.includes(key)) {
      photoCache.set(normalizedQuery, url);
      return url;
    }
  }

  // Fallback 2: Provided fallbackUrl (from city image_url in DB)
  if (fallbackUrl) {
    photoCache.set(normalizedQuery, fallbackUrl);
    return fallbackUrl;
  }

  // Fallback 3: Generic high quality travel landscape photo
  const defaultPhoto = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  photoCache.set(normalizedQuery, defaultPhoto);
  return defaultPhoto;
}
