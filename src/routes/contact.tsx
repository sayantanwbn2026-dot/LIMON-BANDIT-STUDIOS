import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { ContactHero } from "@/components/heroes/ContactHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactVisit } from "@/components/contact/ContactVisit";
import { chapterHeadFrom, chapterSeo, houseJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  loader: () => chapterSeo("contact"),
  head: ({ loaderData }) =>
    chapterHeadFrom("contact", loaderData ? { ...loaderData, jsonLd: houseJsonLd() } : undefined),
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
