import { allAnalyses } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { MDXContent } from '@/components/mdx-content'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export const generateStaticParams = async () => {
  return allAnalyses.map((analysis) => ({ slug: analysis.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const analysis = allAnalyses.find((analysis) => analysis.slug === slug)
  if (!analysis) return { title: 'Analysis Not Found' }
  return { title: analysis.title }
}

export default async function AnalysisPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const analysis = allAnalyses.find((analysis) => analysis.slug === slug)

  if (!analysis) notFound()

  return (
    <article className="container mx-auto py-10 prose dark:prose-invert max-w-3xl">
      <nav className="mb-6 not-prose">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Terug naar overzicht</span>
        </Link>
      </nav>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{analysis.title}</h1>
        <time
          dateTime={analysis.sourcePublicationDate || analysis.date}
          className="text-muted-foreground"
        >
          {analysis.sourcePublicationDate
            ? `Brondata: ${format(parseISO(analysis.sourcePublicationDate), 'd MMMM yyyy')}`
            : format(parseISO(analysis.date), 'd MMMM yyyy')
          }
        </time>
      </div>
      <MDXContent code={analysis.body.code} />

      {analysis.sourceProvider && analysis.sourceUrl && (
        <footer className="mt-12 pt-6 border-t not-prose">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Bron:</span>{' '}
            <a
              href={analysis.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {analysis.sourceProvider}
              {analysis.sourceTitle && ` - ${analysis.sourceTitle}`}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </footer>
      )}
    </article>
  )
}
