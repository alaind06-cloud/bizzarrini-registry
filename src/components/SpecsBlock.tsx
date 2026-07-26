import { useI18n } from "@/lib/i18n";
import {
  SPEC_FIELDS,
  specSource,
  specText,
  type ArchiveSpecs,
} from "@/data/chassis-specs";

/**
 * Rendu générique du bloc « Spécifications ».
 * Il parcourt `SPEC_FIELDS` (src/data/chassis-specs.ts) : ajouter un nouveau
 * type de champ ne demande aucune modification ici ni dans la page châssis.
 *
 * Chaque valeur peut être une simple chaîne, ou un objet
 * `{ value, source }` — la source (référence du document scanné) est alors
 * affichée en petit sous la valeur.
 */
const SOURCE_LABEL: Record<string, string> = {
  fr: "Source",
  en: "Source",
  it: "Fonte",
};

export function SpecsBlock({ specs }: { specs: ArchiveSpecs }) {
  const { t, lang } = useI18n();

  const labelOf = (field: (typeof SPEC_FIELDS)[number]) => {
    const key = `car.specs.${field.key}`;
    const translated = t(key);
    // t() renvoie la clé quand aucune traduction n'existe : on retombe alors
    // sur le libellé de secours déclaré avec le champ.
    if (translated && translated !== key) return translated;
    return field.label[lang] ?? field.label.fr;
  };

  const sourceLabel = (() => {
    const key = "car.specs.source";
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return SOURCE_LABEL[lang] ?? SOURCE_LABEL.fr;
  })();

  const Source = ({ source }: { source?: string }) =>
    source ? (
      <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground/80 italic">
        {sourceLabel} : {source}
      </p>
    ) : null;

  const present = SPEC_FIELDS.filter((f) => specText(specs[f.key]).trim().length > 0);
  const pairs = present.filter((f) => f.layout !== "full");
  const fullWidth = present.filter((f) => f.layout === "full");

  if (present.length === 0) return null;

  return (
    <div className="border border-border bg-surface/50 rounded-sm p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
        {t("car.specs.title")}
      </p>
      {pairs.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {pairs.map((field) => (
            <div key={field.key} className="flex flex-col gap-0.5">
              <dt className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                {labelOf(field)}
              </dt>
              <dd className="text-foreground font-semibold">
                {specText(specs[field.key])}
                <Source source={specSource(specs[field.key])} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {fullWidth.map((field, i) => (
        <div
          key={field.key}
          className={`text-sm ${pairs.length > 0 || i > 0 ? "mt-4 pt-4 border-t border-border/70" : ""}`}
        >
          <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            {labelOf(field)}
          </p>
          <p className="mt-1 text-foreground/90 leading-relaxed">
            {specText(specs[field.key])}
          </p>
          <Source source={specSource(specs[field.key])} />
        </div>
      ))}
    </div>
  );
}
