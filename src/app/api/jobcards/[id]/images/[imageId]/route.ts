import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobCardImages } from "@/db/schema";
import { apiAuth } from "@/lib/auth";
import { getObject } from "@/lib/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobcards/[id]/images/[imageId]">) {
  const s = await apiAuth("admin");
  if (s instanceof Response) return s;
  const { id, imageId } = await ctx.params;
  const [img] = await db.select().from(jobCardImages)
    .where(and(eq(jobCardImages.id, Number(imageId)), eq(jobCardImages.jobCardId, Number(id))));
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(await getObject(img.imageKey)), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=86400, immutable" },
  });
}
