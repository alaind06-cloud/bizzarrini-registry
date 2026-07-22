export type Book = {
  titre: string;
  couverture: string;
  lienAchat?: string;
};

// 11 livres publiés par Philippe Olczyk.
// Remplacer titres et liens d'achat par les valeurs définitives.
export const books: Book[] = [
  { titre: "Alfa Romeo TZ — Zagato, Autodelta, Conrero", couverture: "/books/book-1.jpg" },
  { titre: "Citroën Visa 1000 Pistes — La Petite Bombe", couverture: "/books/book-2.jpg" },
  { titre: "Bizzarrini & Diomante — The Official History", couverture: "/books/book-3.jpg" },
  { titre: "Ferrari — Fifty Years on the Track", couverture: "/books/book-4.jpg" },
  { titre: "Ferrari 166 to F50 GT — The Racing Berlinettas", couverture: "/books/book-5.jpg" },
  { titre: "Ford — RS200 to Focus WRC", couverture: "/books/book-6.jpg" },
  { titre: "Bizzarrini — The Genius behind Ferrari's 250 GTO", couverture: "/books/book-7.jpg" },
  { titre: "Porsche 904 — The Truth and The Rumours", couverture: "/books/book-8.jpg" },
  { titre: "Lancia 037 — Macchina da Corsa Registro", couverture: "/books/book-9.jpg" },
  { titre: "De Tomaso S.p.A. — Macchine da Corsa", couverture: "/books/book-10.jpg" },
  { titre: "Bizzarrini — The Man, His Projects and His Cars", couverture: "/books/book-11.jpg" },
];
