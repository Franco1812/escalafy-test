export const RAW_METRICS = [
  'meta_spend',
  'meta_impressions',
  'google_spend',
  'google_impressions',
  'revenue',
  'orders',
  'fees',
] as const

export const CALCULATED_METRICS = ['meta_cpm', 'google_cpm', 'average_order_value'] as const
export const DERIVED_METRICS = ['total_spend', 'profit', 'roas'] as const

export const ALL_METRICS = [...RAW_METRICS, ...CALCULATED_METRICS, ...DERIVED_METRICS]

export const DEPENDENCIES: Record<string, string[]> = {
  meta_cpm: ['meta_spend', 'meta_impressions'],
  google_cpm: ['google_spend', 'google_impressions'],
  average_order_value: ['revenue', 'orders'],
  total_spend: ['meta_spend', 'google_spend'],
  profit: ['revenue', 'meta_spend', 'google_spend', 'fees'],
  roas: ['revenue', 'meta_spend', 'google_spend'],
}

export function resolveRequiredRaw(metrics: string[]): string[] {
  const required = new Set<string>()
  for (const m of metrics) {
    if ((RAW_METRICS as readonly string[]).includes(m)) {
      required.add(m)
    } else if (DEPENDENCIES[m]) {
      for (const dep of DEPENDENCIES[m]) required.add(dep)
    }
  }
  return [...required]
}

export function computeRow(raw: Record<string, number>, metrics: string[]): Record<string, number> {
  const meta_spend = raw.meta_spend ?? 0
  const meta_impressions = raw.meta_impressions ?? 0
  const google_spend = raw.google_spend ?? 0
  const google_impressions = raw.google_impressions ?? 0
  const revenue = raw.revenue ?? 0
  const orders = raw.orders ?? 0
  const fees = raw.fees ?? 0
  const total_spend = meta_spend + google_spend

  const computed: Record<string, number> = {
    ...raw,
    meta_cpm: meta_impressions > 0 ? (meta_spend / meta_impressions) * 1000 : 0,
    google_cpm: google_impressions > 0 ? (google_spend / google_impressions) * 1000 : 0,
    average_order_value: orders > 0 ? revenue / orders : 0,
    total_spend,
    profit: revenue - meta_spend - google_spend - fees,
    roas: total_spend > 0 ? revenue / total_spend : 0,
  }

  const result: Record<string, number> = {}
  for (const m of metrics) {
    if (m in computed) result[m] = Number(computed[m].toFixed(2))
  }
  return result
}
