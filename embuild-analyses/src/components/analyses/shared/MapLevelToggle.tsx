"use client"

import { Map, MapPin, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type MapDisplayLevel = "region" | "province" | "municipality"

interface MapLevelToggleProps {
  level: MapDisplayLevel
  onLevelChange: (level: MapDisplayLevel) => void
  className?: string
}

const LEVEL_CONFIG = {
  region: {
    icon: Map,
    label: "Regio's",
    tooltip: "Toon regio's met gewestgrenzen",
  },
  province: {
    icon: Building2,
    label: "Provincies",
    tooltip: "Toon provincies met provinciegrenzen",
  },
  municipality: {
    icon: MapPin,
    label: "Gemeentes",
    tooltip: "Toon gemeentes met gemeentegrenzen",
  },
} as const

export function MapLevelToggle({ level, onLevelChange, className }: MapLevelToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {(Object.entries(LEVEL_CONFIG) as [MapDisplayLevel, typeof LEVEL_CONFIG[MapDisplayLevel]][]).map(
        ([levelKey, config]) => {
          const Icon = config.icon
          const isActive = level === levelKey

          return (
            <Button
              key={levelKey}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onLevelChange(levelKey)}
              className={cn(
                "gap-2 transition-all",
                isActive ? "shadow-sm" : "hover:bg-background"
              )}
              title={config.tooltip}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          )
        }
      )}
    </div>
  )
}
