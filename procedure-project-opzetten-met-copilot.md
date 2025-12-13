We gaan een publicatiegerichte site bouwen met Next.js, MDX, shadcn/ui en een analyse-structuur per post. Alles zit in één GitHub repo. De site wordt statisch geëxporteerd en gedeployed naar GitHub Pages. Analyses worden opnieuw gedraaid via GitHub Actions en de resultaten worden als JSON in de build opgenomen.

Gebruik dit document als opdracht voor VS Code Copilot. Werk sequentieel. Na elke stap moet het project kunnen runnen of builden. Als iets faalt, los je het meteen op voor je doorgaat.

Randvoorwaarden
De site is statisch. Geen server-only features die export breken.
Elke analyse leeft in analyses/<slug>/ met data, src, results en content.mdx.
Resultaten worden gekopieerd naar public/data/<slug>/ zodat client-side componenten data kunnen laden via fetch.
Overzichtspagina toont kaarten per analyse, met titel, datum, tags en korte samenvatting.
Detailpagina rendert MDX en laat custom React componenten toe voor grafieken en kaarten.
Styling via Tailwind en shadcn/ui. Typografie is leesbaar en rustig.
Deploy via GitHub Actions naar GitHub Pages.

1) Maak de repo en initieer Next.js
Maak een nieuwe map en initialiseer een Next.js app met App Router en TypeScript.

Commando’s
npm create next-app@latest embuild-analyses
Kies
TypeScript: yes
ESLint: yes
Tailwind: yes
src/ directory: yes
App Router: yes
import alias: yes (laat standaard staan)

Ga daarna in de map
cd embuild-analyses

Start lokaal om te checken
npm run dev

2) Installeer shadcn/ui
We gebruiken shadcn/ui componenten bovenop Tailwind.

Commando’s
npx shadcn@latest init
Kies een neutrale stijl en laat de defaults staan voor directory structuur.

Voeg basiscomponenten toe die we sowieso nodig hebben
npx shadcn@latest add button card badge separator tabs table skeleton dropdown-menu input

Maak een eenvoudige layout check in src/app/page.tsx met Card en Button zodat je ziet dat shadcn werkt.

3) Voeg MDX support toe met Contentlayer
We willen MDX bestanden als “posts” kunnen laden met metadata. Contentlayer is een praktisch patroon voor publicatie-sites.

Installeer dependencies
npm i contentlayer next-contentlayer
npm i -D @types/mdx

Maak content directory
mkdir -p content/analyses

Maak contentlayer config
Maak een bestand contentlayer.config.ts in de root.

Doel
We definiëren een documenttype Analysis dat MDX bestanden onder content/analyses/** leest.
We willen velden zoals title, date, summary, tags, slug.
We willen ook de MDX body als code kunnen renderen in Next.js.

Voorbeeldstructuur van het documenttype
name: Analysis
filePathPattern: **/*.mdx
contentType: mdx
fields
title: string required
date: date required
summary: string required
tags: list of string optional
slug: string required

Zorg dat contentlayer uit slug een route kan maken.

Update next config voor contentlayer
Maak of update next.config.js zodat Contentlayer werkt.

Gebruik het patroon
const { withContentlayer } = require("next-contentlayer")
module.exports = withContentlayer({
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
})

Let op
We zetten output export al aan, en trailingSlash helpt op GitHub Pages.

4) Maak routes voor overzicht en detail
We maken
/ als overzichtspagina
/analyses/[slug] als detailpagina

Overzichtspagina
In src/app/page.tsx
Lees alle analyses uit Contentlayer, sorteer op date desc.
Render een grid van Cards.
Elke Card toont title, date, summary en tags.
Link naar /analyses/<slug>.

Detailpagina
Maak src/app/analyses/[slug]/page.tsx
Zoek de juiste analysis op basis van params.slug.
Render de MDX body.

MDX rendering
Gebruik next-contentlayer’s useMDXComponent.
Maak een mapping van MDX componenten naar je eigen React componenten, bijvoorbeeld LineChart, ChoroplethMap, Callout, DataTable.

Zorg dat de pagina volledig statisch is.
Gebruik generateStaticParams om alle slugs vooraf te genereren.

5) Voeg een analyse toe als voorbeeld
Maak een eerste MDX bestand
content/analyses/bouwprijzen-voorbeeld.mdx

Frontmatter voorbeeld
title: "Bouwprijzen, voorbeeld"
date: "2025-12-13"
summary: "Korte voorbeeldanalyse met een grafiekcomponent en statische JSON data."
tags:
  - "bouw"
  - "prijzen"
slug: "bouwprijzen-voorbeeld"

In de body zet je gewone tekst en een component.
<LineChart dataUrl="/data/bouwprijzen-voorbeeld/tijdreeks.json" />

6) Definieer de analyse-folderstructuur in de repo
We willen analyse code en inputs naast de content kunnen bewaren, maar de site leest content via content/analyses en data via public/data.

Maak mappen
mkdir -p analyses/bouwprijzen-voorbeeld/data
mkdir -p analyses/bouwprijzen-voorbeeld/src
mkdir -p analyses/bouwprijzen-voorbeeld/results
mkdir -p public/data/bouwprijzen-voorbeeld

Stop een placeholder JSON in public/data/bouwprijzen-voorbeeld/tijdreeks.json zodat de grafiek al kan renderen.
Maak ook analyses/bouwprijzen-voorbeeld/results/tijdreeks.json als bron die later gekopieerd wordt.

7) Bouw visualisatiecomponenten
Maak components/charts/LineChart.tsx
Dit is een client component.
Hij doet fetch op dataUrl en rendert een simpele chart.
Kies een library die goed werkt in de browser, bijvoorbeeld recharts.

Installeer recharts
npm i recharts

Implementeer LineChart
Input
dataUrl: string
Verwachting
JSON array met objects zoals { "x": "2020-Q1", "y": 123 }

Gebruik shadcn Card voor container.
Toon loading state met Skeleton.
Toon een foutmelding als fetch faalt.

Maak eventueel later
components/maps/ChoroplethMap.tsx met Leaflet.
Installeer pas Leaflet als je effectief kaarten nodig hebt.

8) Scripts om analyses te draaien en resultaten te publiceren
We willen GitHub Actions analyses kunnen draaien en outputs naar public/data kopiëren.

Maak scripts/build_all_analyses.py
Taken
Vind alle subfolders in analyses/
Voor elke folder
Run een analyse entrypoint als die bestaat, bijvoorbeeld analyses/<slug>/src/run.py
Als er geen run.py is, sla over
Na het runnen
Kopieer analyses/<slug>/results/* naar public/data/<slug>/

Gebruik Python 3.11 en pathlib.
Zorg dat het script idempotent is.
Maak directories aan als nodig.

Maak requirements.txt
Zet minimaal
pandas
numpy

Als je nog niets nodig hebt, laat requirements.txt leeg, maar maak het bestand wel aan.

9) GitHub Pages configuratie voor Next.js export
We gebruiken static export naar out/.
GitHub Pages verwacht artifact deploy.

Update next.config.js voor basePath op Pages
Voor repo pages moet basePath en assetPrefix correct zijn.
Gebruik dit patroon.

const { withContentlayer } = require("next-contentlayer")
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] || ""
module.exports = withContentlayer({
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.GITHUB_ACTIONS ? `/${repo}` : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? `/${repo}/` : "",
})

10) GitHub Actions workflow
Maak .github/workflows/pages.yml

Workflow gedrag
Triggers
push op main
workflow_dispatch
schedule dagelijks of wekelijks

Stappen
checkout
setup-python 3.11
pip install -r requirements.txt
python scripts/build_all_analyses.py
setup-node 20
npm ci
npm run build
configure-pages
upload-pages-artifact path out
deploy-pages

Zet permissions correct voor Pages.

11) Project scripts in package.json
Zorg dat build een export doet.
In Next.js met output export is npm run build genoeg.
Controleer dat out/ wordt aangemaakt.

Voeg handig toe
"lint": "next lint"
"dev": "next dev"
"build": "next build"

12) Lokale checklijst
Deze dingen moeten werken voor je pusht.

npm run dev
Open /
Je ziet een kaart voor “Bouwprijzen, voorbeeld”.
Klik door naar de detailpagina.
De LineChart laadt data van /data/bouwprijzen-voorbeeld/tijdreeks.json.

npm run build
out/ bestaat en bevat index.html en analyses/<slug>/index.html.

13) Conventies voor nieuwe analyses
Voor elke nieuwe analyse doe je dit.

Maak analyse folder
analyses/<slug>/
  data/
  src/
  results/

Maak een MDX bestand
content/analyses/<slug>.mdx
Met frontmatter title, date, summary, tags, slug.

Zorg dat de analyse outputs schrijft naar analyses/<slug>/results.
Zorg dat build_all_analyses.py die results kopieert naar public/data/<slug>.

Gebruik in MDX vaste paden naar public data
/data/<slug>/...

14) Wat je niet mag doen als je statisch wil blijven
Geen server actions die runtime data nodig hebben.
Geen API routes voor data die je live moet callen.
Geen database afhankelijkheden.
Geen next/image optimalisatie zonder unoptimized setting.
Geen dynamische routes zonder generateStaticParams.

15) Aanbevolen uitbreidingen, pas later
Zoekfunctie over analyses op titel en tags.
Tag pagina’s.
RSS feed.
Sitemap.
Cachen in GitHub Actions zodat zware analyses niet telkens volledig draaien.
Previews met PR builds.

Als je dit volledig hebt opgezet, commit je alles en push je naar main. Zet in GitHub de Pages source op “GitHub Actions”. Daarna is de site live op de standaard Pages URL van de repo.
