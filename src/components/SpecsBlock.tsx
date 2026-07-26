import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  SPEC_FIELDS,
  specSource,
  specText,
  type ArchiveSpecs,
  type ArchiveSpecKey,
} from "@/data/chassis-specs";

/**
 * Rendu éditorial du bloc « Spécifications ».
 * Les champs (déclarés dans src/data/chassis-specs.ts) sont regroupés
 * visuellement par catégorie ci-dessous. Un champ non listé dans un groupe
 * atterrit automatiquement dans le groupe « other ».
 */
type GroupId = "engine" | "chassis" | "body" | "performance" | "other";

const GROUPS: Array<{
  id: GroupId;
  label: { fr: string; en: string; it: string };
  keys: readonly string[];
}> = [
  {
    id: "engine",
    label: { fr: "Moteur", en: "Engine", it: "Motore" },
    keys: ["engine", "engineNumber", "displacement", "power", "compression", "fuelSystem", "torque"],
  },
  {
    id: "chassis",
    label: { fr: "Transmission & châssis", en: "Transmission & chassis", it: "Trasmissione e telaio" },
    keys: ["transmission", "gearbox", "gearboxNumber", "brakes", "wheels", "electrical"],
  },
  {
    id: "body",
    label: { fr: "Carrosserie & dimensions", en: "Body & dimensions", it: "Carrozzeria e dimensioni" },
    keys: [
      "bodywork",
      "coachbuilder",
      "color",
      "interior",
      "seats",
      "condition",
      "wheelbase",
      "track",
      "length",
      "width",
      "height",
      "groundClearance",
      "weight",
      "fuelTank",
    ],
  },
  {
    id: "performance",
    label: { fr: "Performances", en: "Performance", it: "Prestazioni" },
    keys: ["topSpeed", "notes"],
  },
  {
    id: "other",
    label: { fr: "Divers", en: "Other", it: "Altro" },
    keys: [],
  },
];

/** Champs mis en avant quand la fiche est longue. */
const KEY_FIELDS: readonly string[] = ["power", "displacement", "weight", "topSpeed", "color"];

const SOURCE_LABEL: Record<string, string> = { fr: "Source", en: "Source", it: "Fonte" };
const MORE_LABEL: Record<string, string> = {
  fr: "Voir toutes les spécifications techniques",
  en: "See all technical specifications",
  it: "Vedi tutte le specifiche tecniche",
};
const LESS_LABEL: Record<string, string> = {
  fr: "Réduire les spécifications",
  en: "Hide full specifications",
  it: "Riduci le specifiche",
};

export function SpecsBlock({ specs }: { specs: ArchiveSpecs }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const tr = (key: string, fallback: Record<string, string>) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return fallback[lang] ?? fallback.fr;
  };

  const labelOf = (field: (typeof SPEC_FIELDS)[number]) => {
    const key = `car.specs.${field.key}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return field.label[lang] ?? field.label.fr;
  };

  const sourceLabel = tr("car.specs.source", SOURCE_LABEL);

  const present = SPEC_FIELDS.filter((f) => specText(specs[f.key]).trim().length > 0);
  if (present.length === 0) return null;

  const sources = Array.from(
    new Set(present.map((f) => specSource(specs[f.key])).filter(Boolean) as string[]),
  );
  const multipleSources = sources.length > 1;

  const collapsible = present.length > 10;
  const visible =
    collapsible && !expanded
      ? present.filter((f) => KEY_FIELDS.includes(f.key))
      : present;

  const groupOf = (key: ArchiveSpecKey): GroupId =>
    (GROUPS.find((g) => g.keys.includes(key))?.id ?? "other") as GroupId;

  const rendered = GROUPS.map((group) => ({
    group,
    fields: visible.filter((f) => groupOf(f.key) === group.id),
  })).filter((g) => g.fields.length > 0);

  const showGroupTitles = rendered.length > 1 && (!collapsible || expanded);

  return (
    <div className="border border-border bg-surface/50 rounded-sm p-6 sm:p-7">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">
        {t("car.specs.title")}
      </p>

      <div className="space-y-7">
        {rendered.map(({ group, fields }) => {
          const pairs = fields.filter((f) => f.layout !== "full");
          const fullWidth = fields.filter((f) => f.layout === "full");
          return (
            <section key={group.id} className="space-y-4">
              {showGroupTitles && (
                <div className="flex items-center gap-3">
                  <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-foreground/70 whitespace-nowrap">
                    {group.label[lang] ?? group.label.fr}
                  </h4>
                  <span className="h-px flex-1 bg-border/70" aria-hidden="true" />
                </div>
              )}

              {pairs.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  {pairs.map((field) => {
                    const source = specSource(specs[field.key]);
                    return (
                      <div key={field.key} className="flex flex-col gap-1">
                        <dt
                          className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/70"
                          title={multipleSources && source ? `${sourceLabel} : ${source}` : undefined}
                        >
                          {labelOf(field)}
                        </dt>
                        <dd className="text-[0.95rem] leading-snug text-foreground font-medium">
                          {specText(specs[field.key])}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}

              {fullWidth.map((field) => {
                const source = specSource(specs[field.key]);
                return (
                  <div key={field.key}>
                    <p
                      className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/70"
                      title={multipleSources && source ? `${sourceLabel} : ${source}` : undefined}
                    >
                      {labelOf(field)}
                    </p>
                    <p className="mt-1.5 text-[0.95rem] text-foreground/90 leading-relaxed">
                      {specText(specs[field.key])}
                    </p>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-7 text-[0.7rem] uppercase tracking-[0.18em] text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
        >
          {expanded ? tr("car.specs.showLess", LESS_LABEL) : tr("car.specs.showAll", MORE_LABEL)}
        </button>
      )}

      {sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/60">
          {sources.map((s) => (
            <p key={s} className="text-[0.65rem] leading-snug text-muted-foreground/80 italic">
              {sourceLabel} : {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
