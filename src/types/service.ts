export type ServiceType = "Utility" | "Management" | "Amenity" | "Optional"
export type BillingMethod = "Fixed" | "PerPerson" | "PerM2" | "Usage"

export interface Service {
  serviceId: number
  serviceName: string
  serviceCode: string        // UNIQUE, format SVC-XXXX
  serviceType: ServiceType
  unit: string               // "người/tháng" | "m2" | "KW" | "lần" | "tháng"
  billingMethod: BillingMethod
  description?: string
  isActive: boolean
  currentPrice: number       // lấy từ ServicePriceHistory latest — RULE-08
  currentPriceEffectiveFrom: string
}

export interface ServicePriceHistory {
  priceHistoryId: number
  serviceId: number
  price: number
  effectiveFrom: string      // ISO date
  effectiveTo: string | null // null = đang hiệu lực
  setByName: string
  reason: string
  isActive: boolean          // effectiveTo === null
}

export interface CreateServiceDto {
  serviceName: string
  serviceCode: string
  serviceType: ServiceType
  unit: string
  billingMethod: BillingMethod
  description?: string
  isActive: boolean
  initialPrice: number
  priceEffectiveFrom: string
  priceReason: string
}

export interface UpdateServiceDto {
  serviceName: string
  serviceType: ServiceType
  unit: string
  billingMethod: BillingMethod
  description?: string
  isActive: boolean
}

export interface UpdateServicePriceDto {
  newPrice: number
  effectiveFrom: string
  reason: string
}

export interface ServiceFilter {
  serviceType?: ServiceType
  isActive?: boolean
  search?: string
  page: number
  limit: number
  sortBy?: string
  sortDir?: "asc" | "desc"
}
