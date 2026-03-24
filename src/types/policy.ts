export interface ElectricityTier {
  tierId?: number
  fromKwh: number
  toKwh: number | null       // null = không giới hạn (bậc cuối)
  unitPrice: number          // VND/kWh chưa VAT
  unitPriceWithVat: number   // VND/kWh đã VAT
  note?: string
}

export interface ElectricityPolicy {
  policyId: number
  policyName: string
  effectiveFrom: string      // ISO date string
  effectiveTo: string | null // null = đang hiệu lực
  legalReference?: string
  vatRate: number            // 0-100
  tiers: ElectricityTier[]
  isActive: boolean          // effectiveTo === null
}

export interface WaterTier {
  tierId?: number
  fromM3: number
  toM3: number | null
  unitPrice: number
  unitPriceWithVat: number
  note?: string
}

export interface WaterPolicy {
  policyId: number
  policyName: string
  effectiveFrom: string
  effectiveTo: string | null
  legalReference?: string
  vatRate: number
  zoneName: string
  environmentFee: number
  maintenanceFee: number
  tiers: WaterTier[]
  isActive: boolean
}

export interface CreateElectricityPolicyDto {
  policyName: string
  effectiveFrom: string
  legalReference?: string
  vatRate: number
  tiers: Omit<ElectricityTier, 'tierId'>[]
}

export interface CreateWaterPolicyDto {
  policyName: string
  effectiveFrom: string
  legalReference?: string
  vatRate: number
  zoneName: string
  environmentFee: number
  maintenanceFee: number
  tiers: Omit<WaterTier, 'tierId'>[]
}

export interface TierPreviewResult {
  tierBreakdowns: {
    tier: number
    from: number
    to: number | null
    usage: number
    unitPrice: number
    amount: number
  }[]
  subtotal: number
  vat: number
  total: number
}
