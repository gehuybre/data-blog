"use client"

import * as React from "react"
import { Check, ChevronsUpDown, RotateCcw } from "lucide-react"
import { useGeo } from "./GeoContext"
import { REGIONS, PROVINCES, Municipality, getProvinceForMunicipality } from "@/lib/geo-utils"
import { formatMunicipalityName } from "@/lib/name-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface GeoFilterProps {
  municipalities: Municipality[]
  showProvinces?: boolean
  showMunicipalities?: boolean
}

export function GeoFilter({
  municipalities,
  showProvinces = true,
  showMunicipalities = true,
}: GeoFilterProps) {
  const {
    level,
    setLevel,
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    selectedMunicipality,
    setSelectedMunicipality,
  } = useGeo()

  const [open, setOpen] = React.useState(false)

  const selectedMunicipalityName = React.useMemo(() => {
    if (!selectedMunicipality) return null
    return municipalities.find((m) => m.code.toString() === selectedMunicipality)?.name ?? null
  }, [municipalities, selectedMunicipality])

  const selectedProvinceName = React.useMemo(() => {
    if (!selectedProvince) return null
    return PROVINCES.find((p) => String(p.code) === String(selectedProvince))?.name ?? null
  }, [selectedProvince])

  const selectedRegionName = React.useMemo(() => {
    return REGIONS.find((r) => r.code === selectedRegion)?.name ?? "België"
  }, [selectedRegion])

  const isDefaultSelection =
    level === "region" &&
    selectedRegion === "1000" &&
    !selectedProvince &&
    !selectedMunicipality

  const currentSelectionLabel = selectedMunicipalityName
    ? `Gemeente: ${selectedMunicipalityName}`
    : selectedProvinceName
      ? `Provincie: ${selectedProvinceName}`
      : selectedRegion !== "1000"
        ? `Regio: ${selectedRegionName}`
        : "België"

  const currentSelectionKey = selectedMunicipality
    ? `mun:${selectedMunicipality}`
    : selectedProvince
      ? `prov:${selectedProvince}`
      : `reg:${selectedRegion}`

  const sortedProvinces = React.useMemo(() => {
    return [...PROVINCES].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const sortedMunicipalities = React.useMemo(() => {
    return [...municipalities].sort((a, b) => a.name.localeCompare(b.name))
  }, [municipalities])

  function selectBelgium() {
    setSelectedRegion("1000")
    setSelectedProvince(null)
    setSelectedMunicipality(null)
    setLevel("region")
    setOpen(false)
  }

  function selectRegion(code: any) {
    setSelectedRegion(code)
    setSelectedProvince(null)
    setSelectedMunicipality(null)
    setLevel("region")
    setOpen(false)
  }

  function selectProvince(code: string) {
    setSelectedProvince(code)
    setSelectedMunicipality(null)
    const prov = PROVINCES.find((p) => p.code === code)
    if (prov) setSelectedRegion(prov.regionCode)
    setLevel("province")
    setOpen(false)
  }

  function selectMunicipality(code: number) {
    setSelectedMunicipality(code.toString())
    const provCode = getProvinceForMunicipality(code)
    setSelectedProvince(provCode)
    const prov = PROVINCES.find((p) => p.code === provCode)
    if (prov) setSelectedRegion(prov.regionCode)
    setLevel("municipality")
    setOpen(false)
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm border-blue-500">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Locatie</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">{currentSelectionLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder={
                  showProvinces && showMunicipalities
                    ? "Zoek België, regio, provincie of gemeente..."
                    : showProvinces
                      ? "Zoek België, regio of provincie..."
                      : "Zoek België of regio..."
                }
              />
              <CommandList>
                <CommandEmpty>Geen resultaat gevonden.</CommandEmpty>

                <CommandGroup heading="Land">
                  <CommandItem value="België" onSelect={selectBelgium}>
                    <Check className={cn("mr-2 h-4 w-4", currentSelectionKey === "reg:1000" ? "opacity-100" : "opacity-0")} />
                    België
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Regio">
                  {REGIONS.filter((r) => r.code !== "1000").map((r) => (
                    <CommandItem key={r.code} value={r.name} onSelect={() => selectRegion(r.code)}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selectedProvince && !selectedMunicipality && selectedRegion === r.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {r.name}
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />

                {showProvinces ? (
                  <>
                    <CommandGroup heading="Provincie">
                      {sortedProvinces.map((p) => (
                        <CommandItem key={p.code} value={p.name} onSelect={() => selectProvince(p.code)}>
                          <Check className={cn("mr-2 h-4 w-4", currentSelectionKey === `prov:${p.code}` ? "opacity-100" : "opacity-0")} />
                          {p.name}
                          <span className="ml-2 text-xs text-muted-foreground">({REGIONS.find((r) => r.code === p.regionCode)?.name})</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ) : null}

                {showMunicipalities ? (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Gemeente">
                      {sortedMunicipalities.map((m) => (
                        <CommandItem
                          key={m.code}
                          value={formatMunicipalityName(m.name)}
                          onSelect={() => selectMunicipality(m.code)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", currentSelectionKey === `mun:${m.code}` ? "opacity-100" : "opacity-0")} />
                          {formatMunicipalityName(m.name)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ) : null}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDefaultSelection}
            onClick={selectBelgium}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Huidige selectie:{" "}
          {level === "municipality" && selectedMunicipalityName
            ? `${selectedMunicipalityName} · ${selectedProvinceName ?? ""} · ${selectedRegionName}`
            : level === "province" && selectedProvinceName
              ? `${selectedProvinceName} · ${selectedRegionName}`
              : selectedRegionName}
        </div>
      </div>
    </div>
  )
}
