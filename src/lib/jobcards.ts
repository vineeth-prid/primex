import "server-only";
import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { amendments, jobCardCounters, jobCardImages, jobCards, type Conditions, type JobCard, type Mark } from "@/db/schema";
import { renderJobCardPdf } from "./pdf";
import { deleteObjects, getObject, putObject } from "./storage";
import { CONDITIONS, TERMS_VERSION } from "./terms";

export const LIMITS = { photos: 30, photoBytes: 15 * 1024 * 1024, signatureBytes: 1024 * 1024 };
const TZ = "Asia/Qatar";

export class InputError extends Error {}

// ── Validation ───────────────────────────────────────────────
const str = (v: unknown, max: number, label: string, required = false) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new InputError(`${label} is required`);
  if (s.length > max) throw new InputError(`${label} is too long`);
  return s || null;
};
const req = (v: unknown, max: number, label: string) => str(v, max, label, true)!;

/** Client timestamps are kept if plausible (tablet clock), otherwise server time is used. */
const when = (v: unknown) => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  const now = Date.now();
  return Number.isFinite(t) && t <= now + 5 * 60_000 && t >= now - 24 * 3600_000 ? new Date(t) : new Date(now);
};

export function parseCheckin(raw: Record<string, unknown>) {
  const mobile = req(raw.mobile, 20, "Mobile No").replace(/[\s-]/g, "");
  if (!/^\+?\d{7,15}$/.test(mobile)) throw new InputError("Mobile No must be 7–15 digits");
  const dateIn = req(raw.dateIn, 10, "Date In");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIn)) throw new InputError("Date In is invalid");
  const timeIn = req(raw.timeIn, 5, "Time Car In");
  if (!/^\d{2}:\d{2}$/.test(timeIn)) throw new InputError("Time Car In is invalid");
  const deliveryDate = str(raw.deliveryDate, 10, "Delivery Date");
  if (deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) throw new InputError("Delivery Date is invalid");
  if (deliveryDate && deliveryDate < dateIn) throw new InputError("Delivery Date cannot be before Date In");
  const odo = raw.odometer === "" || raw.odometer == null ? null : Number(raw.odometer);
  if (odo != null && (!Number.isInteger(odo) || odo < 0 || odo > 9_999_999)) throw new InputError("Odometer Reading is invalid");
  const fuel = raw.fuelLevel == null ? null : Number(raw.fuelLevel);
  if (fuel != null && ![0, 1, 2, 3, 4].includes(fuel)) throw new InputError("Fuel Level is invalid");
  if (raw.lang !== "en" && raw.lang !== "ar") throw new InputError("Language is invalid");
  if (raw.termsAcceptMode !== "read" && raw.termsAcceptMode !== "quick") {
    throw new InputError("Customer must accept the Terms and Conditions");
  }
  const clientRef = String(raw.clientRef ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(clientRef)) throw new InputError("Invalid draft reference");

  const marks = Array.isArray(raw.diagramMarks) ? raw.diagramMarks.slice(0, 200) : [];
  const diagramMarks: Mark[] = marks
    .map((m: { x?: unknown; y?: unknown }) => ({ x: Number(m?.x), y: Number(m?.y) }))
    .filter((m) => m.x >= 0 && m.x <= 1 && m.y >= 0 && m.y <= 1);

  const rc = (raw.conditions ?? {}) as Record<string, unknown>;
  const conditions: Conditions = {};
  for (const [k] of CONDITIONS) conditions[k] = rc[k] === true;
  const other = str(rc.other, 200, "Other condition");
  if (other) conditions.other = other;

  return {
    clientRef,
    customerName: req(raw.customerName, 120, "Customer Name"),
    mobile,
    plateNo: req(raw.plateNo, 20, "Plate No").toUpperCase(),
    carModel: req(raw.carModel, 80, "Car Model"),
    chassisNo: str(raw.chassisNo, 40, "Chassis No")?.toUpperCase() ?? null,
    address: str(raw.address, 300, "Address"),
    dateIn,
    timeIn,
    deliveryDate,
    typeOfServices: str(raw.typeOfServices, 300, "Type of Services"),
    odometer: odo,
    diagramMarks,
    fuelLevel: fuel,
    conditions,
    advisorNotes: str(raw.advisorNotes, 4000, "Additional Comments"),
    workRequested: str(raw.workRequested, 4000, "Work To Be Done"),
    specialInstructions: str(raw.specialInstructions, 4000, "Special Instructions"),
    lang: raw.lang as "en" | "ar",
    termsAccepted: true,
    termsAcceptMode: raw.termsAcceptMode as "read" | "quick",
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: when(raw.termsAcceptedAt),
    customerRepName: req(raw.customerRepName, 120, "Customer / Authorized Representative"),
    checkinSignedAt: when(raw.signedAt),
    receivedBy: req(raw.receivedBy, 120, "Received By"),
  };
}

// ── Files ────────────────────────────────────────────────────
/** Decodes (rejecting non-images), strips metadata, normalises orientation, stores as WebP. */
export async function toWebp(file: File) {
  if (file.size > LIMITS.photoBytes) throw new InputError(`Photo "${file.name}" is larger than 15 MB`);
  try {
    return await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50e6 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new InputError(`"${file.name}" is not a valid image`);
  }
}

export async function signaturePng(file: File | null) {
  if (!file || file.size === 0) throw new InputError("Customer signature is required");
  if (file.size > LIMITS.signatureBytes) throw new InputError("Signature image too large");
  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata().catch(() => null);
  if (meta?.format !== "png") throw new InputError("Signature must be a PNG");
  // Crop the empty canvas margin so the signature fills the signature line in the PDF.
  return sharp(buf).trim().png().toBuffer().catch(() => buf);
}

const forPdf = (webp: Buffer) =>
  sharp(webp).resize({ width: 1200, height: 1200, fit: "inside" }).jpeg({ quality: 75 }).toBuffer();
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

// ── Create (check-in) ────────────────────────────────────────
export async function createJobCard(
  data: ReturnType<typeof parseCheckin>, photos: Buffer[], signature: Buffer, userId: number,
): Promise<{ id: number; jobCardNumber: string }> {
  const existing = await findByClientRef(data.clientRef);
  if (existing) return existing; // duplicate submit (retry / double tap)

  const uploaded: string[] = [];
  const put = async (key: string, body: Buffer, type: string) => { await putObject(key, body, type); uploaded.push(key); };
  try {
    return await db.transaction(async (tx) => {
      const year = Number(new Intl.DateTimeFormat("en", { timeZone: TZ, year: "numeric" }).format(new Date()));
      const [{ last }] = await tx.insert(jobCardCounters).values({ year, last: 1 })
        .onConflictDoUpdate({ target: jobCardCounters.year, set: { last: sql`${jobCardCounters.last} + 1` } })
        .returning({ last: jobCardCounters.last });
      const jobCardNumber = `PMX-${year}-${String(last).padStart(5, "0")}`;
      const dir = `job-card-${jobCardNumber}`;

      const imageKeys = photos.map((_, i) => `${dir}/vehicle-images/${String(i + 1).padStart(2, "0")}.webp`);
      const sigKey = `${dir}/signatures/checkin.png`;
      await Promise.all([...photos.map((p, i) => put(imageKeys[i], p, "image/webp")), put(sigKey, signature, "image/png")]);

      const card = {
        ...data, jobCardNumber, status: "checked_in" as const, checkinSignatureKey: sigKey,
        timeOut: null, deliveredBy: null, deliverySignatureKey: null, deliveredAt: null,
      };
      const pdf = await renderJobCardPdf({ card, photos: await Promise.all(photos.map(forPdf)), checkinSignature: signature });
      const pdfKey = `${dir}/documents/checkin.pdf`;
      await put(pdfKey, pdf, "application/pdf");

      const [row] = await tx.insert(jobCards)
        .values({ ...card, checkinPdfKey: pdfKey, checkinPdfSha256: sha256(pdf), createdBy: userId })
        .returning({ id: jobCards.id, jobCardNumber: jobCards.jobCardNumber });
      if (imageKeys.length) await tx.insert(jobCardImages).values(imageKeys.map((imageKey) => ({ jobCardId: row.id, imageKey })));
      return row;
    });
  } catch (e) {
    await deleteObjects(uploaded).catch(() => {}); // no orphaned uploads on failure
    const again = await findByClientRef(data.clientRef);
    if (again) return again; // lost a race with a concurrent duplicate submit
    throw e;
  }
}

async function findByClientRef(clientRef: string) {
  const [r] = await db.select({ id: jobCards.id, jobCardNumber: jobCards.jobCardNumber })
    .from(jobCards).where(eq(jobCards.clientRef, clientRef));
  return r;
}

// ── Delivery (check-out) ─────────────────────────────────────
export async function deliverJobCard(
  id: number, input: { timeOut: unknown; deliveredBy: unknown; signedAt: unknown }, signature: Buffer,
) {
  const timeOut = req(input.timeOut, 5, "Time Car Out");
  if (!/^\d{2}:\d{2}$/.test(timeOut)) throw new InputError("Time Car Out is invalid");
  const deliveredBy = req(input.deliveredBy, 120, "Delivered By");

  const card = await getJobCard(id);
  if (!card) throw new InputError("Job card not found");
  if (card.deliveredAt) return card; // already delivered — idempotent

  const dir = `job-card-${card.jobCardNumber}`;
  // Timestamped keys: a concurrent second delivery attempt can never overwrite the winning files.
  const stamp = Date.now();
  const sigKey = `${dir}/signatures/delivery-${stamp}.png`;
  const pdfKey = `${dir}/documents/final-${stamp}.pdf`;
  const deliveredAt = when(input.signedAt);
  const images = await getImages(id);
  const [checkinSig, ...photos] = await Promise.all([
    getObject(card.checkinSignatureKey),
    ...images.map((i) => getObject(i.imageKey).then(forPdf)),
  ]);
  const updated = { ...card, timeOut, deliveredBy, deliveredAt, status: "delivered" as const };
  const pdf = await renderJobCardPdf({ card: updated, photos, checkinSignature: checkinSig, deliverySignature: signature });

  await putObject(sigKey, signature, "image/png");
  await putObject(pdfKey, pdf, "application/pdf");
  const res = await db.update(jobCards)
    .set({ timeOut, deliveredBy, deliveredAt, status: "delivered", deliverySignatureKey: sigKey,
      finalPdfKey: pdfKey, finalPdfSha256: sha256(pdf), updatedAt: new Date() })
    .where(and(eq(jobCards.id, id), sql`${jobCards.deliveredAt} is null`))
    .returning({ id: jobCards.id });
  if (!res.length) throw new InputError("Job card was already delivered");
  return { ...updated, finalPdfKey: pdfKey };
}

// ── Queries ──────────────────────────────────────────────────
export async function getJobCard(id: number): Promise<JobCard | undefined> {
  const [r] = await db.select().from(jobCards).where(eq(jobCards.id, id));
  return r;
}

/** Check-in ("before") photos only — these are the ones in the signed PDFs. */
export const getImages = (id: number) =>
  db.select().from(jobCardImages)
    .where(and(eq(jobCardImages.jobCardId, id), eq(jobCardImages.imageType, "before")))
    .orderBy(jobCardImages.id);

// ── Amendments (append-only; photos optional) ────────────────
export async function createAmendment(jobCardId: number, note: string, photos: Buffer[], userId: number) {
  const card = await getJobCard(jobCardId);
  if (!card) throw new InputError("Job card not found");
  const uploaded: string[] = [];
  try {
    return await db.transaction(async (tx) => {
      const [a] = await tx.insert(amendments).values({ jobCardId, note, createdBy: userId }).returning({ id: amendments.id });
      const keys = photos.map((_, i) => `job-card-${card.jobCardNumber}/amendments/${a.id}-${String(i + 1).padStart(2, "0")}.webp`);
      for (let i = 0; i < photos.length; i++) { await putObject(keys[i], photos[i], "image/webp"); uploaded.push(keys[i]); }
      if (keys.length) {
        await tx.insert(jobCardImages).values(keys.map((imageKey) => ({ jobCardId, imageKey, imageType: "amendment" as const, amendmentId: a.id })));
      }
      return a;
    });
  } catch (e) {
    await deleteObjects(uploaded).catch(() => {}); // no orphaned uploads on failure
    throw e;
  }
}

const local = (d: string) => sql`(${d}::date)::timestamp at time zone ${TZ}`;

export type ListFilters = { q?: string; from?: string; to?: string; month?: string; status?: string; page: number; size: number };

export async function listJobCards(f: ListFilters) {
  const where: SQL[] = [];
  if (f.q) {
    const p = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(jobCards.jobCardNumber, p), ilike(jobCards.customerName, p), ilike(jobCards.mobile, p),
      ilike(jobCards.plateNo, p), ilike(jobCards.chassisNo, p))!);
  }
  const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isDate(f.from)) where.push(gte(jobCards.createdAt, local(f.from!)));
  if (isDate(f.to)) where.push(lt(jobCards.createdAt, sql`${local(f.to!)} + interval '1 day'`));
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    const start = `${f.month}-01`;
    where.push(gte(jobCards.createdAt, local(start)), lt(jobCards.createdAt, sql`${local(start)} + interval '1 month'`));
  }
  if (f.status === "checked_in" || f.status === "delivered") where.push(eq(jobCards.status, f.status));
  const w = where.length ? and(...where) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: jobCards.id, jobCardNumber: jobCards.jobCardNumber, createdAt: jobCards.createdAt,
      customerName: jobCards.customerName, mobile: jobCards.mobile, plateNo: jobCards.plateNo,
      carModel: jobCards.carModel, receivedBy: jobCards.receivedBy, status: jobCards.status,
      deliveryDate: jobCards.deliveryDate,
    }).from(jobCards).where(w).orderBy(desc(jobCards.createdAt)).limit(f.size).offset((f.page - 1) * f.size),
    db.select({ total: count() }).from(jobCards).where(w),
  ]);
  return { rows, total };
}

export async function dashboardStats() {
  // Week starts Sunday (Qatar working week).
  const today = sql`date_trunc('day', now() at time zone ${TZ})`;
  const [r] = await db.select({
    total: count(),
    today: sql<number>`count(*) filter (where ${jobCards.createdAt} >= ${today} at time zone ${TZ})`.mapWith(Number),
    week: sql<number>`count(*) filter (where ${jobCards.createdAt} >= (${today} - extract(dow from ${today}) * interval '1 day') at time zone ${TZ})`.mapWith(Number),
    month: sql<number>`count(*) filter (where ${jobCards.createdAt} >= date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ})`.mapWith(Number),
  }).from(jobCards);
  return r;
}
