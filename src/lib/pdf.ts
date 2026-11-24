import "server-only";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { JobCard } from "@/db/schema";
import { CLAUSES, CONDITIONS, FUEL_LEVELS, SHOP, TEXT, type Lang } from "./terms";

const ROOT = process.cwd();
const LOGO = path.join(ROOT, "public/logo.png");
const DIAGRAM = path.join(ROOT, "public/car-diagram.png");
const DIAGRAM_RATIO = 702 / 1116;
const AR = path.join(ROOT, "assets/fonts/IBMPlexSansArabic-Regular.ttf");
const AR_BOLD = path.join(ROOT, "assets/fonts/IBMPlexSansArabic-Bold.ttf");

export type PdfInput = {
  card: Omit<JobCard, "checkinPdfKey" | "checkinPdfSha256" | "finalPdfKey" | "finalPdfSha256" | "id" | "createdAt" | "updatedAt" | "createdBy">;
  photos: Buffer[]; // JPEG/PNG
  checkinSignature: Buffer; // PNG
  deliverySignature?: Buffer; // PNG
};

const fmt = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", dateStyle: "medium", timeStyle: "short" }).format(d) : "";
const hasArabic = (s: string) => /[؀-ۿ]/.test(s);
const RTL = { features: ["rtla"] as PDFKit.Mixins.OpenTypeFeatures[] };

const M = 28; // page margin
const W = 595.28 - M * 2;
const PAGE_BOTTOM = 842 - M - 14; // room for footer

export function renderJobCardPdf(input: PdfInput): Promise<Buffer> {
  const { card } = input;
  const lang: Lang = card.lang;
  const doc = new PDFDocument({ size: "A4", margin: M, bufferPages: true, info: { Title: `Job Card ${card.jobCardNumber}` } });
  doc.registerFont("ar", AR);
  doc.registerFont("ar-b", AR_BOLD);
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));

  let y = M;
  const ensure = (h: number) => { if (y + h > PAGE_BOTTOM) { doc.addPage(); y = M; } };

  /** Label + underlined value on one line; Arabic values use the Arabic font. */
  const field = (x: number, yy: number, w: number, label: string, value: string) => {
    doc.font("Helvetica").fontSize(9).fill("#111").text(label, x, yy, { lineBreak: false });
    const lx = x + doc.widthOfString(label) + 4;
    const opts = { width: x + w - lx, height: 12, ellipsis: true, lineBreak: false };
    if (hasArabic(value)) doc.font("ar-b").fontSize(9).text(value, lx, yy - 3, { ...opts, ...RTL, align: "right" });
    else doc.font("Helvetica-Bold").text(value, lx, yy, opts);
    doc.moveTo(lx, yy + 11).lineTo(x + w, yy + 11).lineWidth(0.4).stroke("#999");
  };
  /** Multi-line free text (Latin or Arabic). Returns the y after the text; `dry` only measures. */
  const block = (t: string, x: number, yy: number, w: number, size: number, dry = false) => {
    if (hasArabic(t)) return rtl(doc, t, x, yy, w, size, { dry });
    doc.font("Helvetica").fontSize(size).fill("#111");
    if (dry) return yy + doc.heightOfString(t, { width: w });
    doc.text(t, x, yy, { width: w });
    return doc.y;
  };

  // ── Header ────────────────────────────────────────────────
  doc.image(LOGO, M, y, { width: 120 });
  doc.roundedRect(M + 185, y + 6, 160, 32, 6).fill("#111");
  doc.fill("#fff").font("Helvetica-Bold").fontSize(20).text("JOB CARD", M + 185, y + 13, { width: 160, align: "center" });
  doc.fill("#111").font("Helvetica").fontSize(9)
    .text(`Mob: ${SHOP.mobile}`, M + 370, y + 6, { width: W - 370, align: "right" })
    .text(SHOP.address, M + 370, y + 20, { width: W - 370, align: "right" });
  doc.font("Helvetica-Bold").fontSize(10).text(`No: ${card.jobCardNumber}`, M + 185, y + 44, { width: 160, align: "center" });
  y += 60;

  // ── Customer / visit boxes ────────────────────────────────
  const half = (W - 12) / 2;
  const left: [string, string][] = [
    ["Customer Name:", card.customerName], ["Mobile No:", card.mobile], ["Plate No:", card.plateNo],
    ["Car Model:", card.carModel], ["Chassis No:", card.chassisNo ?? ""], ["Address:", card.address ?? ""],
  ];
  const right: [string, string][] = [
    ["Date In:", card.dateIn], ["Delivery Date:", card.deliveryDate ?? ""], ["Time Car In:", card.timeIn],
    ["Time Car Out:", card.timeOut ?? ""], ["Type of Services:", card.typeOfServices ?? ""],
    ["Odometer Reading:", card.odometer?.toString() ?? ""],
  ];
  const boxH = 10 + left.length * 17;
  doc.roundedRect(M, y, half, boxH, 6).lineWidth(0.8).stroke("#333");
  doc.roundedRect(M + half + 12, y, half, boxH, 6).stroke("#333");
  left.forEach(([l, v], i) => field(M + 10, y + 9 + i * 17, half - 20, l, v));
  right.forEach(([l, v], i) => field(M + half + 22, y + 9 + i * 17, half - 20, l, v));
  y += boxH + 10;

  // ── Diagram + fuel + condition ────────────────────────────
  const dw = 285, dh = dw * DIAGRAM_RATIO;
  doc.image(DIAGRAM, M, y, { width: dw });
  for (const m of card.diagramMarks) {
    const cx = M + m.x * dw, cy = y + m.y * dh;
    doc.moveTo(cx - 5, cy).lineTo(cx - 1.5, cy + 4).lineTo(cx + 6, cy - 5).lineWidth(1.6).stroke("#d00");
  }
  // "Please mark (✓) …" — the tick is drawn because Helvetica has no ✓ glyph.
  const hy = y + dh + 4;
  doc.font("Helvetica").fontSize(8).fill("#111").text("Please mark (", M, hy, { lineBreak: false });
  const tx = M + doc.widthOfString("Please mark (");
  doc.moveTo(tx + 1, hy + 4).lineTo(tx + 3, hy + 6.5).lineTo(tx + 7, hy + 1).lineWidth(1).stroke("#111");
  doc.text(SHOP.diagramHint.replace(/^Please mark \(✓/, ""), tx + 8, hy, { width: dw - (tx + 8 - M) + 40 });

  const rx = M + dw + 24, rw = W - dw - 24;
  const gx = rx + rw / 2, gy = y + 44, r = 36;
  doc.lineWidth(2).strokeColor("#111");
  doc.path(`M ${gx - r} ${gy} A ${r} ${r} 0 0 1 ${gx + r} ${gy}`).stroke();
  FUEL_LEVELS.forEach((_, i) => {
    const a = Math.PI - (i * Math.PI) / 4;
    doc.moveTo(gx + Math.cos(a) * (r - 6), gy - Math.sin(a) * (r - 6)).lineTo(gx + Math.cos(a) * r, gy - Math.sin(a) * r).lineWidth(1).stroke();
  });
  doc.font("Helvetica").fontSize(7).fill("#111").text("E", gx - r - 9, gy - 4, { lineBreak: false }).text("F", gx + r + 4, gy - 4, { lineBreak: false });
  if (card.fuelLevel != null) {
    const a = Math.PI - (card.fuelLevel * Math.PI) / 4;
    doc.moveTo(gx, gy).lineTo(gx + Math.cos(a) * (r - 8), gy - Math.sin(a) * (r - 8)).lineWidth(2).stroke("#d00");
  }
  doc.circle(gx, gy, 3).fill("#111");
  doc.roundedRect(gx - 40, gy + 8, 80, 16, 4).lineWidth(0.8).stroke("#111");
  doc.font("Helvetica-Bold").fontSize(8).fill("#111")
    .text(`Fuel Level: ${card.fuelLevel != null ? FUEL_LEVELS[card.fuelLevel] : "—"}`, gx - 40, gy + 12, { width: 80, align: "center" });

  let cy = y + 72;
  doc.font("Helvetica-Bold").fontSize(9).text("VEHICLE CONDITION AT CHECK-IN", rx, cy);
  doc.font("Helvetica").fontSize(7.5).text("(Please tick if any)", rx, cy + 11);
  cy += 24;
  const conds = card.conditions;
  const items: [boolean, string][] = [...CONDITIONS.map(([k, l]) => [!!conds[k], l] as [boolean, string]), [!!conds.other, `Other: ${conds.other ?? ""}`]];
  items.forEach(([on, label], i) => {
    const iy = cy + i * 12;
    doc.rect(rx, iy, 8, 8).lineWidth(0.7).stroke("#111");
    if (on) doc.moveTo(rx + 1.5, iy + 4).lineTo(rx + 3.5, iy + 6.5).lineTo(rx + 7, iy + 1.5).lineWidth(1.2).stroke("#d00");
    const opts = { width: rw - 14, lineBreak: false, ellipsis: true };
    if (hasArabic(label)) doc.font("ar").fontSize(8).fill("#111").text(label, rx + 12, iy - 3, { ...opts, ...RTL });
    else doc.font("Helvetica").fontSize(8.5).fill("#111").text(label, rx + 12, iy, opts);
  });
  y = Math.max(hy + 14, cy + items.length * 12 + 4);

  // ── Notes ─────────────────────────────────────────────────
  for (const [title, val] of [
    ["ADDITIONAL COMMENTS / SPECIFIC CONDITION NOTES (Advisor):", card.advisorNotes],
    ["WORK TO BE DONE / SERVICES REQUESTED:", card.workRequested],
    ["SPECIAL INSTRUCTIONS / CUSTOMER REQUESTS:", card.specialInstructions],
  ] as const) {
    const text = val || " ";
    const h = Math.max(16, block(text, M, 0, W, 9, true) + 2);
    ensure(h + 18);
    doc.font("Helvetica-Bold").fontSize(9).fill("#111").text(title, M, y);
    y += 12;
    block(text, M, y, W, 9);
    doc.moveTo(M, y + h).lineTo(M + W, y + h).lineWidth(0.4).stroke("#999");
    y += h + 6;
  }

  // ── Acknowledgement boxes (height fits the longer text) ───
  const ackText = (t: string, x: number, yy: number, dry = false) =>
    lang === "ar" ? rtl(doc, t, x, yy, half - 16, 7.5, { dry }) : block(t, x, yy, half - 16, 7.5, dry);
  doc.font("Helvetica").fontSize(7.5);
  const textH = Math.max(ackText(TEXT.checkinText[lang], 0, 0, true), ackText(TEXT.deliveryText[lang], 0, 0, true));
  const rowsMax = 3;
  const bh = 28 + textH + 4 + 38 + rowsMax * 14 + 6;
  ensure(bh + 50);
  const ack = (x: number, n: string, title: string, body: string, rows: [string, string][], sig?: Buffer) => {
    doc.roundedRect(x, y, half, bh, 6).lineWidth(0.8).stroke("#333");
    doc.rect(x + 8, y + 8, 14, 14).fill("#111");
    doc.fill("#fff").font("Helvetica-Bold").fontSize(9).text(n, x + 8, y + 11, { width: 14, align: "center" });
    doc.fill("#111").fontSize(8.5).text(title, x + 28, y + 11, { width: half - 36 });
    ackText(body, x + 8, y + 28);
    const sy = y + 28 + textH + 4;
    doc.font("Helvetica").fontSize(8.5).fill("#111").text("Customer Signature:", x + 8, sy + 26, { lineBreak: false });
    if (sig) doc.image(sig, x + 95, sy, { fit: [half - 105, 36] });
    doc.moveTo(x + 95, sy + 36).lineTo(x + half - 8, sy + 36).lineWidth(0.4).stroke("#999");
    rows.forEach(([l, v], i) => field(x + 8, sy + 42 + i * 14, half - 16, l, v));
  };
  ack(M, "1", TEXT.checkinTitle.en, TEXT.checkinText[lang], [
    [`${TEXT.repName.en}:`, card.customerRepName],
    ["Date & Time:", fmt(card.checkinSignedAt)],
    ["Received By:", card.receivedBy],
  ], input.checkinSignature);
  ack(M + half + 12, "2", TEXT.deliveryTitle.en, TEXT.deliveryText[lang], [
    ["Date & Time:", fmt(card.deliveredAt)],
    ["Delivered By:", card.deliveredBy ?? ""],
  ], input.deliverySignature);
  y += bh + 6;
  doc.font("Helvetica-Bold").fontSize(8).fill("#111").text("Check-In Section:", M + 8, y).text("Check-Out Section:", M + half + 20, y);
  y += 11;
  field(M + 8, y, half - 16, "Date and time of check-in:", fmt(card.checkinSignedAt));
  field(M + half + 20, y, half - 16, "Date and time of check-out:", fmt(card.deliveredAt));
  y += 16;
  doc.font("Helvetica").fontSize(7).fill("#555")
    .text(`Terms version ${card.termsVersion} · accepted ${fmt(card.termsAcceptedAt)} (${card.termsAcceptMode === "read" ? "read & agreed" : "agreed"}) · language ${lang.toUpperCase()}`, M, y, { width: W });
  y += 11;
  ensure(44);
  doc.roundedRect(M, y, W, 26, 4).fill("#111");
  doc.fill("#fff").font("Helvetica-Bold").fontSize(8).text(SHOP.important, M + 10, y + 5, { width: W - 20, align: "center" });
  y += 30;
  doc.fill("#111").font("Helvetica-Bold").fontSize(9).text(SHOP.thanks, M, y, { width: W, align: "center" });

  // ── Vehicle photos ────────────────────────────────────────
  if (input.photos.length) {
    doc.addPage(); y = M;
    doc.font("Helvetica-Bold").fontSize(12).fill("#111").text("VEHICLE IMAGES — BEFORE SERVICE", M, y);
    y += 20;
    const cw = (W - 10) / 2, ch = cw * 0.75;
    input.photos.forEach((img, i) => {
      if (i % 2 === 0) ensure(ch + 18);
      const x = M + (i % 2) * (cw + 10);
      doc.rect(x, y, cw, ch).lineWidth(0.4).stroke("#ccc");
      doc.image(img, x, y, { fit: [cw, ch], align: "center", valign: "center" });
      doc.font("Helvetica").fontSize(7.5).fill("#555").text(`Photo ${i + 1}`, x, y + ch + 2);
      if (i % 2 === 1 || i === input.photos.length - 1) y += ch + 16;
    });
  }

  // ── Terms & Conditions ────────────────────────────────────
  doc.addPage(); y = M;
  const isAr = lang === "ar";
  const heading = (t: string, size: number) => {
    if (isAr) y = rtl(doc, t, M, y, W, size, { font: "ar-b", align: "center" });
    else { doc.font("Helvetica-Bold").fontSize(size).fill("#111").text(t, M, y, { width: W, align: "center" }); y = doc.y; }
    y += 4;
  };
  const para = (t: string) => {
    if (isAr) y = rtl(doc, t, M, y, W, 8.5);
    else { doc.font("Helvetica").fontSize(8.5).fill("#111").text(t, M, y, { width: W, align: "justify" }); y = doc.y; }
    y += 5;
  };
  const paraH = (t: string) => isAr ? rtl(doc, t, M, 0, W, 8.5, { dry: true }) : (doc.font("Helvetica").fontSize(8.5), doc.heightOfString(t, { width: W }));
  heading(TEXT.termsImportant[lang], 9);
  heading(TEXT.termsTitle[lang], 11);
  para(TEXT.termsIntro[lang]);
  CLAUSES.forEach((c, i) => {
    const [title, body] = c[lang];
    ensure(16 + paraH(body));
    if (isAr) y = rtl(doc, `${i + 1}. ${title}`, M, y, W, 9, { font: "ar-b", color: "#b00" });
    else { doc.font("Helvetica-Bold").fontSize(9).fill("#b00").text(`${i + 1}. ${title}`, M, y); y = doc.y; }
    y += 1;
    para(body);
  });
  ensure(30);
  heading(TEXT.termsFooter[lang], 9);

  // Footer on every page (bottom margin lifted so pdfkit doesn't auto-add a page).
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.font("Helvetica").fontSize(7).fill("#777")
      .text(`${SHOP.name} · Job Card ${card.jobCardNumber} · Page ${i + 1} of ${range.count}`, M, 842 - M - 6, { width: W, align: "center", lineBreak: false });
  }
  doc.end();
  return done;
}

/**
 * pdfkit lays wrapped words out left-to-right, which breaks Arabic word order.
 * We wrap in logical order ourselves and render each line as one run, which fontkit
 * shapes and reverses as RTL. Digit runs (and brackets) are pre-flipped so they read correctly.
 * Returns the y after the last line; with `dry` it only measures.
 */
function rtl(
  doc: PDFKit.PDFDocument, text: string, x: number, y: number, w: number, size: number,
  o: { font?: string; align?: "right" | "center"; color?: string; dry?: boolean } = {},
) {
  const prep = (s: string) =>
    s.replace(/[0-9]+/g, (d) => [...d].reverse().join("")).replace(/[()]/g, (b) => (b === "(" ? ")" : "("));
  doc.font(o.font ?? "ar").fontSize(size).fill(o.color ?? "#111");
  const lh = size * 1.55;
  let n = 0;
  for (const para of text.split("\n")) {
    let line = "";
    const flush = () => {
      if (!o.dry) doc.text(prep(line), x, y + n * lh, { ...RTL, width: w, align: o.align ?? "right", lineBreak: false });
      n++;
    };
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${word}` : word;
      if (line && doc.widthOfString(t, RTL) > w) { flush(); line = word; } else line = t;
    }
    flush();
  }
  return y + n * lh;
}
