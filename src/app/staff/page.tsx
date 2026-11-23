import JobCardForm from "@/components/JobCardForm";
import { requireRole } from "@/lib/auth";

export default async function StaffPage() {
  await requireRole("staff", "admin");
  return <JobCardForm />;
}
