import { ShareCard } from "@/components/share/ShareCard";

export default function SharePage({ params }: { params: { data: string } }) {
  return <ShareCard encoded={params.data} />;
}
