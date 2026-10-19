export type Artwork = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  sample?: boolean;
  medium: string;
  description: string;
};
export type Artist = {
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  discipline: string;
  bio: string;
  spotifyPlaylistUrl?: string;
  works: Artwork[];
};
// Locations and biographies are fictional sample profiles and can be replaced later.
const profiles = [
  {
    slug: "elia-monroe",
    name: "Elia Monroe",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    discipline: "Light, linen & quiet colour",
    bio: "A sample practice finding warmth in passing light, layered pigment and the folds of everyday life.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/53pKJ7WfSEf5I8ox4Iu25c",
    title: "Where the morning rests",
    portrait: true,
  },
  {
    slug: "sloane-ellis",
    name: "Sloane Ellis",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    discipline: "Architecture in colour",
    bio: "An imagined dialogue between cobalt arches, sunlit geometry and spaces that exist only in memory.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/4VMiOs9qL6OSML9Y9ZFWPN",
    title: "The blue passage",
    portrait: false,
  },
  {
    slug: "nina-calloway",
    name: "Nina Calloway",
    city: "Kyoto",
    country: "Japan",
    lat: 35.0116,
    lng: 135.7681,
    discipline: "Botanical impressions",
    bio: "A fictional collection of botanical gestures, where petals and paper become a record of slow observation.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/1aYiM4zLmBuFq0Fg6NQb6a",
    title: "Magnolia, almost a memory",
    portrait: true,
  },
  {
    slug: "arden-blake",
    name: "Arden Blake",
    city: "Lagos",
    country: "Nigeria",
    lat: 6.5244,
    lng: 3.3792,
    discipline: "Rhythm & earth",
    bio: "An imagined study of rhythm, with restless circles and warm pigments moving across a quiet ground.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/0Hwb2a9DJdom4yoe5V41K9",
    title: "A rhythm returning",
    portrait: false,
  },
  {
    slug: "cleo-winters",
    name: "Cleo Winters",
    city: "Mexico City",
    country: "Mexico",
    lat: 19.4326,
    lng: -99.1332,
    discipline: "Tidal landscapes",
    bio: "A sample exploration of distant coasts, remembered horizons and the colours that arrive just before dusk.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/1z5D0mAmeDIsjKzA3YTz0t",
    title: "The coast after rain",
    portrait: false,
  },
  {
    slug: "remi-sinclair",
    name: "Remi Sinclair",
    city: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.006,
    discipline: "Playful still lifes",
    bio: "A fictional practice giving familiar objects an unfamiliar gravity through colour, pattern and playful shadows.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/1aYiM4zLmBuFq0Fg6NQb6a",
    title: "Pear in a blue hour",
    portrait: true,
  },
  {
    slug: "kaia-laurent",
    name: "Kaia Laurent",
    city: "Marrakesh",
    country: "Morocco",
    lat: 31.6295,
    lng: -7.9811,
    discipline: "Courtyards & colour fields",
    bio: "An imagined series of intimate courtyards, spare architectural forms and the gentle weight of afternoon light.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/0Hwb2a9DJdom4yoe5V41K9",
    title: "An emerald doorway",
    portrait: true,
  },
  {
    slug: "thea-wren",
    name: "Thea Wren",
    city: "Melbourne",
    country: "Australia",
    lat: -37.8136,
    lng: 144.9631,
    discipline: "Nocturnal gardens",
    bio: "A sample collection of moonlit meadows and wild botanical marks, suspended between observation and dream.",
    spotifyPlaylistUrl:
      "https://open.spotify.com/playlist/4VMiOs9qL6OSML9Y9ZFWPN",
    title: "A meadow after midnight",
    portrait: false,
  },
];
export const artists: Artist[] = profiles.map(
  ({ title, portrait, ...profile }, i) => ({
    ...profile,
    works: [
      {
        id: `${profile.slug}-generated`,
        title,
        image: `/art/${profile.slug}.png`,
        width: portrait ? 1086 : 1448,
        height: portrait ? 1448 : 1086,
        medium: "AI-generated painting · sample artwork",
        description: `${title} is an AI-generated sample artwork created for this demonstration profile. It is not an artwork supplied by a real artist.`,
        sample: true,
      },
      ...Array.from({ length: 5 }, (_, j) => ({
        id: `${profile.slug}-study-${j}`,
        title: [
          "A softer horizon",
          "Fragments of a garden",
          "The quiet between",
          "An afternoon, remembered",
          "The shape of silence",
        ][j],
        image: `/art/study-${(i * 2 + j) % 12}.svg`,
        width: (i * 2 + j) % 2 ? 800 : 600,
        height: (i * 2 + j) % 2 ? 600 : 800,
        medium: "Digital composition · sample work",
        description:
          "An original illustrative composition from the Atelier Atlas sample collection.",
        sample: true,
      })),
    ],
  }),
);
export function groupLocations(collection: Artist[]) {
  const groups = new Map<
    string,
    { key: string; city: string; artists: Artist[] }
  >();
  for (const artist of collection) {
    const key = `${artist.lat.toFixed(4)},${artist.lng.toFixed(4)}`;
    const existing = groups.get(key);
    if (existing) existing.artists.push(artist);
    else groups.set(key, { key, city: artist.city, artists: [artist] });
  }
  return Array.from(groups.values());
}
export function galleryHref(artist: Artist) {
  return artist.slug.startsWith("local-")
    ? `/gallery/local/${artist.slug}`
    : `/gallery/${artist.slug}`;
}
export function latLngToPosition(
  lat: number,
  lng: number,
  r = 2,
): [number, number, number] {
  const phi = (lat * Math.PI) / 180,
    theta = (lng * Math.PI) / 180;
  return [
    r * Math.cos(phi) * Math.cos(theta),
    r * Math.sin(phi),
    -r * Math.cos(phi) * Math.sin(theta),
  ];
}
