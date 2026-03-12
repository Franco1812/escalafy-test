import { describe, it, expect } from 'vitest'
import { computeRow, resolveRequiredRaw } from './metrics'

describe('resolveRequiredRaw', () => {
  it('devuelve las métricas raw directamente', () => {
    const result = resolveRequiredRaw(['revenue', 'meta_spend'])
    expect(result).toContain('revenue')
    expect(result).toContain('meta_spend')
  })

  it('resuelve dependencias de métricas derivadas', () => {
    const result = resolveRequiredRaw(['roas'])
    expect(result).toContain('revenue')
    expect(result).toContain('meta_spend')
    expect(result).toContain('google_spend')
  })

  it('resuelve dependencias de métricas calculadas', () => {
    const result = resolveRequiredRaw(['meta_cpm'])
    expect(result).toContain('meta_spend')
    expect(result).toContain('meta_impressions')
  })

  it('no duplica dependencias compartidas', () => {
    const result = resolveRequiredRaw(['profit', 'roas'])
    const metaSpendCount = result.filter((m) => m === 'meta_spend').length
    expect(metaSpendCount).toBe(1)
  })
})

describe('computeRow', () => {
  const base = {
    meta_spend: 400,
    meta_impressions: 200000,
    google_spend: 200,
    google_impressions: 100000,
    revenue: 3000,
    orders: 10,
    fees: 150,
  }

  it('calcula profit correctamente', () => {
    const { profit } = computeRow(base, ['profit'])

    expect(profit).toBe(2250)
  })

  it('calcula roas correctamente', () => {
    const { roas } = computeRow(base, ['roas'])

    expect(roas).toBe(5)
  })

  it('calcula meta_cpm correctamente', () => {
    const { meta_cpm } = computeRow(base, ['meta_cpm'])

    expect(meta_cpm).toBe(2)
  })

  it('calcula average_order_value correctamente', () => {
    const { average_order_value } = computeRow(base, ['average_order_value'])

    expect(average_order_value).toBe(300)
  })

  it('retorna 0 para roas cuando no hay spend', () => {
    const { roas } = computeRow({ ...base, meta_spend: 0, google_spend: 0 }, ['roas'])
    expect(roas).toBe(0)
  })

  it('solo retorna las métricas solicitadas', () => {
    const result = computeRow(base, ['revenue', 'profit'])
    expect(Object.keys(result)).toEqual(['revenue', 'profit'])
  })
})
