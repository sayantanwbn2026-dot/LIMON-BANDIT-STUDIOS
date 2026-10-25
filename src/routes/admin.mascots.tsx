import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { MascotEditor } from "@/components/admin/MascotEditor";

export const Route = createFileRoute("/admin/mascots")({
  component: Mascots,
});

function Mascots() {
  return (
    <>
      <AdminHeading
        title="Hero Mascot"
        standfirst="Every mascot on the site in one place: the house mascot, and the one standing on each page's opening screen. Leave a page empty and it uses the house mascot."
      />
      <MascotEditor />
    </>
  );
}
