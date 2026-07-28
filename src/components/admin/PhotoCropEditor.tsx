import { useEffect, useMemo, useRef, useState } from "react";
import { renderEdited, type CropRect } from "@/lib/image-edit";

/**
 * Aperçu avant / après avec réglage manuel du recadrage.
 * Le rectangle est ajustable par les quatre poignées d'angle ou en le
 * déplaçant ; la rotation se fait par quarts de tour.
 */

type Props = {
  source: HTMLCanvasElement;
  crop: CropRect;
  rotation: number;
  onChange: (next: { crop: CropRect; rotation: number }) => void;
  onReset?: () => void;
};

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

const MIN = 32;

export function PhotoCropEditor({ source, crop, rotation, onChange, onReset }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: DragMode; x: number; y: number; start: CropRect } | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [afterUrl, setAfterUrl] = useState<string>("");

  useEffect(() => {
    setBeforeUrl(source.toDataURL("image/jpeg", 0.6));
  }, [source]);

  useEffect(() => {
    const preview = renderEdited(source, crop, rotation);
    setAfterUrl(preview.toDataURL("image/jpeg", 0.6));
  }, [source, crop, rotation]);

  const pct = useMemo(
    () => ({
      left: `${(crop.x / source.width) * 100}%`,
      top: `${(crop.y / source.height) * 100}%`,
      width: `${(crop.w / source.width) * 100}%`,
      height: `${(crop.h / source.height) * 100}%`,
    }),
    [crop, source.width, source.height],
  );

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: { ...crop } };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = boxRef.current;
    if (!d || !box) return;
    const rect = box.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / rect.width) * source.width;
    const dy = ((e.clientY - d.y) / rect.height) * source.height;
    const s = d.start;
    let next: CropRect = { ...s };
    if (d.mode === "move") {
      next.x = Math.min(Math.max(0, s.x + dx), source.width - s.w);
      next.y = Math.min(Math.max(0, s.y + dy), source.height - s.h);
    } else {
      let x1 = s.x;
      let y1 = s.y;
      let x2 = s.x + s.w;
      let y2 = s.y + s.h;
      if (d.mode.includes("w")) x1 = Math.min(Math.max(0, s.x + dx), x2 - MIN);
      if (d.mode.includes("e")) x2 = Math.max(Math.min(source.width, x2 + dx), x1 + MIN);
      if (d.mode.includes("n")) y1 = Math.min(Math.max(0, s.y + dy), y2 - MIN);
      if (d.mode.includes("s")) y2 = Math.max(Math.min(source.height, y2 + dy), y1 + MIN);
      next = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
    onChange({
      crop: {
        x: Math.round(next.x),
        y: Math.round(next.y),
        w: Math.round(next.w),
        h: Math.round(next.h),
      },
      rotation,
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const handle = "absolute h-3 w-3 border border-brand bg-background";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Avant</p>
        <div
          ref={boxRef}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative select-none bg-muted"
        >
          {beforeUrl && <img src={beforeUrl} alt="" draggable={false} className="block w-full" />}
          <div
            onPointerDown={startDrag("move")}
            style={pct}
            className="absolute cursor-move border border-brand shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          >
            <span onPointerDown={startDrag("nw")} className={`${handle} -left-1.5 -top-1.5 cursor-nwse-resize`} />
            <span onPointerDown={startDrag("ne")} className={`${handle} -right-1.5 -top-1.5 cursor-nesw-resize`} />
            <span onPointerDown={startDrag("sw")} className={`${handle} -bottom-1.5 -left-1.5 cursor-nesw-resize`} />
            <span onPointerDown={startDrag("se")} className={`${handle} -bottom-1.5 -right-1.5 cursor-nwse-resize`} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onChange({ crop, rotation: rotation - 1 })}
            className="btn-ghost !py-1 !px-2 !text-xs"
          >
            ↺ Pivoter
          </button>
          <button
            type="button"
            onClick={() => onChange({ crop, rotation: rotation + 1 })}
            className="btn-ghost !py-1 !px-2 !text-xs"
          >
            ↻ Pivoter
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ crop: { x: 0, y: 0, w: source.width, h: source.height }, rotation })
            }
            className="btn-ghost !py-1 !px-2 !text-xs"
          >
            Image entière
          </button>
          {onReset && (
            <button type="button" onClick={onReset} className="btn-ghost !py-1 !px-2 !text-xs">
              Recadrage auto
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Après</p>
        <div className="bg-muted">
          {afterUrl && <img src={afterUrl} alt="" className="block w-full" />}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {rotation % 2 === 0 ? crop.w : crop.h} × {rotation % 2 === 0 ? crop.h : crop.w} px ·
          qualité d'origine conservée
        </p>
      </div>
    </div>
  );
}
