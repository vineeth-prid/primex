import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listJobCards } from "@/lib/jobcards";

export default async function DeliverySearch({ searchParams }: PageProps<"/staff/delivery">) {
  await requireRole("staff", "admin");
  const q = String((await searchParams).q ?? "").trim();
  const { rows } = await listJobCards({ q, status: "checked_in", page: 1, size: 20 });
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Vehicle Delivery</h1>
      <form className="mb-4 flex gap-2">
        <input className="input" name="q" defaultValue={q} placeholder="Plate No, Chassis No, Job Card No, mobile or name" autoFocus />
        <button className="btn-primary">Search</button>
      </form>
      <p className="mb-2 text-sm text-neutral-500">Vehicles checked in, not yet delivered{q ? ` matching “${q}”` : " (latest 20)"}:</p>
      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-300">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/staff/delivery/${r.id}`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50">
              <span>
                <span className="block font-semibold">{r.plateNo} · {r.carModel}</span>
                <span className="block text-sm text-neutral-500">
                  {r.jobCardNumber} · {r.customerName} · {r.mobile}{r.deliveryDate && <> · <strong>Due {r.deliveryDate}</strong></>}
                </span>
              </span>
              <span aria-hidden>›</span>
            </Link>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-neutral-500">No vehicles awaiting delivery.</li>}
      </ul>
    </main>
  );
}
