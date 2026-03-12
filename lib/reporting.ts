import pool from './db'
import { ALL_METRICS, resolveRequiredRaw, computeRow } from './metrics'
import { getOrganizationAccounts } from './organizations'
import { ReportingParams, ReportingResult, DailyRow } from './types'

export type { ReportingParams, ReportingResult, DailyRow }

export async function getReport(params: ReportingParams): Promise<ReportingResult> {
  const { orgId, startDate, endDate, metrics } = params

  const validMetrics = metrics.filter((m) => ALL_METRICS.includes(m as never))
  const requiredRaw = resolveRequiredRaw(validMetrics)

  const { meta_account_id, google_account_id, store_id } = await getOrganizationAccounts(orgId)

  const query = `
    SELECT
      d.date::text,
      COALESCE(m.spend, 0)       AS meta_spend,
      COALESCE(m.impressions, 0) AS meta_impressions,
      COALESCE(g.spend, 0)       AS google_spend,
      COALESCE(g.impressions, 0) AS google_impressions,
      COALESCE(s.revenue, 0)     AS revenue,
      COALESCE(s.orders, 0)      AS orders,
      COALESCE(s.fees, 0)        AS fees
    FROM (
      SELECT DISTINCT date FROM meta_ads_data   WHERE account_id = $1 AND date BETWEEN $4 AND $5
      UNION
      SELECT DISTINCT date FROM google_ads_data WHERE account_id = $2 AND date BETWEEN $4 AND $5
      UNION
      SELECT DISTINCT date FROM store_data      WHERE store_id   = $3 AND date BETWEEN $4 AND $5
    ) d
    LEFT JOIN meta_ads_data   m ON m.account_id = $1 AND m.date = d.date
    LEFT JOIN google_ads_data g ON g.account_id = $2 AND g.date = d.date
    LEFT JOIN store_data      s ON s.store_id   = $3 AND s.date = d.date
    ORDER BY d.date ASC
  `

  const { rows } = await pool.query(query, [
    meta_account_id,
    google_account_id,
    store_id,
    startDate,
    endDate,
  ])

  const daily: DailyRow[] = rows.map((row) => {
    const raw: Record<string, number> = {}
    for (const key of requiredRaw) raw[key] = parseFloat(row[key]) || 0
    return { date: row.date, ...computeRow(raw, validMetrics) }
  })

  const totalRaw: Record<string, number> = {}
  for (const key of requiredRaw) {
    totalRaw[key] = rows.reduce((sum, row) => sum + (parseFloat(row[key]) || 0), 0)
  }
  const totals = computeRow(totalRaw, validMetrics)

  return { totals, daily }
}
