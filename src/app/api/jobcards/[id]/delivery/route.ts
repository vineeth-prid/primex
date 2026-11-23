import { apiAuth } from "@/lib/auth";
import { deliverJobCard, InputError, signaturePng } from "@/lib/jobcards";

export async function POST(req: Request, ctx: RouteContext<"/api/jobcards/[id]/delivery">) {
  const s = await apiAuth("staff", "admin");
  if (s instanceof Response) return s;
  try {
    const id = Number((await ctx.params).id);
    const form = await req.formData();
    const signature = await signaturePng(form.get("signature") as File | null);
    const card = await deliverJobCard(id, {
      timeOut: form.get("timeOut"), deliveredBy: form.get("deliveredBy"), signedAt: form.get("signedAt"),
    }, signature);
    return Response.json({ id: card.id, jobCardNumber: card.jobCardNumber });
  } catch (e) {
    if (e instanceof InputError) return Response.json({ error: e.message }, { status: 400 });
    console.error("delivery failed", e);
    return Response.json({ error: "Could not save the delivery. Please try again." }, { status: 500 });
  }
}
