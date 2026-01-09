"use client"

import { ProjectFilters, ProjectMetadata, SortOption, Project } from "@/types/project-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import { useMemo, useState } from "react"

interface ProjectFiltersComponentProps {
  filters: ProjectFilters
  setFilters: (filters: ProjectFilters) => void
  metadata: ProjectMetadata | null
  projects: Project[]
  sortOption: SortOption
  setSortOption: (option: SortOption) => void
}

export function ProjectFiltersComponent({
  filters,
  setFilters,
  metadata,
  projects,
  sortOption,
  setSortOption,
}: ProjectFiltersComponentProps) {
  const [searchInput, setSearchInput] = useState("")

  // Get unique municipalities from loaded projects
  const municipalities = useMemo(() => {
    const unique = Array.from(new Set(projects.map(p => p.municipality)))
    return unique.sort()
  }, [projects])

  const handleMunicipalityChange = (value: string) => {
    if (value === "all") {
      const { municipality, ...rest } = filters
      setFilters(rest)
    } else {
      setFilters({ ...filters, municipality: value })
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId]

    if (newCategories.length === 0) {
      const { categories, ...rest } = filters
      setFilters(rest)
    } else {
      setFilters({ ...filters, categories: newCategories })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setFilters({ ...filters, searchQuery: searchInput.trim() })
    } else {
      const { searchQuery, ...rest } = filters
      setFilters(rest)
    }
  }

  const handleReset = () => {
    setFilters({})
    setSearchInput("")
  }

  const hasActiveFilters =
    filters.municipality ||
    (filters.categories && filters.categories.length > 0) ||
    filters.searchQuery

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Zoeken</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Zoek in projectnamen en beschrijvingen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit">Zoeken</Button>
      </form>

      {/* Municipality and Sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="municipality">Gemeente</Label>
          <Select
            value={filters.municipality || "all"}
            onValueChange={handleMunicipalityChange}
          >
            <SelectTrigger id="municipality">
              <SelectValue placeholder="Alle gemeenten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle gemeenten</SelectItem>
              {municipalities.map(muni => (
                <SelectItem key={muni} value={muni}>
                  {muni}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sort">Sorteren</Label>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount-desc">Bedrag (hoog → laag)</SelectItem>
              <SelectItem value="amount-asc">Bedrag (laag → hoog)</SelectItem>
              <SelectItem value="municipality">Gemeente (A → Z)</SelectItem>
              <SelectItem value="category">Categorie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories */}
      {metadata && (
        <div>
          <Label className="mb-2 block">Categorieën</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metadata.categories)
              .sort((a, b) => b[1].project_count - a[1].project_count)
              .map(([id, cat]) => {
                const isActive = filters.categories?.includes(id)
                return (
                  <Badge
                    key={id}
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => handleCategoryToggle(id)}
                  >
                    {cat.emoji} {cat.label} ({cat.project_count})
                  </Badge>
                )
              })}
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Actieve filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.municipality && (
              <Badge variant="secondary">
                Gemeente: {filters.municipality}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const { municipality, ...rest } = filters
                    setFilters(rest)
                  }}
                />
              </Badge>
            )}
            {filters.categories?.map(catId => {
              const cat = metadata?.categories[catId]
              return (
                <Badge key={catId} variant="secondary">
                  {cat?.emoji} {cat?.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleCategoryToggle(catId)}
                  />
                </Badge>
              )
            })}
            {filters.searchQuery && (
              <Badge variant="secondary">
                Zoekterm: &quot;{filters.searchQuery}&quot;
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const { searchQuery, ...rest } = filters
                    setFilters(rest)
                    setSearchInput("")
                  }}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
