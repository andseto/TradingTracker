import { JournalDayContent } from "@/components/dashboard/JournalDayContent";

export default function JournalDayPage({ params }: { params: { date: string } }) {
  return <JournalDayContent date={params.date} />;
}
