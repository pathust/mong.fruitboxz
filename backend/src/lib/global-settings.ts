import type SiteModuleService from "../modules/site/service"

export type GlobalSettings = Record<string, unknown>

export async function getGlobalSettings(siteService: SiteModuleService): Promise<GlobalSettings> {
  const [rows] = await siteService.listAndCountSiteSettings({ key: "global" })
  const value = rows?.[0]?.value
  return value && typeof value === "object" ? value as GlobalSettings : {}
}

export async function updateGlobalSettings(
  siteService: SiteModuleService,
  updates: GlobalSettings
): Promise<GlobalSettings> {
  const [rows] = await siteService.listAndCountSiteSettings({ key: "global" })
  const existing = rows?.[0]?.value && typeof rows[0].value === "object"
    ? rows[0].value as GlobalSettings
    : {}
  const merged = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (rows?.[0]) {
    await siteService.updateSiteSettings({ id: rows[0].id, value: merged })
  } else {
    await siteService.createSiteSettings({ key: "global", value: merged })
  }

  return merged
}
