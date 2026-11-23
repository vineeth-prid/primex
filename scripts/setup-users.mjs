// One-time (or password-rotation) setup of the single admin and single staff account.
// Usage: ADMIN_USERNAME=.. ADMIN_PASSWORD=.. STAFF_USERNAME=.. STAFF_PASSWORD=.. node scripts/setup-users.mjs
import { randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";

const hash = (pw) => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`; // same format as src/lib/auth.ts
};

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
for (const role of ["admin", "staff"]) {
  const P = role.toUpperCase();
  const username = process.env[`${P}_USERNAME`]?.trim().toLowerCase();
  const password = process.env[`${P}_PASSWORD`];
  const name = process.env[`${P}_NAME`] ?? (role === "admin" ? "Administrator" : "Staff");
  if (!username || !password) { console.log(`skip ${role}: ${P}_USERNAME / ${P}_PASSWORD not set`); continue; }
  if (password.length < 10) throw new Error(`${P}_PASSWORD must be at least 10 characters`);
  // Exactly one account per role: update it in place (keeps job card history linked), else create it.
  const h = hash(password);
  const updated = await sql`update users set username = ${username}, name = ${name}, password_hash = ${h} where role = ${role} returning id`;
  if (!updated.length) await sql`insert into users (name, username, password_hash, role) values (${name}, ${username}, ${h}, ${role})`;
  console.log(`${role} account "${username}" ready`);
}
await sql.end();
