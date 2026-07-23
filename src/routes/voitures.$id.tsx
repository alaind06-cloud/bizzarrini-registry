import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { chassisToSlug } from "./chassis.$slug";

export const Route = createFileRoute("/voitures/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: LegacyRedirect,
});

function LegacyRedirect() {
  const { id } = Route.useParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("voitures").select("chassis").eq("id", id).maybeSingle();
      const chassis = (data as { chassis: string | null } | null)?.chassis;
      const s = chassisToSlug(chassis);
      if (s) setSlug(s);
      else setNotFound(true);
    })();
  }, [id]);

  if (notFound) return <Navigate to="/" replace />;
  if (slug) return <Navigate to="/chassis/$slug" params={{ slug }} replace />;
  return <div className="container-page py-20 text-center text-muted-foreground">…</div>;
}
