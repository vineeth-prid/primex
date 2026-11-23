import { apiAuth } from "@/lib/auth";
import { getJobCard } from "@/lib/jobcards";
import { getObject } from "@/lib/storage";

// Serves the stored, signed PDF as-is — never regenerated on view/download.
export async function GET(req: Request, ctx: RouteContext<"/api/jobcards/[id]/pdf">) {
  const s = await apiAuth("staff", "admin");
  if (s instanceof Response) return s;
  const card = await getJobCard(Number((await ctx.params).id));
  if (!card) return new Response("Not found", { status: 404 });
  const v = new URL(req.url).searchParams.get("v");
  const final = v === "final" || (v !== "checkin" && !!card.finalPdfKey);
  const key = final ? card.finalPdfKey : card.checkinPdfKey;
  if (!key) return new Response("Not found", { status: 404 });
  const name = `${card.jobCardNumber}${final ? "" : "-checkin"}.pdf`;
  return new Response(new Uint8Array(await getObject(key)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${new URL(req.url).searchParams.has("download") ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
