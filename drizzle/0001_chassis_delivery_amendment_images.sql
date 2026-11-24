ALTER TABLE "job_card_images" ADD COLUMN "amendment_id" integer;--> statement-breakpoint
ALTER TABLE "job_cards" ADD COLUMN "chassis_no" text;--> statement-breakpoint
ALTER TABLE "job_cards" ADD COLUMN "delivery_date" date;--> statement-breakpoint
ALTER TABLE "job_card_images" ADD CONSTRAINT "job_card_images_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_cards_chassis_trgm" ON "job_cards" USING gin ("chassis_no" gin_trgm_ops);
