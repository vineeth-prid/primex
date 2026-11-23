import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { amendments, users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { getImages, getJobCard } from "@/lib/jobcards";
import { CONDITIONS, FUEL_LEVELS } from "@/lib/terms";

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

async function addAmendment(form: FormData) {
  "use server";
  const s = await requireRole("admin");
  const id = Number(form.get("id"));
  const note = String(form.get("note") ?? "").trim().slice(0, 4000);
  if (note && id) await db.insert(amendments).values({ jobCardId: id, note, createdBy: s.uid });
  revalidatePath(`/admin/jobcards/${id}`);
}

export default async function ViewJobCard({ params }: PageProps<"/admin/jobcards/[id]">) {
  await requireRole("admin");
  const id = Number((await params).id);
  const card = await getJobCard(id);
  if (!card) notFound();
  const [images, notes] = await Promise.all([
    getImages(id),
    db.select({ note: amendments.note, createdAt: amendments.createdAt, by: users.name })
      .from(amendments).innerJoin(users, eq(users.id, amendments.createdBy))
      .where(eq(amendments.jobCardId, id)).orderBy(desc(amendments.createdAt)),
  ]);
  const ticked: string[] = CONDITIONS.filter(([k]) => card.conditions[k]).map(([, l]) => l);
  if (card.conditions.other) ticked.push(`Other: ${card.conditions.other}`);

  const rows: [string, React.ReactNode][] = [
    ["Customer Name", card.customerName], ["Mobile No", card.mobile], ["Plate No", card.plateNo],
    ["Car Model", card.carModel], ["Address", card.address], ["Date In", card.dateIn], ["Time Car In", card.timeIn],
    ["Time Car Out", card.timeOut], ["Type of Services", card.typeOfServices], ["Odometer Reading", card.odometer],
    ["Fuel Level", card.fuelLevel != null ? FUEL_LEVELS[card.fuelLevel] : null],
    ["Vehicle Condition", ticked.join(", ") || "None ticked"], ["Diagram marks", card.diagramMarks.length],
    ["Additional Comments (Advisor)", card.advisorNotes], ["Work To Be Done", card.workRequested],
    ["Special Instructions", card.specialInstructions],
    ["Terms", `v${card.termsVersion} · ${card.termsAcceptMode === "read" ? "read & agreed" : "agreed"} · ${card.lang.toUpperCase()} · ${fmt(card.termsAcceptedAt)}`],
    ["Customer / Authorized Representative", card.customerRepName], ["Check-in signed", fmt(card.checkinSignedAt)],
    ["Received By", card.receivedBy], ["Delivered", fmt(card.deliveredAt)], ["Delivered By", card.deliveredBy],
  ];

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Job Card {card.jobCardNumber}</h1>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary" href={`/api/jobcards/${id}/pdf?v=checkin`} target="_blank">Check-in PDF</a>
          {card.finalPdfKey && <a className="btn-secondary" href={`/api/jobcards/${id}/pdf?v=final`} target="_blank">Final PDF</a>}
          <a className="btn-primary" href={`/api/jobcards/${id}/pdf?download=1`}>Download PDF</a>
        </div>
      </div>

      <dl className="grid gap-x-6 rounded-xl border border-neutral-300 p-4 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border-b border-neutral-100 py-2">
            <dt className="text-xs text-neutral-500">{k}</dt>
            <dd className="whitespace-pre-wrap">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-2 mt-6 font-semibold">Vehicle Images – Before Service ({images.length})</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <a key={img.id} href={`/api/jobcards/${id}/images/${img.id}`} target="_blank">
            <img loading="lazy" src={`/api/jobcards/${id}/images/${img.id}`} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-lg border object-cover" />
          </a>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-semibold">Amendments</h2>
      <p className="mb-2 text-sm text-neutral-500">Signed job cards cannot be edited. Record any correction here; it is kept with the card and never overwrites the signed PDF.</p>
      <form action={addAmendment} className="mb-4 space-y-2">
        <input type="hidden" name="id" value={id} />
        <textarea className="input" name="note" rows={3} required placeholder="Describe the correction" />
        <button className="btn-primary">Add amendment</button>
      </form>
      <ul className="space-y-2">
        {notes.map((n, i) => (
          <li key={i} className="card">
            <p className="whitespace-pre-wrap">{n.note}</p>
            <p className="mt-1 text-xs text-neutral-500">{n.by} · {fmt(n.createdAt)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
