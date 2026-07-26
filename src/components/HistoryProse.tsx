import { Fragment, type ReactNode } from "react";

/**
 * Rendu lisible d'un texte d'historique long :
 * - découpage en paragraphes (un par époque / changement de propriétaire),
 * - mise en évidence discrète des dates et des noms propres,
 * - largeur de ligne limitée pour le confort de lecture.
 */

const DATE_RE = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|(?:1[89]|20)\d{2})\b/g;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/g;

/** Mots courants qui ne doivent pas amorcer un nom propre en début de phrase. */
const SENTENCE_STARTERS =
  /^(?:Cette|Ce|Cet|Ces|Le|La|Les|Un|Une|Elle|Il|En|Puis|Après|Avant|Lors|Selon|Vendue|Livrée|Restaurée|Voir|The|This|These|That|A|An|It|In|After|Before|Sold|Delivered|See|Questa|Questo|Il|La|Le|Nel|Nella|Venduta|Dopo|Vedi)$/u;

/** Séquences de 2+ mots capitalisés (propriétaires, villes, maisons de vente). */
const NAME_RE =
  /\b[\p{Lu}][\p{L}\d'’&.-]*(?:\s+(?:de|di|du|van|von|der|del|la|le)\s+|\s+)[\p{Lu}][\p{L}\d'’&.-]*(?:(?:\s+(?:de|di|du|van|von|der|del|la|le)\s+|\s+)[\p{Lu}][\p{L}\d'’&.-]*)*/gu;

function highlight(text: string, keyPrefix: string): ReactNode[] {
  const marks: Array<{ start: number; end: number; kind: "date" | "name" }> = [];
  const urls: Array<{ start: number; end: number }> = [];
  for (const m of text.matchAll(URL_RE)) urls.push({ start: m.index!, end: m.index! + m[0].length });
  const inUrl = (s: number, e: number) => urls.some((u) => s < u.end && e > u.start);

  for (const m of text.matchAll(DATE_RE)) {
    const start = m.index!;
    const end = start + m[0].length;
    if (!inUrl(start, end)) marks.push({ start, end, kind: "date" });
  }

  for (const m of text.matchAll(NAME_RE)) {
    let start = m.index!;
    let value = m[0];
    // Ignore le premier mot s'il n'est capitalisé que parce qu'il ouvre la phrase.
    const before = text.slice(0, start).trimEnd();
    const atSentenceStart = before === "" || /[.!?:;–—]$/.test(before);
    if (atSentenceStart) {
      const first = value.split(/\s+/)[0];
      if (SENTENCE_STARTERS.test(first.replace(/[^\p{L}]/gu, ""))) {
        const rest = value.slice(first.length).replace(/^\s+/, "");
        if (!/\s/.test(rest)) continue; // il ne reste qu'un mot : pas un nom propre
        start += value.length - rest.length;
        value = rest;
      }
    }
    const end = start + value.length;
    if (inUrl(start, end)) continue;
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

const DOT = "\u0000";

/** Découpe en phrases puis regroupe : nouveau paragraphe sur une date en tête ou tous ~55 mots. */
export function splitParagraphs(text: string): string[] {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const paragraphs: string[] = [];

  for (const block of blocks) {
    // Protège les points internes (dates 15.05.1974, abréviations n°, no., etc.)
    const guarded = block
      .replace(/\s+/g, " ")
      .replace(/(\d)\.(?=\d)/g, `$1${DOT}`)
      .replace(/\b((?:no|No|nos|art|cf|env|Mr|Mme|Dr|St|Ste|c|ca|vs|ecc|etc)|[A-Z])\.(?=\s*\S)/g, `$1${DOT}`);

    const sentences = guarded.match(/[^.!?]+[.!?]*\s*/g) ?? [guarded];
    let current: string[] = [];
    let words = 0;
    const flush = () => {
      if (current.length) {
        const p = current.join("").replace(new RegExp(DOT, "g"), ".").trim();
        if (p) paragraphs.push(p);
      }
      current = [];
      words = 0;
    };
    for (const s of sentences) {
      const startsWithDate =
        /^\s*(?:En\s+|In\s+|Nel\s+)?(?:\d{1,2}[.\u0000/-]\d{1,2}[.\u0000/-]\d{2,4}|(?:1[89]|20)\d{2})\b/.test(s);
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
