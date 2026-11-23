"use client";

/** Downscale + re-encode a camera photo before upload (server validates and re-encodes again). */
export async function compressImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.82));
  // Browsers without WebP encoding fall back to PNG from toBlob; use JPEG instead to stay small.
  if (blob && blob.type === "image/webp") return blob;
  return (await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85))) ?? file;
}

export const dataUrlToBlob = (d: string) => fetch(d).then((r) => r.blob());

// ── Draft persistence (IndexedDB: survives refresh, holds photo blobs) ──
const DB = "jobcard";
const open = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("drafts");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((res, rej) => {
    const r = fn(db.transaction("drafts", mode).objectStore("drafts"));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export const loadDraft = <T,>(key: string) => tx<T | undefined>("readonly", (s) => s.get(key)).catch(() => undefined);
export const saveDraft = (key: string, v: unknown) => tx("readwrite", (s) => s.put(v, key)).catch(() => {});
export const clearDraft = (key: string) => tx("readwrite", (s) => s.delete(key)).catch(() => {});

// ── Share ──
export const waPhone = (mobile: string) => {
  const d = mobile.replace(/\D/g, "");
  return d.length === 8 ? `974${d}` : d; // local Qatar numbers are 8 digits
};
