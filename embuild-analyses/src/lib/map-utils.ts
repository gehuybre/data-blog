/**
 * Load municipality list from GeoJSON
 *
 * This function loads the full list of Belgian municipalities from the GeoJSON file.
 * Use this to populate the MunicipalitySearch component.
 *
 * @returns Promise resolving to array of municipalities with code and name
 */
export async function loadMunicipalities(): Promise<
  Array<{ code: string; name: string }>
> {
  const geoUrl =
    (process.env.NODE_ENV === "production" ? "/data-blog" : "") +
    "/maps/belgium_municipalities.json"

  try {
    const response = await fetch(geoUrl)
    if (!response.ok) {
      throw new Error("Failed to fetch municipalities")
    }

    const geoData = await response.json()

    return geoData.features.map((feature: any) => ({
      code: String(feature.properties?.code ?? ""),
      name: String(feature.properties?.LAU_NAME ?? ""),
    }))
  } catch (error) {
    console.error("Failed to load municipalities:", error)
    return []
  }
}
