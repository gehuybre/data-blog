"use client"

import { useState } from "react"
import { EnergiekaartSection } from "./EnergiekaartSection"
import data from "../../../../analyses/energiekaart-premies/results/data_yearly.json"
import measures from "../../../../analyses/energiekaart-premies/results/measures.json"
import { MeasureFilter } from "./MeasureFilter"

export type YearlyDataRow = {
  jaar: number
  maatregel: string
  aantal: number
  bedrag: number
  aantal_beschermd: number
  bedrag_beschermd: number
}

export function EnergiekaartDashboard() {
  const [selectedMeasure, setSelectedMeasure] = useState<string>("Totaal")

  // Filter data by selected measure
  const filteredData = data.filter(
    (row) => row.maatregel === selectedMeasure
  ) as YearlyDataRow[]

  return (
    <div className="space-y-8">
      {/* Measure Filter */}
      <div className="flex flex-col gap-4">
        <MeasureFilter
          measures={measures}
          selectedMeasure={selectedMeasure}
          onMeasureChange={setSelectedMeasure}
        />
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {/* Total Subsidies Count */}
        <EnergiekaartSection
          title="Aantal toegekende premies"
          data={filteredData}
          metric="aantal"
          label="Aantal premies"
          slug="energiekaart-premies"
          sectionId="aantal-premies"
          dataSource="Vlaams Energieagentschap - Energiekaart"
          dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          selectedMeasure={selectedMeasure}
        />

        {/* Total Amount */}
        <EnergiekaartSection
          title="Totaal bedrag premies"
          data={filteredData}
          metric="bedrag"
          label="Bedrag (€)"
          slug="energiekaart-premies"
          sectionId="bedrag-premies"
          dataSource="Vlaams Energieagentschap - Energiekaart"
          dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          selectedMeasure={selectedMeasure}
          isCurrency={true}
        />

        {/* Protected Consumers Count */}
        <EnergiekaartSection
          title="Aantal premies voor beschermde afnemers"
          data={filteredData}
          metric="aantal_beschermd"
          label="Aantal premies (beschermde afnemers)"
          slug="energiekaart-premies"
          sectionId="aantal-beschermd"
          dataSource="Vlaams Energieagentschap - Energiekaart"
          dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          selectedMeasure={selectedMeasure}
        />

        {/* Protected Consumers Amount */}
        <EnergiekaartSection
          title="Totaal bedrag premies voor beschermde afnemers"
          data={filteredData}
          metric="bedrag_beschermd"
          label="Bedrag (€) (beschermde afnemers)"
          slug="energiekaart-premies"
          sectionId="bedrag-beschermd"
          dataSource="Vlaams Energieagentschap - Energiekaart"
          dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          selectedMeasure={selectedMeasure}
          isCurrency={true}
        />
      </div>
    </div>
  )
}
