import { EmbedClient } from "./EmbedClient"

// Define all embeddable sections statically for static export
export function generateStaticParams() {
  return [
    // vergunningen-goedkeuringen analysis
    { slug: "vergunningen-goedkeuringen", section: "renovatie" },
    { slug: "vergunningen-goedkeuringen", section: "nieuwbouw" },
  ]
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}) {
  const { slug, section } = await params

  // View type is now handled client-side via URL hash or query params
  return <EmbedClient slug={slug} section={section} />
}
