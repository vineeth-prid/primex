"use client";
import { useEffect, useRef } from "react";
import SignaturePadLib from "signature_pad";

/** Canvas signature (finger/stylus). Emits a PNG data URL, or null when cleared. */
export default function SignaturePad({
  value, onChange, disabled, label,
}: { value: string | null; onChange: (png: string | null) => void; disabled?: boolean; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePadLib>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const c = canvas.current!;
    const p = new SignaturePadLib(c, { minWidth: 1, maxWidth: 2.8, penColor: "#0a2a8a" });
    pad.current = p;
    const fit = () => {
      const data = p.isEmpty() ? null : p.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      c.width = c.offsetWidth * ratio;
      c.height = c.offsetHeight * ratio;
      c.getContext("2d")!.scale(ratio, ratio);
      p.clear();
      if (data) p.fromData(data);
    };
    fit();
    if (value) p.fromDataURL(value, { width: c.offsetWidth, height: c.offsetHeight });
    p.addEventListener("endStroke", () => cb.current(p.toDataURL("image/png")));
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); p.off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (disabled) pad.current?.off(); else pad.current?.on(); }, [disabled]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <button type="button" className="btn-secondary min-h-10 px-3 text-sm"
          onClick={() => { pad.current?.clear(); onChange(null); }}>Clear / Redo</button>
      </div>
      <div className={`relative select-none rounded-xl border-2 border-dashed ${disabled ? "border-neutral-200 bg-neutral-50" : "border-neutral-400"}`}>
        <canvas ref={canvas} className="block h-56 w-full touch-none sm:h-64" aria-label={label} />
        <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-neutral-300" />
        {disabled && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-neutral-500">
            Accept the Terms and Conditions above to sign
          </p>
        )}
      </div>
    </div>
  );
}
