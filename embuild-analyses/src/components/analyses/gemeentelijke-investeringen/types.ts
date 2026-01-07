export interface InvestmentByDomain {
  year: number
  municipality: string
  domain_code: string
  domain_name: string
  subdomain_code: string | null
  subdomain_name: string | null
  value: number
  metric: 'total' | 'per_capita'
}

export interface InvestmentByCategory {
  year: number
  municipality: string
  category: string | null
  category_l1: string | null
  value: number
  metric: 'total' | 'per_capita'
}

export interface Lookups {
  domains: Array<{
    domain_code: string
    domain_name: string
  }>
  subdomains: Array<{
    subdomain_code: string
    subdomain_name: string
    domain_code: string
  }>
  cost_categories_niveau1: string[]
  years: number[]
}

export interface Metadata {
  latest_year: number
  latest_date: string
  bv_latest_year: number
  kostenpost_latest_year: number
  total_municipalities: number
  kostenpost_municipalities?: number
  bv_records: number
  kostenpost_records: number
  is_kostenpost_truncated?: boolean
}
