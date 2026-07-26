import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HistoryProse, wordCount } from "@/components/HistoryProse";

export const Route = createFileRoute("/history-lab")({ component: Lab });

const SAMPLES: Array<{ id: string; text: string }> = [
  {
    id: "IA3-0242 (long, un seul bloc)",
    text:
      "Cette Bizzarrini IA3 châssis IA3-0242 est livrée neuve en 1968 au concessionnaire Auto-Supermarket Düsseldorf, en Allemagne, puis immatriculée dans la région de Cologne sous le numéro K-XY 4711. Elle est vendue en 1971 à Monsieur Jean-Pierre Delacroix, de Bruxelles, qui l'utilise régulièrement pour des rallyes routiers en Belgique et aux Pays-Bas. 15.05.1974 : la voiture passe entre les mains de la famille Van der Meer, à Amsterdam, qui la conserve pendant près de vingt ans sans la restaurer. En 1993, elle est redécouverte dans un garage par le marchand britannique David Hollingsworth, qui la fait transporter au Royaume-Uni et confie une restauration complète à l'atelier Classic Restorations Ltd de Chichester. Les travaux durent trois ans et comprennent la réfection totale du moteur Chevrolet 327, la remise en état de la boîte de vitesses, la reprise de la carrosserie en aluminium et une nouvelle sellerie en cuir noir. 1996 : la voiture est présentée au concours d'élégance de Windsor Castle où elle obtient une mention spéciale du jury. Elle est ensuite acquise par le collectionneur suisse Andreas Brunner, de Zurich, qui l'expose lors de plusieurs événements historiques, dont la Mille Miglia storica de 1999 et le Grand Prix de Monaco Historique de 2002. En 2008, elle rejoint une collection privée en Italie, à Modène, où elle est entretenue par l'atelier Officina Meccanica Rossi. 2017 : vendue lors d'une vente aux enchères RM Sotheby's à Villa Erba pour un montant non communiqué. La voiture est aujourd'hui conservée en Belgique dans une collection privée et conserve son numéro de moteur d'origine ainsi que sa plaque de châssis frappée IA3-0242. Reg. no.: \"SNK 899M\" — documentation disponible auprès du registre.",
  },
  {
    id: "Token très long / URL",
    text:
      "Engine # 447F0815RE-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX. Voir https://www.registerbizzarrini.com/archives/documentation/1968/homologation-fiche-technique-complete.pdf pour la fiche complète. 1968 : livraison.",
  },
  {
    id: "Court",
    text: "1970 : vendue à Firenze. 1972 : exportée en Suisse.",
  },
];

function Lab() {
  const [full, setFull] = useState(false);
  return (
    <div className="container-page py-10 space-y-12">
      <button
        onClick={() => setFull((v) => !v)}
        className="border border-border px-3 py-1.5 text-xs uppercase tracking-wider"
      >
        {full ? "Vue résumée" : "Vue complète"}
      </button>
      {SAMPLES.map((s) => (
        <section key={s.id} className="border-t border-border pt-6">
          <h2 className="font-display text-xl mb-4">
            {s.id} — {wordCount(s.text)} mots
          </h2>
          <div className="pl-4 border-l border-border/60">
            <HistoryProse text={s.text} maxParagraphs={!full && wordCount(s.text) > 120 ? 2 : undefined} />
          </div>
        </section>
      ))}
    </div>
  );
}
