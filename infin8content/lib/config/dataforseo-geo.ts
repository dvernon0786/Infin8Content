// DataForSEO Geo Configuration
// Single source of truth for location and language mapping

// Full DataForSEO location mapping (94 supported locations)
export const LOCATION_CODE_MAP: Record<string, number> = {
  'Albania': 2008, 'Algeria': 2012, 'Angola': 2024, 'Bahrain': 2048, 'Bangladesh': 2050,
  'Bosnia and Herzegovina': 2070, 'Brazil': 2076, 'Myanmar (Burma)': 2104, 'Cambodia': 2116,
  'Cameroon': 2120, 'Sri Lanka': 2144, 'Chile': 2152, 'Colombia': 2170, 'Costa Rica': 2188,
  'Croatia': 2191, 'Cyprus': 2196, 'Czechia': 2203, 'Denmark': 2208, 'Ecuador': 2218,
  'El Salvador': 2222, 'Estonia': 2233, 'Finland': 2246, 'France': 2250, 'Germany': 2276,
  'Ghana': 2288, 'Greece': 2300, 'Guatemala': 2320, 'Hong Kong': 2344, 'Hungary': 2348,
  'India': 2356, 'Indonesia': 2360, 'Ireland': 2372, 'Israel': 2376, 'Italy': 2380,
  'Cote d\'Ivoire': 2384, 'Japan': 2392, 'Kazakhstan': 2398, 'Jordan': 2400, 'Kenya': 2404,
  'South Korea': 2410, 'Latvia': 2428, 'Lithuania': 2440, 'Malaysia': 2458, 'Malta': 2470,
  'Mexico': 2484, 'Monaco': 2492, 'Moldova': 2498, 'Morocco': 2504, 'Netherlands': 2528,
  'New Zealand': 2554, 'Nicaragua': 2558, 'Nigeria': 2566, 'Norway': 2578, 'Pakistan': 2586,
  'Panama': 2591, 'Paraguay': 2600, 'Peru': 2604, 'Philippines': 2608, 'Poland': 2616,
  'Portugal': 2620, 'Romania': 2642, 'Saudi Arabia': 2682, 'Senegal': 2686, 'Serbia': 2688,
  'Singapore': 2702, 'Slovakia': 2703, 'Vietnam': 2704, 'Slovenia': 2705, 'South Africa': 2710,
  'Spain': 2724, 'Sweden': 2752, 'Switzerland': 2756, 'Thailand': 2764, 'United Arab Emirates': 2784,
  'Tunisia': 2788, 'Turkiye': 2792, 'Ukraine': 2804, 'North Macedonia': 2807, 'Egypt': 2818,
  'United Kingdom': 2826, 'United States': 2840, 'Burkina Faso': 2854, 'Uruguay': 2858, 'Venezuela': 2862
}

// Supported DataForSEO language codes (48 languages)
export const SUPPORTED_LANGUAGE_CODES = new Set([
  'ar','az','bg','bn','bs','cs','da','de','el','en','es',
  'et','fi','fr','he','hi','hr','hu','hy','id','it','ja',
  'ko','lt','lv','mk','ms','nb','nl','pl','pt','ro','ru',
  'sk','sl','sq','sr','sv','th','tl','tr','uk','ur','vi'
])

// Standardized geo resolver functions
export function resolveLocationCode(region?: string): number {
  if (!region) return 2840

  const normalized = region.trim().toLowerCase()

  const match = Object.entries(LOCATION_CODE_MAP).find(
    ([key]) => key.toLowerCase() === normalized
  )

  return match ? match[1] : 2840
}

export function resolveLanguageCode(code?: string): string {
  if (!code) return 'en'

  const normalized = code.trim().toLowerCase()

  return SUPPORTED_LANGUAGE_CODES.has(normalized)
    ? normalized
    : 'en'
}
