import { sql } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, pgTable, serial, smallint, text, timestamp, uuid,
} from "drizzle-orm/pg-core";

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: text({ enum: ["admin", "staff"] }).notNull(),
  createdAt: now(),
});

export const jobCardCounters = pgTable("job_card_counters", {
  year: integer().primaryKey(),
  last: integer().notNull(),
});

export type Mark = { x: number; y: number }; // 0..1 relative to the diagram image
export type Conditions = Record<string, boolean> & { other?: string };

export const jobCards = pgTable(
  "job_cards",
  {
    id: serial().primaryKey(),
    jobCardNumber: text().notNull().unique(),
    clientRef: uuid().notNull().unique(), // idempotency key from the tablet draft
    status: text({ enum: ["checked_in", "delivered"] }).notNull().default("checked_in"),

    // Front of card — left box
    customerName: text().notNull(),
    mobile: text().notNull(),
    plateNo: text().notNull(),
    carModel: text().notNull(),
    chassisNo: text(),
    address: text(),
    // Right box
    dateIn: date().notNull(),
    deliveryDate: date(), // expected delivery date promised at check-in
    timeIn: text().notNull(), // HH:MM as written on the card
    typeOfServices: text(),
    odometer: integer(),
    // Diagram / fuel / condition
    diagramMarks: jsonb().$type<Mark[]>().notNull().default([]),
    fuelLevel: smallint(), // 0..4 = E, ¼, ½, ¾, F
    conditions: jsonb().$type<Conditions>().notNull().default({}),
    advisorNotes: text(),
    workRequested: text(),
    specialInstructions: text(),

    // Box 1 — check-in & terms
    lang: text({ enum: ["en", "ar"] }).notNull(),
    termsAccepted: boolean().notNull(),
    termsAcceptMode: text({ enum: ["read", "quick"] }).notNull(),
    termsVersion: text().notNull(),
    termsAcceptedAt: timestamp({ withTimezone: true }).notNull(),
    customerRepName: text().notNull(),
    checkinSignatureKey: text().notNull(),
    checkinSignedAt: timestamp({ withTimezone: true }).notNull(),
    receivedBy: text().notNull(),
    checkinPdfKey: text().notNull(),
    checkinPdfSha256: text().notNull(),

    // Box 2 — delivery (set once, at check-out)
    timeOut: text(),
    deliveredBy: text(),
    deliverySignatureKey: text(),
    deliveredAt: timestamp({ withTimezone: true }),
    finalPdfKey: text(),
    finalPdfSha256: text(),

    createdBy: integer().notNull().references(() => users.id),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [
    index("job_cards_created_at_idx").on(t.createdAt),
    index("job_cards_name_trgm").using("gin", sql`${t.customerName} gin_trgm_ops`),
    index("job_cards_mobile_trgm").using("gin", sql`${t.mobile} gin_trgm_ops`),
    index("job_cards_plate_trgm").using("gin", sql`${t.plateNo} gin_trgm_ops`),
    index("job_cards_number_trgm").using("gin", sql`${t.jobCardNumber} gin_trgm_ops`),
    index("job_cards_chassis_trgm").using("gin", sql`${t.chassisNo} gin_trgm_ops`),
  ],
);

// Controlled corrections: signed data is never edited, corrections are appended here.
export const amendments = pgTable("amendments", {
  id: serial().primaryKey(),
  jobCardId: integer().notNull().references(() => jobCards.id),
  note: text().notNull(),
  createdBy: integer().notNull().references(() => users.id),
  createdAt: now(),
}, (t) => [index("amendments_card_idx").on(t.jobCardId)]);

// "before" = check-in photos (in the PDF); "amendment" = optional photos attached to an amendment.
export const jobCardImages = pgTable("job_card_images", {
  id: serial().primaryKey(),
  jobCardId: integer().notNull().references(() => jobCards.id),
  imageKey: text().notNull(),
  imageType: text({ enum: ["before", "amendment"] }).notNull().default("before"),
  amendmentId: integer().references(() => amendments.id),
  createdAt: now(),
}, (t) => [index("job_card_images_card_idx").on(t.jobCardId)]);

export type JobCard = typeof jobCards.$inferSelect;
