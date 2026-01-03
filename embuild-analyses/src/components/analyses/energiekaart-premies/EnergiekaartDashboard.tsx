"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MeasureFilter } from "./MeasureFilter"
import { TimeSeriesSection } from "../shared/TimeSeriesSection"
import { EnergiekaartSection } from "./EnergiekaartSection"
import { EnergiekaartChart } from "./EnergiekaartChart"
import { EnergiekaartTable } from "./EnergiekaartTable"
import { formatScaledEuro, getCurrencyLabel, getCurrencyScale } from "./formatters"

// Import data files directly if needed, but they are imported in dashboard container usually
import data from "../../../../analyses/energiekaart-premies/results/data_yearly.json"
import measures from "../../../../analyses/energiekaart-premies/results/measures.json"

// Define type locally to avoid circular dependencies
export interface YearlyDataRow {
  jaar: number
  maatregel: string
  aantal: number
  bedrag: number
  aantal_beschermd: number
  bedrag_beschermd: number
  // Add other properties if needed
  [key: string]: any
}

// Helper component removed, using shared EnergiekaartSection

export function EnergiekaartDashboard() {
  const [selectedMeasure, setSelectedMeasure] = useState<string>("Totaal")

  return (
    <div className="space-y-12">
      {/* Total Subsidies Count */}
      <EnergiekaartSection
        title="Aantal toegekende premies"
        data={data as YearlyDataRow[]}
        metric="aantal"
        label="Aantal premies"
        slug="energiekaart-premies"
        sectionId="aantal-premies"
        dataSource="Vlaams Energieagentschap - Energiekaart"
        dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
        selectedMeasure={selectedMeasure}
        headerControls={
          <MeasureFilter
            measures={measures}
            selectedMeasure={selectedMeasure}
            onMeasureChange={setSelectedMeasure}
          />
        }
      />

      {/* Total Amount */}
      <EnergiekaartSection
        title="Totaal bedrag premies"
        data={data as YearlyDataRow[]}
        metric="bedrag"
        label="Bedrag (€)"
        slug="energiekaart-premies"
        sectionId="bedrag-premies"
        dataSource="Vlaams Energieagentschap - Energiekaart"
        dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
        selectedMeasure={selectedMeasure}
        isCurrency={true}
        headerControls={
          <MeasureFilter
            measures={measures}
            selectedMeasure={selectedMeasure}
            onMeasureChange={setSelectedMeasure}
          />
        }
      />

      {/* Protected Consumers Count */}
      <EnergiekaartSection
        title="Aantal premies voor beschermde afnemers"
        data={data as YearlyDataRow[]}
        metric="aantal_beschermd"
        label="Aantal premies (beschermde afnemers)"
        slug="energiekaart-premies"
        sectionId="aantal-beschermd"
        dataSource="Vlaams Energieagentschap - Energiekaart"
        dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
        selectedMeasure={selectedMeasure}
        headerControls={
          <MeasureFilter
            measures={measures}
            selectedMeasure={selectedMeasure}
            onMeasureChange={setSelectedMeasure}
          />
        }
      />

      {/* Protected Consumers Amount */}
      <EnergiekaartSection
        title="Totaal bedrag premies voor beschermde afnemers"
        data={data as YearlyDataRow[]}
        metric="bedrag_beschermd"
        label="Bedrag (€) (beschermde afnemers)"
        slug="energiekaart-premies"
        sectionId="bedrag-beschermd"
        dataSource="Vlaams Energieagentschap - Energiekaart"
        dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
        selectedMeasure={selectedMeasure}
        isCurrency={true}
        headerControls={
          <MeasureFilter
            measures={measures}
            selectedMeasure={selectedMeasure}
            onMeasureChange={setSelectedMeasure}
          />
        }
      />
    </div>
  )
}
