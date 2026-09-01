import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { ContactHero } from "@/components/heroes/ContactHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactVisit } from "@/components/contact/ContactVisit";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => chapterHead("contact"),
  component: Contact,
});

function Contact() {
  return (
    <PageShell chapter="contact" hero={<ContactHero />}>
      <ContactForm />
      <ContactVisit />
    </PageShell>
  );
}
