export type ServiceType = "FixedService" | "Utility" | "Management" | "Amenity" | "Optional";
export type BillingMethod = "Fixed" | "PerPerson" | "PerRoom" | "PerUnit" | "PerM2" | "Usage";

export interface Service {
  serviceId: number;
  serviceName: string;
  serviceCode: string;
  serviceType: ServiceType;
  unit: string;
  billingMethod: BillingMethod;
  description?: string;
  isActive: boolean;
  currentPrice: number;
  currentPriceEffectiveFrom: string;
}

export interface ServicePriceHistory {
  priceHistoryId: number;
  serviceId: number;
  price: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  setByName: string;
  reason: string;
  isActive: boolean;
}

export interface CreateServiceDto {
  serviceName: string;
  serviceCode: string;
  serviceType: ServiceType;
  unit: string;
  billingMethod: BillingMethod;
  description?: string;
  isActive: boolean;
  initialPrice: number;
  priceEffectiveFrom: string;
  priceReason: string;
}

export interface UpdateServiceDto {
  serviceName: string;
  serviceType: ServiceType;
  unit: string;
  billingMethod: BillingMethod;
  description?: string;
  isActive: boolean;
}

export interface UpdateServicePriceDto {
  newPrice: number;
  effectiveFrom: string;
  reason: string;
}

export interface ServiceFilter {
  serviceType?: ServiceType;
  isActive?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
