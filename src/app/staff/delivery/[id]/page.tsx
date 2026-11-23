import { notFound } from "next/navigation";
import DeliveryForm from "@/components/DeliveryForm";
import { requireRole } from "@/lib/auth";
import { getJobCard } from "@/lib/jobcards";

export default async function DeliveryPage({ params }: PageProps<"/staff/delivery/[id]">) {
  await requireRole("staff", "admin");
  const card = await getJobCard(Number((await params).id));
  if (!card) notFound();
  return (
    <DeliveryForm card={{
      id: card.id, jobCardNumber: card.jobCardNumber, customerName: card.customerName, mobile: card.mobile,
      plateNo: card.plateNo, carModel: card.carModel, lang: card.lang, delivered: !!card.deliveredAt,
      workRequested: card.workRequested,
    }} />
  );
}
