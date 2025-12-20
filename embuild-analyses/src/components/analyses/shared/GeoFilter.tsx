"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useGeo } from "./GeoContext"
import { REGIONS, PROVINCES, Municipality, getProvinceForMunicipality } from "@/lib/geo-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface GeoFilterProps {
  municipalities: Municipality[]
}

export function GeoFilter({ municipalities }: GeoFilterProps) {
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

  const [openMunicipality, setOpenMunicipality] = React.useState(false)

  // Filter provinces based on selected region
  const availableProvinces = PROVINCES.filter(p => 
    selectedRegion === '1000' || p.regionCode === selectedRegion
  )

  // Filter municipalities based on selected province (or region if province not selected)
  const availableMunicipalities = municipalities.filter(m => {
    const provCode = getProvinceForMunicipality(m.code)
    const prov = PROVINCES.find(p => p.code === provCode)
    
    if (selectedProvince) {
      return provCode === selectedProvince
    }
    if (selectedRegion !== '1000') {
      return prov?.regionCode === selectedRegion
    }
    return true
  }).sort((a, b) => a.name.localeCompare(b.name))

  const selectClass = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm border-blue-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Region Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Regio</label>
          <select 
            aria-label="Selecteer regio"
            value={selectedRegion} 
            onChange={(e) => {
              const val = e.target.value as any
              setSelectedRegion(val)
              setLevel('region')
              setSelectedProvince(null)
              setSelectedMunicipality(null)
            }}
            className={selectClass}
          >
            {REGIONS.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Province Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Provincie</label>
          <select 
            aria-label="Selecteer provincie"
            value={selectedProvince || ""} 
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                setSelectedProvince(val)
                setLevel('province')
                setSelectedMunicipality(null)
                
                // If province changes, ensure region matches
                const prov = PROVINCES.find(p => p.code === val)
                if (prov && prov.regionCode !== selectedRegion && selectedRegion !== '1000') {
                   setSelectedRegion(prov.regionCode)
                }
              } else {
                setSelectedProvince(null)
                if (selectedRegion !== '1000') {
                    setLevel('region')
                }
              }
            }}
            disabled={availableProvinces.length === 0 && selectedRegion !== '1000'}
            className={selectClass}
          >
            <option value="">Selecteer provincie</option>
            {availableProvinces.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Municipality Select (Combobox) */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Gemeente</label>
          <Popover open={openMunicipality} onOpenChange={setOpenMunicipality}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMunicipality}
                className="w-full justify-between font-normal"
              >
                {selectedMunicipality
                  ? municipalities.find((m) => m.code.toString() === selectedMunicipality)?.name
                  : "Selecteer gemeente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Zoek gemeente..." />
                <CommandList>
                  <CommandEmpty>Geen gemeente gevonden.</CommandEmpty>
                  <CommandGroup>
                    {availableMunicipalities.map((m) => (
                      <CommandItem
                        key={m.code}
                        value={m.name}
                        onSelect={() => {
                          setSelectedMunicipality(m.code.toString())
                          setOpenMunicipality(false)
                          setLevel('municipality')
                          
                          // Update province and region
                          const provCode = getProvinceForMunicipality(m.code)
                          if (provCode) {
                              setSelectedProvince(provCode)
                              const prov = PROVINCES.find(p => p.code === provCode)
                              if (prov) {
                                  setSelectedRegion(prov.regionCode)
                              }
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMunicipality === m.code.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {m.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
