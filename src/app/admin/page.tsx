import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { dashboardStats, listJobCards } from "@/lib/jobcards";

const SIZES = [20, 50, 100];
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", dateStyle: "medium", timeStyle: "short" });

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireRole("admin");
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const size = SIZES.includes(Number(get("size"))) ? Number(get("size")) : 20;
  const page = Math.max(1, Math.floor(Number(get("page")) || 1));
  const filters = { q: get("q"), from: get("from"), to: get("to"), month: get("month"), status: get("status") };

  const [stats, { rows, total }] = await Promise.all([dashboardStats(), listJobCards({ ...filters, page, size })]);
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => `?${new URLSearchParams({ ...filters, size: String(size), page: String(p) })}`;

  return (
    <main className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {([["Total Job Cards", stats.total], ["Today", stats.today], ["This Week", stats.week], ["This Month", stats.month]] as const).map(([l, v]) => (
          <div key={l} className="card">
            <p className="text-sm text-neutral-500">{l}</p>
            <p className="text-3xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <form className="mb-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <input className="input" name="q" defaultValue={filters.q} placeholder="Job card no, customer, mobile, plate or chassis" />
        <label className="block"><span className="sr-only">From</span><input className="input" type="date" name="from" defaultValue={filters.from} title="From date" /></label>
        <label className="block"><span className="sr-only">To</span><input className="input" type="date" name="to" defaultValue={filters.to} title="To date" /></label>
        <label className="block"><span className="sr-only">Month</span><input className="input" type="month" name="month" defaultValue={filters.month} title="Month" /></label>
        <select className="input" name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          <option value="checked_in">Checked in</option>
          <option value="delivered">Delivered</option>
        </select>
        <input type="hidden" name="size" value={size} />
        <div className="flex gap-2">
          <button className="btn-primary">Search</button>
          <Link className="btn-secondary" href="/admin">Reset</Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-300">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>{["Job Card No", "Date", "Customer Name", "Mobile No", "Plate No", "Car Model", "Staff", "Status", "Actions"].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2 font-medium">{r.jobCardNumber}</td>
                <td className="px-3 py-2 whitespace-nowrap">{fmt.format(r.createdAt)}</td>
                <td className="px-3 py-2">{r.customerName}</td>
                <td className="px-3 py-2">{r.mobile}</td>
                <td className="px-3 py-2">{r.plateNo}</td>
                <td className="px-3 py-2">{r.carModel}</td>
                <td className="px-3 py-2">{r.receivedBy}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "delivered" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {r.status === "delivered" ? "Delivered" : "Checked in"}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link className="mr-3 underline" href={`/admin/jobcards/${r.id}`}>View</Link>
                  <a className="underline" href={`/api/jobcards/${r.id}/pdf?download=1`}>PDF</a>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-neutral-500">No job cards found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>{total.toLocaleString()} record{total === 1 ? "" : "s"} · page {page} of {pages}</p>
        <div className="flex items-center gap-2">
          <span>Per page:</span>
          {SIZES.map((s) => (
            <Link key={s} href={`?${new URLSearchParams({ ...filters, size: String(s), page: "1" })}`}
              className={`rounded px-2 py-1 ${s === size ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>{s}</Link>
          ))}
          {page > 1 ? <Link className="btn-secondary min-h-10" href={href(page - 1)}>Previous</Link> : <span className="btn-secondary min-h-10 opacity-40">Previous</span>}
          {page < pages ? <Link className="btn-secondary min-h-10" href={href(page + 1)}>Next</Link> : <span className="btn-secondary min-h-10 opacity-40">Next</span>}
        </div>
      </div>
    </main>
  );
}
