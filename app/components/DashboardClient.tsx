'use client'

import { useState } from 'react'
import { ReportingResult, Organization } from '@/lib/types'
import { ALL_METRICS } from '@/lib/metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const DEFAULT_START = '2026-02-09'
const DEFAULT_END = '2026-03-10'
const DEFAULT_METRICS = ['revenue', 'meta_spend', 'google_spend', 'profit', 'roas']

const METRIC_LABELS: Record<string, string> = {
  meta_spend: 'Meta Spend',
  meta_impressions: 'Meta Impressions',
  google_spend: 'Google Spend',
  google_impressions: 'Google Impressions',
  revenue: 'Revenue',
  orders: 'Orders',
  fees: 'Fees',
  meta_cpm: 'Meta CPM',
  google_cpm: 'Google CPM',
  average_order_value: 'Avg Order Value',
  total_spend: 'Total Spend',
  profit: 'Profit',
  roas: 'ROAS',
}

function formatValue(metric: string, value: number): string {
  if (['meta_impressions', 'google_impressions', 'orders'].includes(metric)) {
    return value.toLocaleString()
  }
  if (metric === 'roas') return `${value.toFixed(2)}x`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type Props = {
  initialData: ReportingResult
  organizations: Organization[]
}

export default function DashboardClient({ initialData, organizations }: Props) {
  const [data, setData] = useState<ReportingResult>(initialData)
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? 1)
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchData(org: number, start: string, end: string, metrics: string[]) {
    if (!metrics.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/reporting?orgId=${org}&startDate=${start}&endDate=${end}&metrics=${metrics.join(',')}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener los datos')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleOrgChange(value: string) {
    const id = parseInt(value)
    setOrgId(id)
    fetchData(id, startDate, endDate, selectedMetrics)
  }

  function handleDateChange(start: string, end: string) {
    setStartDate(start)
    setEndDate(end)
    fetchData(orgId, start, end, selectedMetrics)
  }

  function toggleMetric(metric: string) {
    const next = selectedMetrics.includes(metric)
      ? selectedMetrics.filter((m) => m !== metric)
      : [...selectedMetrics, metric]
    setSelectedMetrics(next)
    fetchData(orgId, startDate, endDate, next)
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Reporting Dashboard</h1>
        {loading && <span className="text-sm text-muted-foreground">Loading...</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 items-start">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Organization</label>
              <Select value={String(orgId)} onValueChange={handleOrgChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, endDate)}
                className="block border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(startDate, e.target.value)}
                className="block border rounded-md px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium">Metrics</label>
              <div className="flex flex-wrap gap-2">
                {ALL_METRICS.map((m) => (
                  <Badge
                    key={m}
                    variant={selectedMetrics.includes(m) ? 'default' : 'outline'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleMetric(m)}
                  >
                    {METRIC_LABELS[m] ?? m}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {selectedMetrics.map((metric) => (
            <Card key={metric}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {METRIC_LABELS[metric] ?? metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {data.totals[metric] !== undefined
                    ? formatValue(metric, data.totals[metric])
                    : '—'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {selectedMetrics.map((m) => (
                    <TableHead key={m} className="text-right">
                      {METRIC_LABELS[m] ?? m}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    {selectedMetrics.map((m) => (
                      <TableCell key={m} className="text-right">
                        {row[m] !== undefined ? formatValue(m, row[m] as number) : '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
