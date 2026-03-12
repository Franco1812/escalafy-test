import pool from './db'
import { Organization } from './types'

export async function getOrganizations(): Promise<Organization[]> {
  const { rows } = await pool.query('SELECT id, name FROM organization ORDER BY id ASC')
  return rows
}

export async function getOrganizationAccounts(orgId: number) {
  const { rows } = await pool.query(
    'SELECT meta_account_id, google_account_id, store_id FROM organization WHERE id = $1',
    [orgId]
  )
  if (rows.length === 0) throw new Error(`Organization ${orgId} not found`)
  return rows[0] as { meta_account_id: string; google_account_id: string; store_id: string }
}
