export interface Book {
  titre: string;
  couverture: string;
  lienAchat?: string;
}

export const books: Book[] = [
  { titre: "Bizzarrini - The Genius behind Ferrari's Success", couverture: "/books/12.jpg" },
  { titre: 'De Tomaso "Macchine da Corsa" - The Official Racing History', couverture: "/books/10.jpg" },
  { titre: "Lancia 037 - Macchina da Corsa / Registro", couverture: "/books/book-9.jpg" },
  { titre: "Porsche 904 - The Truth and The Rumours", couverture: "/books/Book8.jpg" },
  { titre: "Bizzarrini - The Genius behind Ferrari's 250 GTO", couverture: "/books/Book7.jpg" },
  { titre: "Ford RS200 to Focus WRC - The Fabulous Destiny of the Ford Rally Cars", couverture: "/books/Book6.jpg" },
  { titre: "Ferrari 166 to F50 GT - The Racing Berlinettas", couverture: "/books/Book5.jpg" },
  { titre: "Ferrari Fifty Years on the Track - The Sport Racing Cars", couverture: "/books/Book4.jpg" },
  { titre: "Bizzarrini & Diomante - The Official History", couverture: "/books/Book3.jpg" },
  { titre: "Alfa Romeo TZ - Zagato - Autodelta - Conrero", couverture: "/books/Book1-1.jpg" },
  { titre: "Visa 1000 Pistes - La Petite Bombe", couverture: "/books/Book2.jpg" },
];
