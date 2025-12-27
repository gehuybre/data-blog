import { EmbedClient } from "./EmbedClient"
import { getAllEmbedParams } from "@/lib/embed-config"

// Auto-generate all embeddable sections from centralized config
export function generateStaticParams() {
  return getAllEmbedParams()
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
