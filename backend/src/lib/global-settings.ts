export async function getGlobalSettings(siteService: any) {
  const [rows] = await siteService.listAndCountSiteSettings({ key: "global" })
  return rows?.[0]?.value || {}
}

export async function updateGlobalSettings(siteService: any, updates: Record<string, any>) {
  const [rows] = await siteService.listAndCountSiteSettings({ key: "global" })
  const existing = rows?.[0]?.value || {}
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
