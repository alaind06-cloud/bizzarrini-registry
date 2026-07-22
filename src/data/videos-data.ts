export type Video = {
  id: string;
  plateforme: "youtube" | "facebook";
  url: string;
  titre?: string;
};

// Placeholders — à remplacer par le fichier définitif (13 vidéos).
export const videos: Video[] = [
  { id: "v1", plateforme: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", titre: "Vidéo placeholder 1" },
  { id: "v2", plateforme: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", titre: "Vidéo placeholder 2" },
];

export function toYoutubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {}
  return null;
}

export function toFacebookEmbed(url: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
}
