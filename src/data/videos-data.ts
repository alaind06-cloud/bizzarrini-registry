export type Video = {
  id: number;
  plateforme: "youtube" | "facebook";
  url: string;
  titre: string;
  sousTitre?: string;
};

// Genepifilm exclusive interview series — 6 parts, displayed in a dedicated block.
export const genepifilmSeries: Video[] = [
  { id: 101, plateforme: "youtube", url: "https://www.youtube.com/watch?v=skwpOefYSAw", titre: "Genepifilm — Partie 1", sousTitre: "Genepifilm" },
  { id: 102, plateforme: "youtube", url: "https://www.youtube.com/watch?v=PflbipgeqvM", titre: "Genepifilm — Partie 2", sousTitre: "Genepifilm" },
  { id: 103, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Y50RDb7q1d8", titre: "Genepifilm — Partie 3", sousTitre: "Genepifilm" },
  { id: 104, plateforme: "youtube", url: "https://www.youtube.com/watch?v=J26XeCJnJTI", titre: "Genepifilm — Partie 4", sousTitre: "Genepifilm" },
  { id: 105, plateforme: "youtube", url: "https://www.youtube.com/watch?v=X03kiL5AasI", titre: "Genepifilm — Partie 5", sousTitre: "Genepifilm" },
  { id: 106, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Tb7Emw9w1Y0", titre: "Genepifilm — Partie 6", sousTitre: "Genepifilm" },
];

// Standard grid — Genepifilm series URLs removed to avoid duplicates.
export const videos: Video[] = [
  { id: 1, plateforme: "youtube",  url: "https://www.youtube.com/watch?v=obiNne-NxuE", titre: "BZ 2001 Concept Prototype", sousTitre: "Barry Watkins" },
  { id: 2, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1476704379088316", titre: "Bizzarrini — Archive #1", sousTitre: "Gentlemen Drivers" },
  { id: 3, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1464301007023113", titre: "Bizzarrini — Archive #2", sousTitre: "Gentlemen Drivers" },
  { id: 5, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1066598510098907", titre: "Bizzarrini — Archive #3", sousTitre: "Gentlemen Drivers" },
  { id: 6, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=809682325727146", titre: "Bizzarrini Racing History", sousTitre: "Bizzarrini Racing" },
  { id: 12, plateforme: "youtube", url: "https://www.youtube.com/watch?v=H3163F-AEmo", titre: "Bizzarrini P538", sousTitre: "Course" },
  { id: 13, plateforme: "youtube", url: "https://www.youtube.com/watch?v=GQ22n_sNu2g", titre: "Bizzarrini — Hommage", sousTitre: "Documentaire" },
];

export function toYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
  } catch {}
  return null;
}

export function toYoutubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

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
