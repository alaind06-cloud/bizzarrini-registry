export type Video = {
  id: number;
  plateforme: "youtube" | "facebook";
  url: string;
  titre: string;
  sousTitre?: string;
};

export const videos: Video[] = [
  { id: 1, plateforme: "youtube",  url: "https://www.youtube.com/watch?v=obiNne-NxuE", titre: "BZ 2001 Concept Prototype", sousTitre: "Barry Watkins" },
  { id: 2, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1476704379088316", titre: "Bizzarrini — Archive #1", sousTitre: "Gentlemen Drivers" },
  { id: 3, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1464301007023113", titre: "Bizzarrini — Archive #2", sousTitre: "Gentlemen Drivers" },
  
  { id: 5, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=1066598510098907", titre: "Bizzarrini — Archive #3", sousTitre: "Gentlemen Drivers" },
  { id: 6, plateforme: "facebook", url: "https://www.facebook.com/watch/?v=809682325727146", titre: "Bizzarrini Racing History", sousTitre: "Bizzarrini Racing" },
  { id: 7, plateforme: "youtube",  url: "https://www.youtube.com/watch?v=skwpOefYSAw", titre: "1965 Bizzarrini A3/C — A Le Mans Underdog Story", sousTitre: "Petrolicious" },
  { id: 8, plateforme: "youtube",  url: "https://www.youtube.com/watch?v=PflbipgeqvM", titre: "BIZZARRINI — The Genius behind Ferrari's 250 GTO", sousTitre: "Genepifilm · Part I" },
  { id: 9, plateforme: "youtube",  url: "https://www.youtube.com/watch?v=X03kiL5AasI", titre: "BIZZARRINI — The Genius behind Ferrari's 250 GTO", sousTitre: "Genepifilm · Part II" },
  { id: 10, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Tb7Emw9w1Y0", titre: "Bizzarrini — Reportage", sousTitre: "Archive" },
  { id: 11, plateforme: "youtube", url: "https://www.youtube.com/watch?v=Y50RDb7q1d8", titre: "Bizzarrini 5300 GT Strada", sousTitre: "Essai" },
  { id: 12, plateforme: "youtube", url: "https://www.youtube.com/watch?v=H3163F-AEmo", titre: "Bizzarrini P538", sousTitre: "Course" },
  { id: 13, plateforme: "youtube", url: "https://www.youtube.com/watch?v=GQ22n_sNu2g", titre: "Bizzarrini — Hommage", sousTitre: "Documentaire" },
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
