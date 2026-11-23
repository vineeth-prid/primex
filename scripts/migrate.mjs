// Runs on every container start: applies pending SQL migrations and ensures the private bucket exists.
import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
await migrate(drizzle(sql), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
await sql.end();
console.log("migrations applied");

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
});
const Bucket = process.env.S3_BUCKET ?? "vehicle-jobcards";
try {
  await s3.send(new HeadBucketCommand({ Bucket }));
} catch {
  await s3.send(new CreateBucketCommand({ Bucket })); // private by default
  console.log(`bucket ${Bucket} created`);
}
