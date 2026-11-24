// End-to-end check against a running app: node scripts/smoke-test.mjs http://localhost:3000
// Needs SESSION_SECRET + DATABASE_URL (same as the app). Creates real job cards — use on dev/staging only.
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import postgres from "postgres";
import sharp from "sharp";

const BASE = process.argv[2] ?? "http://localhost:3000";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const users = Object.fromEntries((await sql`select id, role, name from users`).map((u) => [u.role, u]));

const cookieFor = (role) => {
  const u = users[role];
  const data = Buffer.from(JSON.stringify({ uid: u.id, role, name: u.name, exp: Date.now() / 1000 + 600 })).toString("base64url");
  return `jc_session=${data}.${createHmac("sha256", process.env.SESSION_SECRET).update(data).digest("base64url")}`;
};
const call = (path, role, init = {}) =>
  fetch(BASE + path, { ...init, headers: role ? { cookie: cookieFor(role) } : {} });

const img = (color) => sharp({ create: { width: 1600, height: 1200, channels: 3, background: color } }).jpeg().toBuffer();
const sigPng = await sharp({ create: { width: 400, height: 150, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from('<svg width="400" height="150"><path d="M20 100 C 80 20, 140 140, 200 60 S 320 120, 380 40" stroke="#0a2a8a" stroke-width="4" fill="none"/></svg>') }])
  .png().toBuffer();

function checkinForm(over = {}, lang = "en") {
  const fd = new FormData();
  fd.set("data", JSON.stringify({
    clientRef: randomUUID(), customerName: lang === "ar" ? "محمد الكعبي" : "Test Customer", mobile: "5555 1234",
    plateNo: "123456", carModel: "Toyota Land Cruiser", chassisNo: "jtmhv05j704123456", address: "Doha",
    dateIn: "2026-11-23", deliveryDate: "2026-11-26", timeIn: "09:30",
    typeOfServices: "PPF Full Body", odometer: "45210", diagramMarks: [{ x: 0.5, y: 0.2 }, { x: 0.3, y: 0.55 }],
    fuelLevel: 2, conditions: { scratches: true, dents: true, other: "Faded headlight" },
    advisorNotes: "Swirl marks on bonnet.", workRequested: "Full PPF, ceramic coating on wheels.",
    specialInstructions: "Call before delivery.", lang, termsAcceptMode: "read", termsAcceptedAt: new Date().toISOString(),
    customerRepName: "Test Customer", receivedBy: "Ahmed", signedAt: new Date().toISOString(), ...over,
  }));
  return fd;
}
const withFiles = async (fd, n = 2) => {
  for (let i = 0; i < n; i++) fd.append("photos", new Blob([await img(i ? "#2a6" : "#c33")], { type: "image/jpeg" }), `p${i}.jpg`);
  fd.set("signature", new Blob([sigPng], { type: "image/png" }), "sig.png");
  return fd;
};

// health + auth
assert.equal((await call("/api/health")).status, 200);
assert.equal((await call("/api/jobcards", null, { method: "POST", body: new FormData() })).status, 401);

// create
const fd = await withFiles(checkinForm());
let r = await call("/api/jobcards", "staff", { method: "POST", body: fd });
const created = await r.json();
assert.equal(r.status, 200, JSON.stringify(created));
assert.match(created.jobCardNumber, /^PMX-\d{4}-\d{5}$/);

// duplicate submit (same clientRef) returns the same card
r = await call("/api/jobcards", "staff", { method: "POST", body: fd });
assert.equal((await r.json()).id, created.id);

// validation: terms not accepted, missing signature, fake image
r = await call("/api/jobcards", "staff", { method: "POST", body: await withFiles(checkinForm({ termsAcceptMode: null })) });
assert.equal(r.status, 400);
const noSig = checkinForm();
r = await call("/api/jobcards", "staff", { method: "POST", body: noSig });
assert.equal(r.status, 400);
const fake = checkinForm();
fake.append("photos", new Blob(["not an image"], { type: "image/jpeg" }), "x.jpg");
fake.set("signature", new Blob([sigPng], { type: "image/png" }), "sig.png");
assert.equal((await call("/api/jobcards", "staff", { method: "POST", body: fake })).status, 400);

// new fields: stored (chassis upper-cased), delivery date validated, chassis searchable
const [saved] = await sql`select chassis_no, delivery_date::text d from job_cards where id = ${created.id}`;
assert.equal(saved.chassis_no, "JTMHV05J704123456");
assert.equal(saved.d, "2026-11-26");
r = await call("/api/jobcards", "staff", { method: "POST", body: await withFiles(checkinForm({ deliveryDate: "2026-11-01" }), 0) });
assert.equal(r.status, 400);
assert.match((await r.json()).error, /Delivery Date/);
assert.match(await (await call("/admin?q=JTMHV05J704", "admin")).text(), new RegExp(created.jobCardNumber));

// PDF
r = await call(`/api/jobcards/${created.id}/pdf`, "staff");
assert.equal(r.headers.get("content-type"), "application/pdf");
const pdf1 = Buffer.from(await r.arrayBuffer());
assert.equal(pdf1.subarray(0, 4).toString(), "%PDF");
assert.equal((await call(`/api/jobcards/${created.id}/pdf`)).status, 401);

// images: admin only
const [image] = await sql`select id from job_card_images where job_card_id = ${created.id} order by id limit 1`;
assert.equal((await call(`/api/jobcards/${created.id}/images/${image.id}`, "staff")).status, 403);
r = await call(`/api/jobcards/${created.id}/images/${image.id}`, "admin");
assert.equal(r.headers.get("content-type"), "image/webp");

// delivery (idempotent), final PDF differs, check-in PDF unchanged
const dfd = () => { const f = new FormData(); f.set("timeOut", "17:45"); f.set("deliveredBy", "Ahmed"); f.set("signedAt", new Date().toISOString()); f.set("signature", new Blob([sigPng], { type: "image/png" }), "s.png"); return f; };
assert.equal((await call(`/api/jobcards/${created.id}/delivery`, "staff", { method: "POST", body: dfd() })).status, 200);
assert.equal((await call(`/api/jobcards/${created.id}/delivery`, "staff", { method: "POST", body: dfd() })).status, 200);
const finalPdf = Buffer.from(await (await call(`/api/jobcards/${created.id}/pdf?v=final`, "admin")).arrayBuffer());
const checkinAgain = Buffer.from(await (await call(`/api/jobcards/${created.id}/pdf?v=checkin`, "admin")).arrayBuffer());
assert.ok(!finalPdf.equals(pdf1));
assert.ok(checkinAgain.equals(pdf1), "signed check-in PDF must never change");

// amendments: admin only, note required, photos optional; never touch the signed PDFs
const amend = async (role, note, n) => {
  const f = new FormData(); f.set("note", note);
  for (let i = 0; i < n; i++) f.append("photos", new Blob([await img(i ? "#55a" : "#a55")], { type: "image/jpeg" }), `a${i}.jpg`);
  return call(`/api/jobcards/${created.id}/amendments`, role, { method: "POST", body: f });
};
assert.equal((await amend("staff", "x", 0)).status, 403);
assert.equal((await amend("admin", "  ", 0)).status, 400);
assert.equal((await amend("admin", "Odometer typo: should read 45,120", 0)).status, 200);
r = await amend("admin", "Scratch on rear bumper found after wash", 2);
const a2 = await r.json();
assert.equal(r.status, 200, JSON.stringify(a2));
const aImgs = await sql`select id, image_key from job_card_images where amendment_id = ${a2.id} order by id`;
assert.equal(aImgs.length, 2);
assert.match(aImgs[0].image_key, /\/amendments\//);
assert.equal((await call(`/api/jobcards/${created.id}/images/${aImgs[0].id}`, "admin")).headers.get("content-type"), "image/webp");
assert.equal((await call(`/api/jobcards/${created.id}/images/${aImgs[0].id}`, "staff")).status, 403);
const fake2 = new FormData(); fake2.set("note", "bad photo"); fake2.append("photos", new Blob(["nope"], { type: "image/jpeg" }), "x.jpg");
assert.equal((await call(`/api/jobcards/${created.id}/amendments`, "admin", { method: "POST", body: fake2 })).status, 400);
const page = await (await call(`/admin/jobcards/${created.id}`, "admin")).text();
assert.match(page, /Scratch on rear bumper/);
assert.match(page, /Amendment photo 2/);
assert.match(page, /JTMHV05J704123456/);
const checkinAfter = Buffer.from(await (await call(`/api/jobcards/${created.id}/pdf?v=checkin`, "admin")).arrayBuffer());
assert.ok(checkinAfter.equals(pdf1), "amendments must not change the signed PDF");
await assert.rejects(sql`delete from job_card_images where id = ${aImgs[0].id}`, /append-only/);

// DB-level immutability
await assert.rejects(sql`update job_cards set customer_name = 'X' where id = ${created.id}`, /immutable/);
await assert.rejects(sql`delete from job_cards where id = ${created.id}`, /cannot be deleted/);

// Arabic card
r = await call("/api/jobcards", "staff", { method: "POST", body: await withFiles(checkinForm({ termsAcceptMode: "quick" }, "ar"), 1) });
const ar = await r.json();
assert.equal(r.status, 200, JSON.stringify(ar));

// admin dashboard is admin-only
assert.equal((await call("/admin", "staff", { redirect: "manual" })).status, 307);
assert.equal((await call("/admin?q=Test", "admin")).status, 200);

await sql.end();
console.log(`OK — created ${created.jobCardNumber} (id ${created.id}) and ${ar.jobCardNumber} (id ${ar.id})`);
