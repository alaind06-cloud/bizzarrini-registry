import { canonical } from "@/lib/seo";

const CANONICAL = canonical("/giotto-bizzarrini");

export const GIOTTO_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${CANONICAL}#giotto-bizzarrini`,
      name: "Giotto Bizzarrini",
      birthDate: "1926-06-06",
      deathDate: "2023-05-13",
      birthPlace: { "@type": "Place", name: "Livorno, Italy" },
      jobTitle: "Automotive Engineer",
      alumniOf: { "@type": "EducationalOrganization", name: "University of Pisa" },
      knowsAbout: [
        "Ferrari 250 GTO",
        "Iso Grifo A3/C",
        "Bizzarrini 5300 GT",
        "Bizzarrini P538",
        "Lamborghini V12 Engine",
      ],
    },
    {
      "@type": "DataCatalog",
      "@id": `${CANONICAL}#chassis-register`,
      name: "Giotto Bizzarrini Chassis Register",
      description:
        "Historical register documenting surviving chassis connected to Giotto Bizzarrini's work.",
      about: { "@id": `${CANONICAL}#giotto-bizzarrini` },
    },
  ],
};
