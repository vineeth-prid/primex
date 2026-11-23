CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "amendments" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_card_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_card_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_card_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_card_id" integer NOT NULL,
	"image_key" text NOT NULL,
	"image_type" text DEFAULT 'before' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_card_number" text NOT NULL,
	"client_ref" uuid NOT NULL,
	"status" text DEFAULT 'checked_in' NOT NULL,
	"customer_name" text NOT NULL,
	"mobile" text NOT NULL,
	"plate_no" text NOT NULL,
	"car_model" text NOT NULL,
	"address" text,
	"date_in" date NOT NULL,
	"time_in" text NOT NULL,
	"type_of_services" text,
	"odometer" integer,
	"diagram_marks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fuel_level" smallint,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"advisor_notes" text,
	"work_requested" text,
	"special_instructions" text,
	"lang" text NOT NULL,
	"terms_accepted" boolean NOT NULL,
	"terms_accept_mode" text NOT NULL,
	"terms_version" text NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"customer_rep_name" text NOT NULL,
	"checkin_signature_key" text NOT NULL,
	"checkin_signed_at" timestamp with time zone NOT NULL,
	"received_by" text NOT NULL,
	"checkin_pdf_key" text NOT NULL,
	"checkin_pdf_sha256" text NOT NULL,
	"time_out" text,
	"delivered_by" text,
	"delivery_signature_key" text,
	"delivered_at" timestamp with time zone,
	"final_pdf_key" text,
	"final_pdf_sha256" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_cards_jobCardNumber_unique" UNIQUE("job_card_number"),
	CONSTRAINT "job_cards_clientRef_unique" UNIQUE("client_ref")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_job_card_id_job_cards_id_fk" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_card_images" ADD CONSTRAINT "job_card_images_job_card_id_job_cards_id_fk" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amendments_card_idx" ON "amendments" USING btree ("job_card_id");--> statement-breakpoint
CREATE INDEX "job_card_images_card_idx" ON "job_card_images" USING btree ("job_card_id");--> statement-breakpoint
CREATE INDEX "job_cards_created_at_idx" ON "job_cards" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_cards_name_trgm" ON "job_cards" USING gin ("customer_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "job_cards_mobile_trgm" ON "job_cards" USING gin ("mobile" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "job_cards_plate_trgm" ON "job_cards" USING gin ("plate_no" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "job_cards_number_trgm" ON "job_cards" USING gin ("job_card_number" gin_trgm_ops);--> statement-breakpoint
-- Signed records are immutable: check-in data can never change; delivery data can be written once.
CREATE FUNCTION job_cards_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'job cards cannot be deleted'; END IF;
  IF (to_jsonb(OLD) - ARRAY['status','time_out','delivered_by','delivery_signature_key','delivered_at','final_pdf_key','final_pdf_sha256','updated_at'])
     IS DISTINCT FROM
     (to_jsonb(NEW) - ARRAY['status','time_out','delivered_by','delivery_signature_key','delivered_at','final_pdf_key','final_pdf_sha256','updated_at']) THEN
    RAISE EXCEPTION 'signed check-in data is immutable (job card %)', OLD.job_card_number;
  END IF;
  IF OLD.delivered_at IS NOT NULL THEN
    RAISE EXCEPTION 'delivered job card % is immutable', OLD.job_card_number;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER job_cards_guard BEFORE UPDATE OR DELETE ON job_cards FOR EACH ROW EXECUTE FUNCTION job_cards_guard();
--> statement-breakpoint
CREATE FUNCTION append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END $$;
--> statement-breakpoint
CREATE TRIGGER job_card_images_append_only BEFORE UPDATE OR DELETE ON job_card_images FOR EACH ROW EXECUTE FUNCTION append_only();
--> statement-breakpoint
CREATE TRIGGER amendments_append_only BEFORE UPDATE OR DELETE ON amendments FOR EACH ROW EXECUTE FUNCTION append_only();
