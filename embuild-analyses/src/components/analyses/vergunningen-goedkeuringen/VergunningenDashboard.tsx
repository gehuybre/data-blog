"use client"

import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProvider } from "../shared/GeoContext"
import { GeoFilter } from "../shared/GeoFilter"
import data from "../../../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import municipalities from "../../../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

export function VergunningenDashboard() {
  return (
    <GeoProvider>
      <div className="space-y-12">
        <GeoFilter municipalities={municipalities} />
        
        <AnalysisSection 
          title="Renovatie (Gebouwen)" 
          data={data} 
          municipalities={municipalities} 
          metric="ren" 
          label="Aantal"
        />
        
        <AnalysisSection 
          title="Nieuwbouw (Gebouwen)" 
          data={data} 
          municipalities={municipalities} 
          metric="new" 
          label="Aantal"
        />
      </div>
    </GeoProvider>
  )
}
