"use client"

import { useState, useEffect, useMemo } from "react"
import { Project, ProjectMetadata, ProjectFilters, SortOption } from "@/types/project-types"
import { ProjectFiltersComponent } from "./ProjectFilters"
import { ProjectList } from "./ProjectList"
import { ProjectDetailModal } from "./ProjectDetailModal"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/data-blog' : ''

export function ProjectBrowser() {
  const [projects, setProjects] = useState<Project[]>([])
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())
  const [failedChunks, setFailedChunks] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ProjectFilters>({})
  const [sortOption, setSortOption] = useState<SortOption>("amount-desc")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Load metadata and first chunk on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadMetadata()
      const success = await loadChunk(0)
      if (!success) {
        setError("Kon eerste data chunk niet laden. Probeer de pagina te verversen.")
      }
      setLoading(false)
    }
    initializeData()
  }, [])

  const loadMetadata = async () => {
    try {
      const response = await fetch(`${BASE_PATH}/data/bouwprojecten-gemeenten/projects_metadata.json`)
      if (!response.ok) throw new Error("Failed to load metadata")
      const data = await response.json()
      setMetadata(data)
    } catch (err) {
      console.error("Error loading metadata:", err)
      setError("Kon metadata niet laden")
    }
  }

  const loadChunk = async (chunkIndex: number, retries = 3): Promise<boolean> => {
    if (loadedChunks.has(chunkIndex)) return true
    if (failedChunks.has(chunkIndex)) return false

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const response = await fetch(
          `${BASE_PATH}/data/bouwprojecten-gemeenten/projects_2026_chunk_${chunkIndex}.json`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()

        setProjects(prev => [...prev, ...data])
        setLoadedChunks(prev => new Set([...prev, chunkIndex]))
        return true
      } catch (err) {
        console.error(`Error loading chunk ${chunkIndex} (attempt ${attempt + 1}/${retries}):`, err)

        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        } else {
          // Mark as failed after all retries
          setFailedChunks(prev => new Set([...prev, chunkIndex]))
          console.error(`Failed to load chunk ${chunkIndex} after ${retries} attempts`)
          return false
        }
      }
    }
    return false
  }

  // Load all remaining chunks in parallel
  const loadAllChunks = async () => {
    if (!metadata) return

    setLoading(true)
    // Load all chunks in parallel
    const chunkPromises = Array.from({ length: metadata.chunks }, (_, i) => loadChunk(i))
    const results = await Promise.all(chunkPromises)

    // Check if any chunks failed
    const failedCount = results.filter(success => !success).length
    if (failedCount > 0) {
      setError(`${failedCount} chunk(s) konden niet worden geladen. Sommige projecten ontbreken mogelijk.`)
    }

    setLoading(false)
  }

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply municipality filter
    if (filters.municipality) {
      filtered = filtered.filter(p => p.municipality === filters.municipality)
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(p =>
        p.categories.some(cat => filters.categories!.includes(cat))
      )
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.ac_short.toLowerCase().includes(query) ||
        p.ac_long.toLowerCase().includes(query) ||
        p.municipality.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "amount-desc":
          return b.total_amount - a.total_amount
        case "amount-asc":
          return a.total_amount - b.total_amount
        case "municipality":
          return a.municipality.localeCompare(b.municipality)
        case "category":
          return (a.categories[0] || "").localeCompare(b.categories[0] || "")
        default:
          return 0
      }
    })

    return sorted
  }, [projects, filters, sortOption])

  const totalFilteredAmount = useMemo(() => {
    return filteredAndSortedProjects.reduce((sum, p) => sum + p.total_amount, 0)
  }, [filteredAndSortedProjects])

  const handleExportCSV = () => {
    const headers = [
      "Gemeente",
      "NIS Code",
      "Project Code",
      "Project Naam",
      "Categorieën",
      "Totaal Bedrag",
      "2026",
      "2027",
      "2028",
      "2029",
      "2030",
      "2031",
      "Beschrijving"
    ]

    const rows = filteredAndSortedProjects.map(p => [
      p.municipality,
      p.nis_code,
      p.ac_code,
      p.ac_short,
      p.categories.join("; "),
      p.total_amount.toFixed(2),
      p.yearly_amounts["2026"].toFixed(2),
      p.yearly_amounts["2027"].toFixed(2),
      p.yearly_amounts["2028"].toFixed(2),
      p.yearly_amounts["2029"].toFixed(2),
      p.yearly_amounts["2030"].toFixed(2),
      p.yearly_amounts["2031"].toFixed(2),
      `"${p.ac_long.replace(/"/g, '""')}"`
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gemeentelijke-investeringen-projecten-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Show error only if no data loaded at all
  const showCriticalError = error && projects.length === 0

  if (showCriticalError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Fout bij het laden van projecten: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError(null)
            setFailedChunks(new Set())
            loadChunk(0)
          }}
        >
          Opnieuw proberen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold mb-2">🔍 Project Browser - Bouwkansen 2026-2031</h2>
        <p className="text-muted-foreground">
          Doorzoek concrete investeringsprojecten uit de meerjarenplannen van Vlaamse gemeenten.
          Gebruik de filters om projecten te vinden die relevant zijn voor jouw sector.
        </p>
      </div>

      {/* Partial failure warning */}
      {error && projects.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Filters */}
      <ProjectFiltersComponent
        filters={filters}
        setFilters={setFilters}
        metadata={metadata}
        projects={projects}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Summary Stats */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gevonden projecten</p>
            <p className="text-2xl font-bold">
              {filteredAndSortedProjects.length.toLocaleString("nl-BE")}
            </p>
            {metadata && loadedChunks.size < metadata.chunks && (
              <Button
                variant="link"
                size="sm"
                onClick={loadAllChunks}
                disabled={loading}
                className="px-0 h-auto"
              >
                {loading ? "Laden..." : `Laad alle projecten (${projects.length}/${metadata.total_projects})`}
              </Button>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Totaal bedrag</p>
            <p className="text-2xl font-bold">
              €{(totalFilteredAmount / 1_000_000).toFixed(1)}M
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={filteredAndSortedProjects.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Project List */}
      <ProjectList
        projects={filteredAndSortedProjects}
        onProjectClick={setSelectedProject}
        loading={loading}
      />

      {/* Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          metadata={metadata}
        />
      )}
    </div>
  )
}
