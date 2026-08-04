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
  { id: 13, plateforme: "youtube", url: "https://www.youtube.com/watch?v=GQ22n_sNu2g", titre: "A3C/Bizzarrini", sousTitre: "Mike Clarke" },
];

/** Identifiant YouTube d'une URL, ou null pour une vidéo Facebook. */
export function youtubeId(url: string): string | null {
  const embed = toYoutubeEmbed(url);
  return embed ? embed.split("/embed/")[1].split(/[?&]/)[0] : null;
}

/** Date par défaut (lancement du nouveau site) pour les vidéos sans date connue. */
export const DEFAULT_UPLOAD_DATE = "2025-01-15";

/** Dates de publication connues (ISO), utilisées dans le balisage Schema.org. */
export const videoUploadDates: Record<string, string> = {
  "obiNne-NxuE": "2016-11-16",
};

/** JSON-LD VideoObject pour chaque vidéo YouTube (les vidéos Facebook sont exclues). */
export function videoObjectsJsonLd(list: Video[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const v of list) {
    const id = v.plateforme === "youtube" ? youtubeId(v.url) : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.titre,
      description: v.sousTitre ? `${v.titre} — ${v.sousTitre}` : v.titre,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      uploadDate: videoUploadDates[id] ?? DEFAULT_UPLOAD_DATE,
      publisher: { "@type": "Organization", name: "Bizzarrini Register" },
    });
  }
  return out;
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
