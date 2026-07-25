/**
 * One-off script — traduit voiture_details.description (anglais approximatif
 * rédigé par un francophone) vers :
 *   - description_en  (anglais soigné, style anglo-saxon)
 *   - description_fr  (français)
 *   - description_it  (italien)
 *
 * Prérequis :
 *   1. Exécuter supabase_migration_translations.sql dans Supabase (ajoute les colonnes).
 *   2. Variables d'env : SERVICE_ROLE_KEY, LOVABLE_API_KEY.
 *
 * Lancement :
 *   bun run scripts/translate_histories.ts
 *
 * Idempotent : ne retraduit pas les lignes déjà remplies (sauf --force).
 */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE = process.env.SERVICE_ROLE_KEY!;
const LOVABLE = process.env.LOVABLE_API_KEY!;
const FORCE = process.argv.includes("--force");

if (!SUPABASE_URL || !SERVICE || !LOVABLE) {
  console.error("Manque SUPABASE_URL, SERVICE_ROLE_KEY ou LOVABLE_API_KEY.");
  process.exit(1);
}

const sbHeaders = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

type Row = {
  voiture_id: number;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  description_it: string | null;
};

async function fetchRows(): Promise<Row[]> {
  const url = `${SUPABASE_URL}/rest/v1/voiture_details?select=voiture_id,description,description_en,description_fr,description_it`;
  const r = await fetch(url, { headers: sbHeaders });
  if (!r.ok) throw new Error(`fetch rows: ${r.status} ${await r.text()}`);
  return r.json();
}

const SYSTEM = `You are a specialist translator for a Bizzarrini classic-car registry.

The source texts were written in approximate English by a native French speaker
and describe the provenance of individual chassis (owners, races, restorations,
auctions, colours, registration plates, magazines).

Rules — apply to every translation:
- Preserve ALL proper nouns exactly as written: driver / owner names, chassis
  numbers (e.g. B-0230, IA3 0245, P538-002), race and circuit names, cities,
  countries, magazine titles, registration plates.
- Preserve years, prices, currencies and numeric values exactly.
- Keep the chronological structure and line breaks (one event per line when
  the source is line-per-line). Do NOT merge or reorder events.
- Do not invent facts, do not add commentary, do not remove information.
- Fix obvious typos and awkward phrasing from the source.
- Automotive terminology must stay precise and idiomatic in the target language
  (chassis / châssis / telaio, bodywork / carrosserie / carrozzeria,
  restoration / restauration / restauro, auction / vente aux enchères / asta,
  etc.).

Return STRICT JSON, no prose, no code fences:
{"en":"…","fr":"…","it":"…"}`;

const BAD_TAIL = /(?:,|;|:|–|-|\band\b|\bet\b|\bed\b|\bat\b|\bin\b|\bon\b|\bof\b|\bthe\b|\bdans\b|\bau\b|\baux\b|\bde\b|\bdu\b|\bà\b|\bnel\b|\bnella\b|\bdi\b|\bda\b)\s*\.?\s*$/i;

function looksTruncated(src: string, out: string): string | null {
  const s = out.trim();
  const srcTrim = src.trim();
  if (!s) return "empty";
  if (s.length < Math.floor(srcTrim.length * 0.55))
    return `too short (${s.length} vs ${srcTrim.length})`;
  if (BAD_TAIL.test(s)) return `bad tail: "...${s.slice(-40)}"`;
  // N'exige une ponctuation finale que si la source en a une
  if (/[.!?»"')\]]\s*$/.test(srcTrim) && !/[.!?»"')\]]\s*$/.test(s))
    return `no final punctuation: "...${s.slice(-40)}"`;
  return null;
}

async function translateOnce(text: string): Promise<{ en: string; fr: string; it: string }> {
  const body = {
    model: "openai/gpt-5.5",
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content:
          `Translate the following Bizzarrini chassis history IN FULL — do not truncate, do not summarize.\n` +
          `- "en": polished, native-sounding English (rewrite the French-influenced phrasing).\n` +
          `- "fr": natural French.\n` +
          `- "it": natural Italian.\n\n` +
          `SOURCE:\n"""\n${text}\n"""`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 16000,
  };

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const finish = j.choices?.[0]?.finish_reason;
  const content = j.choices?.[0]?.message?.content ?? "";
  if (finish && finish !== "stop") throw new Error(`finish_reason=${finish}`);
  const parsed = JSON.parse(content);
  if (!parsed.en || !parsed.fr || !parsed.it) {
    throw new Error(`Réponse incomplète: ${content.slice(0, 200)}`);
  }
  return parsed;
}

async function translate(text: string): Promise<{ en: string; fr: string; it: string }> {
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const t = await translateOnce(text);
      const issues: string[] = [];
      const en = looksTruncated(text, t.en); if (en) issues.push(`en: ${en}`);
      const fr = looksTruncated(text, t.fr); if (fr) issues.push(`fr: ${fr}`);
      const it = looksTruncated(text, t.it); if (it) issues.push(`it: ${it}`);
      if (issues.length === 0) return t;
      lastErr = issues.join(" | ");
      console.warn(`  attempt ${attempt} rejected → ${lastErr}`);
    } catch (e) {
      lastErr = (e as Error).message;
      console.warn(`  attempt ${attempt} error → ${lastErr}`);
    }
    await new Promise((r) => setTimeout(r, 600 * attempt));
  }
  throw new Error(`translation failed after 3 attempts: ${lastErr}`);
}

async function update(voiture_id: number, patch: Record<string, string>) {
  const url = `${SUPABASE_URL}/rest/v1/voiture_details?voiture_id=eq.${voiture_id}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`patch ${voiture_id}: ${r.status} ${await r.text()}`);
}

async function main() {
  const rows = await fetchRows();
  const todo = rows.filter(
    (r) =>
      r.description &&
      r.description.trim().length > 0 &&
      (FORCE || !r.description_en || !r.description_fr || !r.description_it),
  );
  console.log(`Total lignes: ${rows.length} — à traduire: ${todo.length}${FORCE ? " (force)" : ""}`);

  let ok = 0;
  let fail = 0;
  for (const [i, row] of todo.entries()) {
    const tag = `[${i + 1}/${todo.length}] id=${row.voiture_id}`;
    try {
      const t = await translate(row.description!);
      await update(row.voiture_id, {
        description_en: t.en,
        description_fr: t.fr,
        description_it: t.it,
      });
      ok++;
      console.log(`${tag} ✓`);
    } catch (e) {
      fail++;
      console.error(`${tag} ✗ ${(e as Error).message}`);
    }
    // petit délai pour éviter les rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nTerminé — succès: ${ok}, échecs: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
