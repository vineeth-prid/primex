import "server-only";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Any S3-compatible store (MinIO now, AWS S3 later) — only env vars change.
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true, // required by MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});
const Bucket = process.env.S3_BUCKET ?? "vehicle-jobcards";

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function getObject(key: string): Promise<Buffer> {
  const r = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
  return Buffer.from(await r.Body!.transformToByteArray());
}

export async function deleteObjects(keys: string[]) {
  if (keys.length) await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
}
