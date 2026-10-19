/** Accept public Spotify playlist links, never arbitrary iframe destinations. */
export function spotifyPlaylist(
  url?: string,
): { url: string; embedUrl: string } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "open.spotify.com" ||
      parsed.port ||
      parsed.username ||
      parsed.password
    )
      return null;
    const match = parsed.pathname.match(
      /^\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]{22})\/?$/,
    );
    if (!match) return null;
    return {
      url: `https://open.spotify.com/playlist/${match[1]}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`,
    };
  } catch {
    return null;
  }
}
