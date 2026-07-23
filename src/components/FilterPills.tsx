import { useI18n } from "@/lib/i18n";

export type ActivePill = {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
};

export function FilterPills({ pills }: { pills: ActivePill[] }) {
  const { t } = useI18n();
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">
        {t("filters.active")}
      </span>
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={p.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs text-foreground hover:bg-brand/20 hover:border-brand transition-colors"
          aria-label={t("filters.remove", { label: `${p.label}: ${p.value}` })}
        >
          <span className="uppercase tracking-widest text-brand">{p.label}</span>
          <span className="font-medium">{p.value}</span>
          <span aria-hidden="true" className="text-foreground/70">×</span>
        </button>
      ))}
    </div>
  );
}
