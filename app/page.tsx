import { getReport } from '@/lib/reporting'
import { getOrganizations } from '@/lib/organizations'
import DashboardClient from './components/DashboardClient'

export default async function Home() {
  const [initialData, organizations] = await Promise.all([
    getReport({
      orgId: 1,
      startDate: '2026-02-09',
      endDate: '2026-03-10',
      metrics: ['revenue', 'meta_spend', 'google_spend', 'profit', 'roas'],
    }),
    getOrganizations(),
  ])

  return <DashboardClient initialData={initialData} organizations={organizations} />
}
