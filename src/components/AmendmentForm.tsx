"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { compressImage } from "./client-utils";

type Photo = { id: string; blob: Blob };

/** Add an amendment: note required, photos optional (compressed on the device before upload). */
export default function AmendmentForm({ jobCardId }: { jobCardId: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const m: Record<string, string> = {};
    photos.forEach((p) => (m[p.id] = URL.createObjectURL(p.blob)));
    setUrls(m);
    return () => Object.values(m).forEach(URL.revokeObjectURL);
  }, [photos]);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: Photo[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try { added.push({ id: crypto.randomUUID(), blob: await compressImage(f) }); } catch { /* unreadable image: skip */ }
    }
    setPhotos((p) => [...p, ...added].slice(0, 10));
    setBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      fd.set("note", note);
      photos.forEach((p, i) => fd.append("photos", p.blob, `amendment-${i + 1}`));
      const r = await fetch(`/api/jobcards/${jobCardId}/amendments`, { method: "POST", body: fd });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error ?? "Save failed");
      setNote(""); setPhotos([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3">
      <textarea className="input" name="note" rows={3} required placeholder="Describe the correction"
        value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary" onClick={() => input.current?.click()} disabled={busy || photos.length >= 10}>
          Add photos (optional)
        </button>
        <span className="text-sm text-neutral-500">{photos.length}/10</span>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p, i) => (
            <figure key={p.id} className="relative overflow-hidden rounded-lg border border-neutral-200">
              {urls[p.id] && <img src={urls[p.id]} alt={`Amendment photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />}
              <button type="button" aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-lg text-white"
                onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}>×</button>
            </figure>
          ))}
        </div>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Add amendment"}</button>
    </form>
  );
}
