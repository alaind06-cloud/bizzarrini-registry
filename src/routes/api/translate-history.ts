import { createFileRoute } from "@tanstack/react-router";

/**
 * Traduction d'un historique de châssis via la passerelle IA Lovable
 * (même service que celui utilisé pour les 192 historiques existants).
 * Entrée : { text, source: "fr" | "en" | "it" }
 * Sortie : { fr, en, it }
 */

const SYSTEM = `You are a specialist translator for a Bizzarrini classic-car registry.

The source texts describe the provenance of individual chassis (owners, races,
restorations, auctions, colours, registration plates, magazines).

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
  restoration / restauration / restauro, auction / vente aux enchères / asta).

Return STRICT JSON, no prose, no code fences:
{"en":"…","fr":"…","it":"…"}`;

export const Route = createFileRoute("/api/translate-history")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text, source } = (await request.json()) as {
            text?: string;
            source?: "fr" | "en" | "it";
          };
          if (!text || !text.trim()) {
            return Response.json({ ok: false, reason: "empty_text" }, { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            console.error("[translate-history] LOVABLE_API_KEY absente de l'environnement serveur.");
            return Response.json({ ok: false, reason: "no_api_key" }, { status: 500 });
          }

          const langName = { fr: "French", en: "English", it: "Italian" } as const;
          const src = source && langName[source] ? source : "fr";

          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
            body: JSON.stringify({
              model: "openai/gpt-5.5",
              messages: [
                { role: "system", content: SYSTEM },
                {
                  role: "user",
                  content:
                    `The source text below is written in ${langName[src]}.\n` +
                    `Translate it IN FULL — do not truncate, do not summarize.\n` +
                    `- "fr": natural French.\n- "en": polished, native-sounding English.\n- "it": natural Italian.\n` +
                    `For the source language, return the text lightly cleaned up but faithful.\n\n` +
                    `SOURCE:\n"""\n${text}\n"""`,
                },
              ],
              response_format: { type: "json_object" },
              max_completion_tokens: 16000,
            }),
          });

          if (!r.ok) {
            const detail = await r.text();
            console.error("[translate-history] gateway error", r.status, detail.slice(0, 300));
            return Response.json(
              { ok: false, reason: r.status === 429 ? "rate_limit" : "gateway_error" },
              { status: 502 },
            );
          }

          const j = (await r.json()) as any;
          const content = j.choices?.[0]?.message?.content ?? "";
          let parsed: { fr?: string; en?: string; it?: string };
          try {
            parsed = JSON.parse(content);
          } catch {
            return Response.json({ ok: false, reason: "bad_json" }, { status: 502 });
          }
          if (!parsed.fr || !parsed.en || !parsed.it) {
            return Response.json({ ok: false, reason: "incomplete" }, { status: 502 });
          }

          return Response.json({ ok: true, fr: parsed.fr, en: parsed.en, it: parsed.it });
        } catch (e) {
          console.error("[translate-history]", e);
          return Response.json({ ok: false, reason: "unexpected" }, { status: 500 });
        }
      },
    },
  },
});
