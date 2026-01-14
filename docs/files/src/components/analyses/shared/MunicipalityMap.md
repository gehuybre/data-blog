# MunicipalityMap — Input & Geo-tips 🗺️

Korte beschrijving

`MunicipalityMap` (en de wrapper `MapSection`) is bedoeld voor gemeente-niveau choropleth kaarten. Het gebruikt gemeente NIS-codes (5-cijferig) en een gemeentelijke GeoJSON (public/maps/belgium_municipalities.json).

Belangrijkste punten

- Data moet op gemeenteniveau zijn (5-digit NIS code). Verwachte accessor is `m` of `municipalityCode` tenzij `getGeoCode` is gespecificeerd.
- Voor tijdseries: geef `getPeriod`/`periods` en `showTimeSlider=true` door.
- Wil je provincedata tonen? breek die eerst uit naar gemeenten met `expandProvinceToMunicipalities` in `src/lib/map-utils.ts`.

Copy-paste voorbeeld

```tsx
import { MapSection } from "@/components/analyses/shared/MapSection"

const municipalityData = [
  { m: '11001', value: 100, y: 2024 }, // Aartselaar
  { m: '12001', value: 200, y: 2024 }, // Antwerpen
]

<MapSection
  data={municipalityData}
  getGeoCode={(d) => d.m}
  getValue={(d) => d.value}
  getPeriod={(d) => d.y}
  periods={[2020, 2021, 2022, 2023, 2024]}
  showTimeSlider={true}
  showProvinceBoundaries={true}
  height={500}
/>
```

Veelvoorkomende fouten & checklist ⚠️

- Data bevat geen 5-cijferige NIS-codes: kaart kan niets matchen.
- Je geeft provincie/regionale data zonder expanderen: gebruik `expandProvinceToMunicipalities`.
- Mis-match tussen `getPeriod` en `periods`: zorg dat je `periods` consistent sorted aanlevert.
- GeoJSON ontbreekt of is niet bereikbaar: de component laadt `public/maps/belgium_municipalities.json` via `getBasePath()`.

Flanders-only datasets & fusies (belangrijk) ✅

- De `MunicipalityMap` detecteert automatisch wanneer alle datarijen alleen Vlaamse gemeenten bevatten. In dat geval wordt alleen Vlaanderen weergegeven en **zullen gemeenten uit Brussel/Wallonië visueel verborgen** (d.w.z. transparant / geen stroke). Dit voorkomt dat lege of irrelevante gemeentegrenzen de kaart rommelig maken.
- **Let op fusies**: voor datasets die vóór gemeentefusies zijn samengesteld (bv. historische tabellen met oude NIS-codes) moet je de codes normaliseren of aggregeren naar de huidige (post-fusie) NIS-codes zodat de juiste waarde op de kaart terechtkomt.

Aanbevolen aanpak (copy-paste ready)

```ts
// Normaliseer en aggregeer oude NIS-codes naar de huidige codes
import { aggregateByNormalizedNis } from "@/lib/nis-fusion-utils"

const aggregated = aggregateByNormalizedNis(
  rawData,                 // je ruwe rijen
  (d) => d.m,              // nis-code accessor
  (d) => d.value,          // value accessor
  'sum'                    // aggregator (sum is meestal gewenst)
)

const municipalityData = Array.from(aggregated.entries()).map(([m, value]) => ({ m, value }))

// Nu doorgeven aan MapSection / MunicipalityMap
<MapSection data={municipalityData} getGeoCode={(d) => d.m} getValue={(d) => d.value} />
```

- `aggregateByNormalizedNis` en `normalizeNisCode` zitten in `src/lib/nis-fusion-utils.ts` en worden gebruikt door de `gemeentelijke-investeringen` analyse om fusies correct te behandelen.
- Als je juist een historische (pre-fusie) visualisatie wil maken waarin oude grenzen expliciet zichtbaar blijven, moet je expliciet oude codes gebruiken en de kaart niet normaliseren — maar hiervoor moet je GeoJSON/labels eventueel ook historisch aanpassen.

Praktisch voorbeeld: vergunningen-goedkeuringen

- In `VergunningenDashboard.tsx` hebben we recent de invoerdata vooraf genormaliseerd en per periode geaggregeerd:

```ts
// Normalize NIS codes and aggregate per period so multiple old codes add up
const normStr = normalizeNisCode(row.m) || String(row.m).padStart(5, "0")
const normNum = Number(normStr)
// group by `${y}-${q}|${normStr}` and sum counts
```

- Deze stap zorgt dat:
  - Fusiegemeenten correct worden gezet op de huidige NIS (post-fusie)
  - Wanneer dataset enkel Vlaamse gemeenten bevat, de kaart automatisch Flanders-focused weergave gebruikt (geen niet-Vlaamse grenzen)

Referentie voorbeelden

- `gemeentelijke-investeringen` gebruikt map-secties uitgebreid (bv. `InvesteringenBVSection` en `InvesteringenREKSection`) en is een goed voorbeeld van chunked municipality-data met time slider. Zie hun handling van fusies en `getConstituents`/`normalizeNisCode` in `src/lib/nis-fusion-utils.ts`.
- Zie `MapSection.tsx` in `src/components/analyses/shared/` voor een voorbeeld met `MunicipalitySearch` en auto-zoom.
