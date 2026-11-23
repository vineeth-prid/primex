"use client";
import Link from "next/link";
import { useState } from "react";
import { TEXT, type Lang } from "@/lib/terms";
import { dataUrlToBlob } from "./client-utils";
import SavedCard from "./SavedCard";
import SignaturePad from "./SignaturePad";
import { LangToggle } from "./TermsView";

type Card = {
  id: number; jobCardNumber: string; customerName: string; mobile: string; plateNo: string;
  carModel: string; lang: Lang; delivered: boolean; workRequested: string | null;
};

export default function DeliveryForm({ card }: { card: Card }) {
  const t = new Date();
  const [timeOut, setTimeOut] = useState(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
  const [deliveredBy, setDeliveredBy] = useState(() => { try { return localStorage.getItem("receivedBy") ?? ""; } catch { return ""; } });
  const [lang, setLang] = useState<Lang>(card.lang);
  const [sig, setSig] = useState<{ png: string; at: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(card.delivered);

  if (done) {
    return (
      <SavedCard id={card.id} jobCardNumber={card.jobCardNumber} mobile={card.mobile} customerName={card.customerName} title="Vehicle delivered">
        <Link className="btn-primary" href="/staff/delivery">Back to Delivery</Link>
      </SavedCard>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sig) return setError("The customer signature is required.");
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.set("timeOut", timeOut);
      fd.set("deliveredBy", deliveredBy);
      fd.set("signedAt", sig.at);
      fd.set("signature", await dataUrlToBlob(sig.png), "signature.png");
      const r = await fetch(`/api/jobcards/${card.id}/delivery`, { method: "POST", body: fd });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error ?? "Save failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "No connection. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold">Delivery — {card.jobCardNumber}</h1>
      <p className="mb-4 text-neutral-600">{card.plateNo} · {card.carModel} · {card.customerName} · {card.mobile}</p>
      {card.workRequested && <p className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm"><strong>Work requested:</strong> {card.workRequested}</p>}
      <a className="mb-4 inline-block text-sm underline" href={`/api/jobcards/${card.id}/pdf?v=checkin`} target="_blank">View check-in job card (PDF)</a>
      <form onSubmit={submit} className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3" dir={lang === "ar" ? "rtl" : "ltr"}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-neutral-900 font-bold text-white">2</span>
            <div>
              <h2 className="font-semibold">{TEXT.deliveryTitle[lang]}</h2>
              <p className="text-sm text-neutral-700">{TEXT.deliveryText[lang]}</p>
            </div>
          </div>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Time Car Out *</span>
            <input className="input" type="time" required value={timeOut} onChange={(e) => setTimeOut(e.target.value)} /></label>
          <label className="block"><span className="label">Delivered By *</span>
            <input className="input" required value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)} /></label>
        </div>
        <SignaturePad label="Customer Signature *" value={null}
          onChange={(png) => setSig(png ? { png, at: new Date().toISOString() } : null)} />
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={saving}>{saving ? "Saving…" : "Confirm Delivery"}</button>
      </form>
    </main>
  );
}
