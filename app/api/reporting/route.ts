import { NextRequest, NextResponse } from 'next/server'
import { getReport } from '@/lib/reporting'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const orgId = searchParams.get('orgId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const metricsParam = searchParams.get('metrics')

  if (!orgId || !startDate || !endDate || !metricsParam) {
    return NextResponse.json(
      { error: 'Missing required params: orgId, startDate, endDate, metrics' },
      { status: 400 }
    )
  }

  const metrics = metricsParam.split(',').map((m) => m.trim())

  try {
    const result = await getReport({
      orgId: parseInt(orgId),
      startDate,
      endDate,
      metrics,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
