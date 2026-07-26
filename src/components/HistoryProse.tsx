import { Fragment, type ReactNode } from "react";

/**
 * Rendu lisible d'un texte d'historique long :
 * - découpage en paragraphes (un par époque / changement de propriétaire),
 * - mise en évidence discrète des dates et des noms propres,
 * - largeur de ligne limitée pour le confort de lecture.
 */

const DATE_RE =
  /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|(?:1[89]|20)\d{2})\b/g;

/** Séquences de 2+ mots capitalisés (noms de propriétaires, villes, maisons de vente). */
const NAME_RE =
  /\b(?:[A-ZÀ-Þ][\p{L}'’&.-]+)(?:\s+(?:de|di|du|van|von|der|del|la|le)?\s*[A-ZÀ-Þ][\p{L}'’&.-]+)+/gu;

function highlight(text: string, keyPrefix: string): ReactNode[] {
  const marks: Array<{ start: number; end: number; kind: "date" | "name" }> = [];

  for (const m of text.matchAll(DATE_RE)) {
    marks.push({ start: m.index!, end: m.index! + m[0].length, kind: "date" });
  }
  for (const m of text.matchAll(NAME_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (marks.some((x) => start < x.end && end > x.start)) continue;
    marks.push({ start, end, kind: "name" });
  }
  marks.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  marks.forEach((mark, i) => {
    if (mark.start < cursor) return;
    if (mark.start > cursor) out.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(cursor, mark.start)}</Fragment>);
    const chunk = text.slice(mark.start, mark.end);
    out.push(
      mark.kind === "date" ? (
        <strong key={`${keyPrefix}-d${i}`} className="font-mono text-brand font-medium">
          {chunk}
        </strong>
      ) : (
        <strong key={`${keyPrefix}-n${i}`} className="font-medium text-foreground">
          {chunk}
        </strong>
      ),
    );
    cursor = mark.end;
  });
  if (cursor < text.length) out.push(<Fragment key={`${keyPrefix}-tail`}>{text.slice(cursor)}</Fragment>);
  return out;
}

/** Découpe en phrases puis regroupe : nouveau paragraphe sur une date en tête ou tous ~3 phrases. */
export function splitParagraphs(text: string): string[] {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const sentences = block.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*\s*/g) ?? [block];
    let current: string[] = [];
    let words = 0;
    const flush = () => {
      if (current.length) paragraphs.push(current.join("").trim());
      current = [];
      words = 0;
    };
    for (const s of sentences) {
      const startsWithDate = /^\s*(?:En\s+|In\s+|Nel\s+)?(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|(?:1[89]|20)\d{2})\b/.test(s);
      if (current.length && (startsWithDate || words > 55)) flush();
      current.push(s);
      words += s.split(/\s+/).length;
    }
    flush();
  }
  return paragraphs.length ? paragraphs : [text];
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function HistoryProse({
  text,
  maxParagraphs,
  className = "",
}: {
  text: string;
  maxParagraphs?: number;
  className?: string;
}) {
  const all = splitParagraphs(text);
  const paragraphs = maxParagraphs ? all.slice(0, maxParagraphs) : all;

  return (
    <div className={`max-w-[46rem] min-w-0 space-y-4 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[1.0625rem] leading-[1.8] text-foreground/90 [overflow-wrap:anywhere] hyphens-auto">
          {highlight(p, `p${i}`)}
        </p>
      ))}
    </div>
  );
}
