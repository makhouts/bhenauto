export type AutoScoutPublicationStatus = "Active" | "Inactive" | string;

export type AutoScoutCustomer = {
  id: string;
  sellId?: string;
  companyName?: string;
  externalId?: string;
  canSetMiaRequestedTier?: boolean;
  canUseSellOnline?: boolean;
};

export type AutoScoutListingSummary = {
  id: string;
  createdAt: string;
  lastUpdatedAt: string;
  offerReferenceId?: string;
  crossReferenceId?: string;
  vinEnrichmentStatus?: string;
  vinEnrichmentMissingFields?: string[];
};

export type AutoScoutImage = {
  id: string;
  previewUrl?: string;
  md5?: string;
};

export type AutoScoutReference = {
  id: string;
  name: string;
  referenceType: string;
  vehicleType?: string[];
  country?: string[];
};

export type AutoScoutModel = {
  id: number;
  name: string;
  vehicleType?: string;
};

export type AutoScoutMake = {
  id: number;
  name: string;
  models: AutoScoutModel[];
  vehicleTypes?: string[];
};

export type AutoScoutPrice = {
  price?: number;
  currency?: string;
  netPrice?: number;
  vatRate?: number;
  isNegotiable?: boolean;
  isTaxDeductible?: boolean;
};

export type AutoScoutListingPayload = {
  availability: {
    availabilityType: number;
    deliveryDays?: number;
    deliveryDate?: string;
  };
  make: number;
  model?: number;
  modelName?: string;
  modelVersion?: string;
  vehicleType: string;
  offerType: string;
  offerReferenceId?: string;
  crossReferenceId?: string;
  vin?: string;
  licencePlate?: string;
  mileage?: number;
  firstRegistrationDate?: string;
  productionYear?: string;
  power?: number;
  cylinderCapacity?: number;
  cylinderCount?: number;
  primaryFuelType?: number;
  additionalFuelTypes?: number[];
  fuelCategory?: string;
  isPluginHybrid?: boolean;
  transmission?: string;
  drivetrain?: string;
  bodyType?: number;
  bodyColor?: number;
  bodyColorName?: string;
  upholsteryColor?: number;
  upholsteryType?: string;
  doorCount?: number;
  seatCount?: number;
  co2Emissions?: number;
  consumption?: Record<string, unknown>;
  wltp?: Record<string, unknown>;
  euEmissionStandard?: string;
  description?: string;
  belgianCarpassMileageUrl?: string;
  equipment?: number[];
  condition?: Record<string, unknown>;
  hasWarranty?: boolean;
  warranty?: number;
  images?: Array<{ id: string }>;
  prices: {
    public: AutoScoutPrice;
    dealer?: AutoScoutPrice;
  };
  publication: {
    status: "Active" | "Inactive";
    channels: Array<{ id: "AS24" | "AS24Dealer" | "mobile_de" | "autoproff" | "autoproff_marketplace_public" }>;
  };
};

export type AutoScoutListing = {
  id: string;
  make: number;
  model?: number;
  modelVersion?: string;
  vehicleType?: string;
  offerType?: string;
  offerReferenceId?: string;
  crossReferenceId?: string;
  vin?: string;
  licencePlate?: string;
  mileage?: number;
  firstRegistrationDate?: string;
  constructionYear?: number;
  power?: number;
  cylinderCapacity?: number;
  cylinderCount?: number;
  primaryFuelType?: number;
  additionalFuelTypes?: number[];
  fuelCategory?: string;
  isPluginHybrid?: boolean;
  transmission?: string;
  drivetrain?: string;
  bodyType?: number;
  bodyColor?: number;
  bodyColorName?: string;
  upholsteryColor?: number;
  upholsteryType?: string;
  doorCount?: number;
  seatCount?: number;
  co2Emissions?: number;
  consumption?: Record<string, unknown>;
  wltp?: Record<string, unknown>;
  euEmissionStandard?: string;
  prices?: {
    public?: AutoScoutPrice;
    dealer?: AutoScoutPrice;
    manufacturersSuggestedRetail?: AutoScoutPrice;
  };
  publication?: {
    status?: AutoScoutPublicationStatus;
    channels?: Array<{
      id?: string;
      url?: string;
    }>;
  };
  availability?: Record<string, unknown>;
  description?: string;
  belgianCarpassMileageUrl?: string;
  equipment?: Array<number | string>;
  highlights?: string[];
  condition?: Record<string, unknown>;
  hasWarranty?: boolean;
  warranty?: number;
  warrantyUnit?: string;
  hasFullServiceHistory?: boolean;
  hasParticleFilter?: boolean;
  isMetallic?: boolean;
  isNonSmoking?: boolean;
  wasCabOrRental?: boolean;
  previousOwnerCount?: number;
  images?: AutoScoutImage[];
  [key: string]: unknown;
};

export type AutoScoutReferenceIndex = {
  getReferenceName: (referenceType: string, id: string | number | undefined | null) => string | null;
  getReferenceId: (referenceType: string, name: string | undefined | null) => string | null;
  getMakeName: (id: string | number | undefined | null) => string | null;
  getMakeId: (name: string | undefined | null) => string | null;
  getModelName: (makeId: string | number | undefined | null, modelId: string | number | undefined | null) => string | null;
  getModelId: (makeId: string | number | undefined | null, modelName: string | undefined | null) => string | null;
};

export type AutoScoutImportMode = "dry-run" | "apply";

export type AutoScoutMappedImage = {
  autoscoutImageId?: string;
  sourceUrl: string;
  sourceMd5?: string;
  sortOrder: number;
};

export type AutoScoutMappedCar = {
  autoscoutListingId: string;
  autoscoutCustomerId: string;
  externalSource: "autoscout24";
  externalListingId: string;
  importSource: "autoscout24";
  slugBase: string;
  isActive: boolean;
  images: AutoScoutMappedImage[];
  data: {
    slug: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    fuel_type: string;
    transmission: string;
    price: number;
    horsepower: number;
    color: string;
    description: string;
    sold: boolean;
    reserved: boolean;
    soldAt: Date | null;
    carpass_url: string | null;
    features: string[];
    externalSource: "autoscout24";
    externalListingId: string;
    importSource: "autoscout24";
    sourceOfTruth: string;
    autoscoutListingId: string;
    autoscoutCustomerId: string;
    autoscoutUrl: string | null;
    lastSyncedAt: Date;
    sourcePayload: unknown;
    sourcePayloadUpdatedAt: Date;
    vin: string | null;
    referenceNumber: string | null;
    crossReferenceId: string | null;
    licencePlate: string | null;
    version: string | null;
    makeCode: string | null;
    modelCode: string | null;
    bodyType: string | null;
    bodyTypeCode: string | null;
    vehicleType: string | null;
    vehicleTypeCode: string | null;
    offerTypeCode: string | null;
    availabilityTypeCode: string | null;
    fuelTypeCode: string | null;
    fuelCategory: string | null;
    additionalFuelTypeCodes: string[];
    isPluginHybrid: boolean | null;
    transmissionCode: string | null;
    drivetrain: string | null;
    drivetrainCode: string | null;
    powerKw: number | null;
    engineSize: number | null;
    cylinderCount: number | null;
    firstRegistrationDate: Date | null;
    firstRegistrationRaw: string | null;
    constructionYear: number | null;
    doors: number | null;
    seats: number | null;
    exteriorColor: string | null;
    exteriorColorCode: string | null;
    manufacturerColorName: string | null;
    interiorColor: string | null;
    interiorColorCode: string | null;
    upholstery: string | null;
    upholsteryCode: string | null;
    emissionClass: string | null;
    emissionClassCode: string | null;
    co2Emissions: number | null;
    consumptionCombined: number | null;
    consumption: unknown;
    wltp: unknown;
    priceCurrency: string;
    netPrice: number | null;
    vatRate: number | null;
    vatDeductible: boolean | null;
    priceNegotiable: boolean | null;
    warrantyMonths: number | null;
    warrantyText: string | null;
    hasWarranty: boolean | null;
    availabilityStatus: string | null;
    publicationStatus: string | null;
    equipmentCodes: string[];
    equipment: unknown;
    technicalData: unknown;
  };
};
