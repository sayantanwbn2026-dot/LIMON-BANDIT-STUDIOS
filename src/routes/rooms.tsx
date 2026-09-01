import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { RoomsRail } from "@/components/rooms/RoomsRail";
import { RoomsFloor } from "@/components/rooms/RoomsFloor";
import { RoomsBooking } from "@/components/rooms/RoomsBooking";
import { RoomsHero } from "@/components/heroes/RoomsHero";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/rooms")({
  head: () => chapterHead("rooms"),
  component: Rooms,
});

function Rooms() {
  return (
    <PageShell chapter="rooms" hero={<RoomsHero />}>
      {/* the decision first, the atmosphere after */}
      <RoomsRail />
      <RoomsFloor />
      <RoomsBooking />
    </PageShell>
  );
}
