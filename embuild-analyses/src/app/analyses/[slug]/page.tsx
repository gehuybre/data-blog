import { allAnalyses } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { MDXContent } from '@/components/mdx-content'

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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{analysis.title}</h1>
        <time dateTime={analysis.date} className="text-muted-foreground">
          {format(parseISO(analysis.date), 'LLLL d, yyyy')}
        </time>
      </div>
      <MDXContent code={analysis.body.code} />
    </article>
  )
}
