import { apiAuth } from "@/lib/auth";
import { createJobCard, InputError, LIMITS, parseCheckin, signaturePng, toWebp } from "@/lib/jobcards";

export async function POST(req: Request) {
  const s = await apiAuth("staff", "admin");
  if (s instanceof Response) return s;
  try {
    const form = await req.formData();
    const data = parseCheckin(JSON.parse(String(form.get("data") ?? "{}")));
    const files = form.getAll("photos").filter((f): f is File => f instanceof File);
    if (files.length > LIMITS.photos) throw new InputError(`Maximum ${LIMITS.photos} photos`);
    const photos = [];
    for (const f of files) photos.push(await toWebp(f)); // sequential: keeps memory flat on a small VPS
    const signature = await signaturePng(form.get("signature") as File | null);
    return Response.json(await createJobCard(data, photos, signature, s.uid));
  } catch (e) {
    if (e instanceof InputError || e instanceof SyntaxError) return Response.json({ error: e.message }, { status: 400 });
    console.error("create job card failed", e);
    return Response.json({ error: "Could not save the job card. Please try again." }, { status: 500 });
  }
}
