export type Artwork = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
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
  works: Artwork[];
};
const titles = [
  "The quiet between",
  "An afternoon, remembered",
  "Where light settles",
  "A softer horizon",
  "Fragments of a garden",
  "The shape of silence",
];
export const artists: Artist[] = [
  {
    slug: "celine-moreau",
    name: "Céline Moreau",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    discipline: "Studies in colour & stillness",
    bio: "An imagined practice exploring the poetry of ordinary spaces, rendered in earthy pigments and unhurried gestures.",
  },
  {
    slug: "lucien-delacroix",
    name: "Lucien Delacroix",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    discipline: "Geometric compositions",
    bio: "An imagined dialogue between architectural forms, negative space and the changing light of the city.",
  },
  {
    slug: "aiko-mori",
    name: "Aiko Mori",
    city: "Kyoto",
    country: "Japan",
    lat: 35.0116,
    lng: 135.7681,
    discipline: "Botanical abstractions",
    bio: "An imagined collection of quiet botanical forms, finding balance between the deliberate and the accidental.",
  },
  {
    slug: "amara-olu",
    name: "Amara Olu",
    city: "Lagos",
    country: "Nigeria",
    lat: 6.5244,
    lng: 3.3792,
    discipline: "Rhythm & earth",
    bio: "An imagined exploration of rhythm, memory and gathering, told through warm colours and expressive shapes.",
  },
  {
    slug: "ines-sol",
    name: "Inés Sol",
    city: "Mexico City",
    country: "Mexico",
    lat: 19.4326,
    lng: -99.1332,
    discipline: "Landscapes of memory",
    bio: "An imagined landscape practice tracing the meeting of earth, architecture and the golden afternoon sun.",
  },
].map((a, i) => ({
  ...a,
  works: titles.map((title, j) => ({
    id: `${a.slug}-${j}`,
    title,
    image: `/art/study-${(i * 2 + j) % 12}.svg`,
    width: j % 2 ? 800 : 600,
    height: j % 2 ? 600 : 800,
    medium: "Digital composition · sample work",
    description: `${title} is an original sample composition made for the Atelier Atlas demonstration. Layered forms and muted pigments invite a slower way of looking. This is a fictional artist and an illustrative collection.`,
  })),
}));
export const locations = Array.from(new Set(artists.map((a) => a.city))).map(
  (city) => ({ city, artists: artists.filter((a) => a.city === city) }),
);
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
