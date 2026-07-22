export type Video = {
  id: number;
  plateforme: "youtube" | "facebook";
  url: string;
};

export const videos: Video[] = [
  { id: 1, plateforme: "youtube", url: "https://www.youtube.com/watch?v=obiNne-NxuE" },
  { id: 2, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1476704379088316" },
  { id: 3, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1464301007023113" },
  { id: 4, plateforme: "facebook", url: "https://www.facebook.com/watch/live/?v=1439534849493651" },
  { id: 5, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1066598510098907" },
  { id: 6, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=809682325727146" },
  { id: 7, plateforme: "youtube", url: "https://www.youtube.com/watch?v=skwpOefYSAw" },
  { id: 8, plateforme: "youtube", url: "https://www.youtube.com/watch?v=PflbipgeqvM" },
  { id: 9, plateforme: "youtube", url: "https://www.youtube.com/watch?v=X03kiL5AasI" },
  { id: 10, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Tb7Emw9w1Y0" },
  { id: 11, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Y50RDb7q1d8" },
  { id: 12, plateforme: "youtube", url: "https://www.youtube.com/watch?v=H3163F-AEmo" },
  { id: 13, plateforme: "youtube", url: "https://www.youtube.com/watch?v=GQ22n_sNu2g" },
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
