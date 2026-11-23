"use client";
import { useEffect, useRef, useState } from "react";
import { CONDITIONS, FUEL_LEVELS, SHOP, TEXT, type Lang } from "@/lib/terms";
import { clearDraft, compressImage, dataUrlToBlob, loadDraft, saveDraft } from "./client-utils";
import SavedCard from "./SavedCard";
import SignaturePad from "./SignaturePad";
import TermsView, { LangToggle } from "./TermsView";

type Photo = { id: string; blob: Blob };
type Draft = {
  clientRef: string;
  step: number;
  f: Record<string, string>;
  marks: { x: number; y: number }[];
  fuelLevel: number | null;
  conditions: Record<string, boolean>;
  otherCondition: string;
  photos: Photo[];
  lang: Lang;
  acceptMode: "read" | "quick" | null;
  acceptedAt: string | null;
  signature: string | null;
  signedAt: string | null;
};

const DRAFT_KEY = "new";
const STEPS = ["Customer & Vehicle", "Inspection", "Photos", "Terms & Signature"];

const nowParts = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

function freshDraft(): Draft {
  const { date, time } = nowParts();
  let receivedBy = "";
  try { receivedBy = localStorage.getItem("receivedBy") ?? ""; } catch {}
  return {
    clientRef: crypto.randomUUID(), step: 0,
    f: { dateIn: date, timeIn: time, receivedBy },
    marks: [], fuelLevel: null, conditions: {}, otherCondition: "", photos: [],
    lang: "en", acceptMode: null, acceptedAt: null, signature: null, signedAt: null,
  };
}

export default function JobCardForm() {
  const [d, setD] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: number; jobCardNumber: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { loadDraft<Draft>(DRAFT_KEY).then((x) => setD(x ?? freshDraft())); }, []);
  useEffect(() => {
    if (!d || saved) return;
    const t = setTimeout(() => saveDraft(DRAFT_KEY, d), 400);
    return () => clearTimeout(t);
  }, [d, saved]);

  if (!d) return <p className="p-6 text-neutral-500">Loading…</p>;
  if (saved) {
    return (
      <SavedCard {...saved} mobile={d.f.mobile ?? ""} customerName={d.f.customerName ?? ""} title="Job card saved">
        <button className="btn-primary" onClick={() => { setSaved(null); setD(freshDraft()); }}>New Job Card</button>
      </SavedCard>
    );
  }

  const set = (patch: Partial<Draft>) => { setError(""); setD((x) => ({ ...x!, ...patch })); };
  const field = (name: string) => ({
    name, id: name, value: d.f[name] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ f: { ...d.f, [name]: e.target.value } }),
  });
  const go = (step: number) => { set({ step }); window.scrollTo({ top: 0 }); };

  async function submit() {
    if (!d || saving) return;
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.set("data", JSON.stringify({
        ...d.f, customerRepName: d.f.customerRepName ?? d.f.customerName, clientRef: d.clientRef, diagramMarks: d.marks, fuelLevel: d.fuelLevel,
        conditions: { ...d.conditions, other: d.conditions.other ? d.otherCondition : "" },
        lang: d.lang, termsAcceptMode: d.acceptMode, termsAcceptedAt: d.acceptedAt, signedAt: d.signedAt,
      }));
      d.photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i + 1}`));
      fd.set("signature", await dataUrlToBlob(d.signature!), "signature.png");
      const r = await fetch("/api/jobcards", { method: "POST", body: fd });
      const body = await r.json().catch(() => ({}));
      if (r.status === 401) throw new Error("Session expired — sign in again in a new tab, then tap Save (your draft is kept).");
      if (!r.ok) throw new Error(body.error ?? "Save failed");
      try { localStorage.setItem("receivedBy", d.f.receivedBy ?? ""); } catch {}
      await clearDraft(DRAFT_KEY);
      setSaved(body);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "No connection. Your draft is kept — try again.");
    } finally {
      setSaving(false);
    }
  }

  function onNext(e: React.FormEvent) {
    e.preventDefault();
    if (d!.step < STEPS.length - 1) return go(d!.step + 1);
    if (!d!.acceptMode) return setError("The customer must accept the Terms and Conditions.");
    if (!d!.signature) return setError("The customer signature is required.");
    submit();
  }

  return (
    <main className="mx-auto max-w-4xl p-4 pb-28">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">New Job Card</h1>
        <button type="button" className="text-sm text-neutral-500 underline"
          onClick={() => { if (confirm("Discard this draft and start over?")) { clearDraft(DRAFT_KEY); setD(freshDraft()); } }}>
          Discard draft
        </button>
      </div>

      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" disabled={i > d.step} onClick={() => go(i)} className="w-full text-left">
              <div className={`h-1.5 rounded-full ${i <= d.step ? "bg-neutral-900" : "bg-neutral-200"}`} />
              <span className={`mt-1 block text-xs sm:text-sm ${i === d.step ? "font-semibold" : "text-neutral-500"}`}>{i + 1}. {s}</span>
            </button>
          </li>
        ))}
      </ol>

      <form ref={formRef} onSubmit={onNext} className="space-y-6">
        {d.step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="card grid gap-4">
              <Field label="Customer Name *"><input className="input" {...field("customerName")} required autoComplete="off" /></Field>
              <Field label="Mobile No *"><input className="input" {...field("mobile")} required type="tel" inputMode="tel" pattern="\+?[0-9\s\-]{7,20}" /></Field>
              <Field label="Plate No *"><input className="input uppercase" {...field("plateNo")} required autoComplete="off" /></Field>
              <Field label="Car Model *"><input className="input" {...field("carModel")} required /></Field>
              <Field label="Address"><input className="input" {...field("address")} /></Field>
            </fieldset>
            <fieldset className="card grid gap-4">
              <Field label="Date In *"><input className="input" {...field("dateIn")} required type="date" /></Field>
              <Field label="Time Car In *"><input className="input" {...field("timeIn")} required type="time" /></Field>
              <p className="text-sm text-neutral-500">Time Car Out is recorded at delivery.</p>
              <Field label="Type of Services"><input className="input" {...field("typeOfServices")} /></Field>
              <Field label="Odometer Reading"><input className="input" {...field("odometer")} type="number" inputMode="numeric" min={0} /></Field>
            </fieldset>
          </div>
        )}

        {d.step === 1 && (
          <>
            <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
              <div className="card">
                <p className="label">Tap the diagram to mark (✓) existing scratches, dents or damage. Tap a mark to remove it.</p>
                <div className="relative select-none" onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  set({ marks: [...d.marks, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }] });
                }}>
                  <img src="/car-diagram.png" alt="Vehicle diagram" className="w-full" draggable={false} />
                  {d.marks.map((m, i) => (
                    <button key={i} type="button" aria-label="Remove mark"
                      className="absolute -translate-x-1/2 -translate-y-1/2 p-2 text-2xl font-bold leading-none text-red-600"
                      style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                      onClick={(e) => { e.stopPropagation(); set({ marks: d.marks.filter((_, j) => j !== i) }); }}>✓</button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-500">{SHOP.diagramHint}</p>
              </div>
              <div className="space-y-4">
                <div className="card">
                  <p className="label">Fuel Level</p>
                  <div className="grid grid-cols-5 gap-2">
                    {FUEL_LEVELS.map((l, i) => (
                      <button key={l} type="button" onClick={() => set({ fuelLevel: d.fuelLevel === i ? null : i })}
                        className={`min-h-12 rounded-lg border text-lg font-semibold ${d.fuelLevel === i ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <p className="font-semibold">VEHICLE CONDITION AT CHECK-IN</p>
                  <p className="mb-2 text-sm text-neutral-500">(Please tick if any)</p>
                  <div className="grid gap-1">
                    {[...CONDITIONS, ["other", "Other"] as const].map(([k, l]) => (
                      <label key={k} className="flex min-h-11 items-center gap-3">
                        <input type="checkbox" className="h-5 w-5" checked={!!d.conditions[k]}
                          onChange={(e) => set({ conditions: { ...d.conditions, [k]: e.target.checked } })} />
                        {l}
                      </label>
                    ))}
                    {d.conditions.other && (
                      <input className="input" placeholder="Other: describe" value={d.otherCondition} required
                        onChange={(e) => set({ otherCondition: e.target.value })} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Field label="ADDITIONAL COMMENTS / SPECIFIC CONDITION NOTES (Advisor)"><textarea className="input" rows={3} {...field("advisorNotes")} /></Field>
            <Field label="WORK TO BE DONE / SERVICES REQUESTED"><textarea className="input" rows={3} {...field("workRequested")} /></Field>
            <Field label="SPECIAL INSTRUCTIONS / CUSTOMER REQUESTS"><textarea className="input" rows={3} {...field("specialInstructions")} /></Field>
          </>
        )}

        {d.step === 2 && <Photos photos={d.photos} onChange={(photos) => set({ photos })} />}

        {d.step === 3 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Terms &amp; Conditions</h2>
              <LangToggle lang={d.lang} onChange={(lang) => set({ lang })} />
            </div>
            <TermsView lang={d.lang} />
            <div className="card space-y-2" dir={d.lang === "ar" ? "rtl" : "ltr"}>
              {(["read", "quick"] as const).map((mode) => (
                <label key={mode} className="flex min-h-12 items-center gap-3 text-base font-medium">
                  <input type="checkbox" className="h-6 w-6 shrink-0" checked={d.acceptMode === mode}
                    onChange={(e) => set(e.target.checked
                      ? { acceptMode: mode, acceptedAt: new Date().toISOString() }
                      : { acceptMode: null, acceptedAt: null, signature: null, signedAt: null })} />
                  {mode === "read" ? TEXT.acceptRead[d.lang] : TEXT.acceptQuick[d.lang]}
                </label>
              ))}
            </div>

            <div className="card space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-neutral-900 font-bold text-white">1</span>
                <div dir={d.lang === "ar" ? "rtl" : "ltr"}>
                  <h3 className="font-semibold">{TEXT.checkinTitle[d.lang]}</h3>
                  <p className="text-sm text-neutral-700">{TEXT.checkinText[d.lang]}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={`${TEXT.repName.en} *`}>
                  <input className="input" name="customerRepName" required value={d.f.customerRepName ?? d.f.customerName ?? ""}
                    onChange={(e) => set({ f: { ...d.f, customerRepName: e.target.value } })} />
                </Field>
                <Field label="Received By *"><input className="input" {...field("receivedBy")} required /></Field>
              </div>
              <SignaturePad label="Customer Signature *" value={d.signature} disabled={!d.acceptMode}
                onChange={(signature) => set({ signature, signedAt: signature ? new Date().toISOString() : null })} />
              {d.signedAt && <p className="text-sm text-neutral-500">Date &amp; Time: {new Date(d.signedAt).toLocaleString("en-GB")}</p>}
            </div>
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white p-3">
          <div className="mx-auto flex max-w-4xl gap-3">
            {d.step > 0 && <button type="button" className="btn-secondary" onClick={() => go(d.step - 1)}>Back</button>}
            <button className="btn-primary flex-1" disabled={saving}>
              {d.step < STEPS.length - 1 ? `Next: ${STEPS[d.step + 1]}` : saving ? "Saving…" : "Save Job Card"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function Photos({ photos, onChange }: { photos: Photo[]; onChange: (p: Photo[]) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

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
    onChange([...photos, ...added].slice(0, 30));
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Vehicle Images – Before Service</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn-primary min-h-16 text-lg" onClick={() => camera.current?.click()} disabled={busy}>
          📷 Capture Vehicle Image
        </button>
        <button type="button" className="btn-secondary min-h-16" onClick={() => gallery.current?.click()} disabled={busy}>
          Upload from Gallery
        </button>
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {busy && <p className="text-sm text-neutral-500">Processing photos…</p>}
      <p className="text-sm text-neutral-500">{photos.length} photo{photos.length === 1 ? "" : "s"} (max 30)</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <figure key={p.id} className="relative overflow-hidden rounded-lg border border-neutral-200">
            {urls[p.id] && <img src={urls[p.id]} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />}
            <button type="button" aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-xl text-white"
              onClick={() => onChange(photos.filter((x) => x.id !== p.id))}>×</button>
          </figure>
        ))}
      </div>
    </div>
  );
}
