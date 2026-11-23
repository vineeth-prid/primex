"use client";
import { useEffect, useState } from "react";
import { waPhone } from "./client-utils";

/** Post-save screen: view / download / share the stored PDF. */
export default function SavedCard({
  id, jobCardNumber, mobile, customerName, title, children,
}: { id: number; jobCardNumber: string; mobile: string; customerName: string; title: string; children?: React.ReactNode }) {
  const url = `/api/jobcards/${id}/pdf`;
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  // Prefetch so navigator.share() runs inside the tap (browsers require a fresh user gesture).
  useEffect(() => {
    fetch(url).then((r) => r.blob()).then((b) => setFile(new File([b], `${jobCardNumber}.pdf`, { type: "application/pdf" })));
  }, [url, jobCardNumber]);

  const text = `Dear ${customerName}, please find your PRIMEX job card ${jobCardNumber} attached.`;

  async function share() {
    setMsg("");
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Job Card ${jobCardNumber}`, text }); return; }
      catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    // Fallback: download, then open the customer's WhatsApp chat (app or WhatsApp Web).
    const a = document.createElement("a");
    a.href = `${url}?download=1`;
    a.download = `${jobCardNumber}.pdf`;
    a.click();
    window.open(`https://wa.me/${waPhone(mobile)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setMsg("PDF downloaded. In WhatsApp, tap the attachment (📎) icon and choose the downloaded PDF.");
  }

  return (
    <main className="mx-auto max-w-xl p-4 py-10 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-lg">Job Card No. <strong>{jobCardNumber}</strong></p>
      <div className="mt-8 grid gap-3">
        <button className="btn bg-[#25D366] text-white" onClick={share} disabled={!file}>Share via WhatsApp</button>
        <a className="btn-secondary" href={`${url}?download=1`}>Download PDF</a>
        <a className="btn-secondary" href={url} target="_blank">View PDF</a>
        {children}
      </div>
      {msg && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{msg}</p>}
    </main>
  );
}
