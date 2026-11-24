import { apiAuth } from "@/lib/auth";
import { createAmendment, InputError, toWebp } from "@/lib/jobcards";

const MAX_PHOTOS = 10;

export async function POST(req: Request, ctx: RouteContext<"/api/jobcards/[id]/amendments">) {
  const s = await apiAuth("admin");
  if (s instanceof Response) return s;
  try {
    const id = Number((await ctx.params).id);
    const form = await req.formData();
    const note = String(form.get("note") ?? "").trim();
    if (!note) throw new InputError("Describe the correction");
    if (note.length > 4000) throw new InputError("Amendment note is too long");
    const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_PHOTOS) throw new InputError(`Maximum ${MAX_PHOTOS} photos per amendment`);
    const photos = [];
    for (const f of files) photos.push(await toWebp(f));
    return Response.json(await createAmendment(id, note, photos, s.uid));
  } catch (e) {
    if (e instanceof InputError) return Response.json({ error: e.message }, { status: 400 });
    console.error("amendment failed", e);
    return Response.json({ error: "Could not save the amendment. Please try again." }, { status: 500 });
  }
}
