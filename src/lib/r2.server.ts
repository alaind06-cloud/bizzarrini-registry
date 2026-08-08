import { AwsClient } from "aws4fetch";

/**
 * Accès au bucket Cloudflare R2 qui héberge les photos du registre.
 * Lecture publique via `PHOTOS_BASE_URL` (voir src/lib/supabase-env.ts) ;
 * écriture uniquement côté serveur, via l'API S3 de R2.
 */

export const R2_PREFIX = "bizzarrini";

type R2Config = { client: AwsClient; base: string };

function config(): R2Config {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET"] ?? "registre-voitures-photos";

  const missing = [
    ...(!accountId ? ["R2_ACCOUNT_ID"] : []),
    ...(!accessKeyId ? ["R2_ACCESS_KEY_ID"] : []),
    ...(!secretAccessKey ? ["R2_SECRET_ACCESS_KEY"] : []),
  ];
  if (missing.length) throw new Error(`Configuration R2 incomplète : ${missing.join(", ")}`);

  return {
    client: new AwsClient({
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      service: "s3",
      region: "auto",
    }),
    base: `https://${accountId}.r2.cloudflarestorage.com/${bucket}`,
  };
}

const objectUrl = (base: string, filename: string) =>
  `${base}/${R2_PREFIX}/${filename.split("/").map(encodeURIComponent).join("/")}`;

/** Vrai si l'objet existe déjà dans le bucket. */
export async function r2Exists(filename: string): Promise<boolean> {
  const { client, base } = config();
  const res = await client.fetch(objectUrl(base, filename), { method: "HEAD" });
  return res.status === 200;
}

/** Écrit (ou remplace) une photo dans R2. */
export async function r2Put(filename: string, body: ArrayBuffer, contentType = "image/jpeg") {
  const { client, base } = config();
  const res = await client.fetch(objectUrl(base, filename), {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" },
  });
  if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${await res.text()}`);
}

/** Supprime une photo. */
export async function r2Delete(filename: string) {
  const { client, base } = config();
  const res = await client.fetch(objectUrl(base, filename), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${res.status}: ${await res.text()}`);
}

/** Renomme une photo (copie puis suppression de la source). */
export async function r2Move(from: string, to: string) {
  const { client, base } = config();
  const bucketPath = new URL(base).pathname; // /<bucket>
  const res = await client.fetch(objectUrl(base, to), {
    method: "PUT",
    headers: {
      "x-amz-copy-source": `${bucketPath}/${R2_PREFIX}/${from}`,
      "Cache-Control": "public, max-age=31536000",
    },
  });
  if (!res.ok) throw new Error(`R2 COPY ${res.status}: ${await res.text()}`);
  await r2Delete(from);
}
