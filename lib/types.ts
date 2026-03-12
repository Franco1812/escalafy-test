export type ReportingParams = {
  orgId: number
  startDate: string
  endDate: string
  metrics: string[]
}

export type DailyRow = {
  date: string
  [key: string]: number | string
}

export type ReportingResult = {
  totals: Record<string, number>
  daily: DailyRow[]
}

export type Organization = {
  id: number
  name: string
}
