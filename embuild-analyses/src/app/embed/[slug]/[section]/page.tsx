import { EmbedClient } from "./EmbedClient"

// Define all embeddable sections statically for static export
export function generateStaticParams() {
  return [
    // vergunningen-goedkeuringen analysis
    { slug: "vergunningen-goedkeuringen", section: "renovatie" },
    { slug: "vergunningen-goedkeuringen", section: "nieuwbouw" },
    // starters-stoppers analysis
    { slug: "starters-stoppers", section: "starters" },
    { slug: "starters-stoppers", section: "stoppers" },
    { slug: "starters-stoppers", section: "survival" },
  ]
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}) {
  const { slug, section } = await params

  // View type and filters are handled client-side via URL query params
  return <EmbedClient slug={slug} section={section} />
}
