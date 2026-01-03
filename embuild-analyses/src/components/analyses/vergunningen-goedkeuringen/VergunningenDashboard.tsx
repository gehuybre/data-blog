"use client"

import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProviderWithDefaults } from "../shared/GeoContext"
import data from "../../../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import municipalities from "../../../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

export function VergunningenDashboard() {
  return (
    <GeoProviderWithDefaults initialLevel="province" initialRegion="1000" initialProvince={null} initialMunicipality={null}>
      <div className="space-y-12">
        <AnalysisSection
          title="Renovatie (Gebouwen)"
          data={data}
          municipalities={municipalities}
          metric="ren"
          label="Aantal"
          slug="vergunningen-goedkeuringen"
          sectionId="renovatie"
          dataSource="Statbel - Bouwvergunningen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/bouwvergunningen"
          showMap={true}
        />

        <AnalysisSection
          title="Nieuwbouw (Gebouwen)"
          data={data}
          municipalities={municipalities}
          metric="new"
          label="Aantal"
          slug="vergunningen-goedkeuringen"
          sectionId="nieuwbouw"
          dataSource="Statbel - Bouwvergunningen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/bouwvergunningen"
          showMap={true}
        />
      </div>
    </GeoProviderWithDefaults>
  )
}
