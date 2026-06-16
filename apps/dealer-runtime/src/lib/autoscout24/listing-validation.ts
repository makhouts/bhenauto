export type AutoScoutValidationField =
  | "makeCode"
  | "modelCode"
  | "vehicleTypeCode"
  | "offerTypeCode"
  | "availabilityTypeCode"
  | "firstRegistrationRaw"
  | "constructionYear"
  | "bodyTypeCode"
  | "fuelCategory"
  | "fuelTypeCode"
  | "transmissionCode"
  | "price"
  | "mileage"
  | "powerKw"
  | "engineSize"
  | "cylinderCount"
  | "doors"
  | "seats"
  | "manufacturerColorName"
  | "description"
  | "referenceNumber"
  | "crossReferenceId"
  | "version"
  | "vin"
  | "licencePlate"
  | "netPrice"
  | "vatRate"
  | "warrantyMonths"
  | "hasWarranty"
  | "equipmentCodes"
  | "images";

export type AutoScoutValidationIssueCode =
  | "required"
  | "invalid-format"
  | "minimum"
  | "maximum"
  | "max-length"
  | "exact-length"
  | "invalid-content"
  | "invalid-date-range"
  | "net-price-below-gross"
  | "vat-decimals"
  | "warranty-inconsistent"
  | "plugin-fuels"
  | "plugin-category"
  | "equipment-climate-conflict"
  | "equipment-sliding-door-conflict"
  | "delivery-details-required";

export type AutoScoutValidationIssue = {
  field: AutoScoutValidationField;
  code: AutoScoutValidationIssueCode;
  message: {
    nl: string;
    fr: string;
  };
};

export type AutoScoutValidationValues = {
  makeCode?: unknown;
  modelCode?: unknown;
  vehicleTypeCode?: unknown;
  offerTypeCode?: unknown;
  availabilityTypeCode?: unknown;
  firstRegistrationRaw?: unknown;
  constructionYear?: unknown;
  bodyTypeCode?: unknown;
  fuelCategory?: unknown;
  fuelTypeCode?: unknown;
  additionalFuelTypeCodes?: unknown;
  isPluginHybrid?: unknown;
  transmissionCode?: unknown;
  price?: unknown;
  mileage?: unknown;
  powerKw?: unknown;
  engineSize?: unknown;
  cylinderCount?: unknown;
  doors?: unknown;
  seats?: unknown;
  manufacturerColorName?: unknown;
  description?: unknown;
  referenceNumber?: unknown;
  crossReferenceId?: unknown;
  version?: unknown;
  vin?: unknown;
  licencePlate?: unknown;
  netPrice?: unknown;
  vatRate?: unknown;
  warrantyMonths?: unknown;
  hasWarranty?: unknown;
  equipmentCodes?: unknown;
  imageCount?: unknown;
  deliveryDays?: unknown;
  deliveryDate?: unknown;
};

type AdminLocale = "nl" | "fr";

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = text(value).replace(/\s/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map(text).filter(Boolean)
    : [];
}

function isBlank(value: unknown) {
  return text(value) === "";
}

function issue(
  field: AutoScoutValidationField,
  code: AutoScoutValidationIssueCode,
  nl: string,
  fr: string,
): AutoScoutValidationIssue {
  return { field, code, message: { nl, fr } };
}

function addRequired(
  issues: AutoScoutValidationIssue[],
  field: AutoScoutValidationField,
  value: unknown,
  nl: string,
  fr: string,
) {
  if (isBlank(value)) issues.push(issue(field, "required", nl, fr));
}

function addIntegerRange(
  issues: AutoScoutValidationIssue[],
  field: AutoScoutValidationField,
  value: unknown,
  min: number,
  max: number,
  label: { nl: string; fr: string },
  required = false,
) {
  if (isBlank(value)) {
    if (required) {
      issues.push(issue(
        field,
        "required",
        `${label.nl} is verplicht voor AutoScout24.`,
        `${label.fr} est obligatoire pour AutoScout24.`,
      ));
    }
    return;
  }

  const parsed = number(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    issues.push(issue(
      field,
      "invalid-format",
      `${label.nl} moet een geheel getal zijn.`,
      `${label.fr} doit être un nombre entier.`,
    ));
    return;
  }
  if (parsed < min) {
    issues.push(issue(
      field,
      "minimum",
      `${label.nl} moet minstens ${min} zijn.`,
      `${label.fr} doit être au moins ${min}.`,
    ));
  } else if (parsed > max) {
    issues.push(issue(
      field,
      "maximum",
      `${label.nl} mag maximaal ${max} zijn.`,
      `${label.fr} ne peut pas dépasser ${max}.`,
    ));
  }
}

function addMaxLength(
  issues: AutoScoutValidationIssue[],
  field: AutoScoutValidationField,
  value: unknown,
  max: number,
  label: { nl: string; fr: string },
) {
  const normalized = text(value);
  if (normalized.length <= max) return;
  issues.push(issue(
    field,
    "max-length",
    `${label.nl} mag maximaal ${max} tekens bevatten.`,
    `${label.fr} ne peut pas dépasser ${max} caractères.`,
  ));
}

function addForbiddenContent(
  issues: AutoScoutValidationIssue[],
  field: AutoScoutValidationField,
  value: unknown,
  label: { nl: string; fr: string },
  options: { forbidUrls?: boolean } = {},
) {
  const normalized = text(value);
  if (!normalized) return;
  const hasEmail = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(normalized);
  const hasUrl = options.forbidUrls && /(?:https?:\/\/|www\.)/i.test(normalized);
  if (!hasEmail && !hasUrl && !/[<>]/.test(normalized)) return;
  issues.push(issue(
    field,
    "invalid-content",
    `${label.nl} mag geen e-mailadres${options.forbidUrls ? ", URL" : ""} of < > bevatten.`,
    `${label.fr} ne peut pas contenir d'adresse e-mail${options.forbidUrls ? ", d'URL" : ""} ni < >.`,
  ));
}

export function getAutoScoutValidationMessage(
  issueValue: AutoScoutValidationIssue,
  locale: AdminLocale = "nl",
) {
  return issueValue.message[locale];
}

export function groupAutoScoutValidationIssues(issues: AutoScoutValidationIssue[]) {
  return issues.reduce<Partial<Record<AutoScoutValidationField, AutoScoutValidationIssue[]>>>(
    (grouped, current) => {
      grouped[current.field] = [...(grouped[current.field] ?? []), current];
      return grouped;
    },
    {},
  );
}

export function validateAutoScoutListingValues(values: AutoScoutValidationValues) {
  const issues: AutoScoutValidationIssue[] = [];
  const vehicleType = text(values.vehicleTypeCode);
  const offerType = text(values.offerTypeCode);
  const fuelCategory = text(values.fuelCategory);
  const fuelTypes = [
    text(values.fuelTypeCode),
    ...stringArray(values.additionalFuelTypeCodes),
  ].filter(Boolean);
  const equipmentCodes = new Set(stringArray(values.equipmentCodes));

  addRequired(issues, "makeCode", values.makeCode, "Merk is verplicht voor AutoScout24.", "La marque est obligatoire pour AutoScout24.");
  if (vehicleType === "C" || vehicleType === "B") {
    addRequired(issues, "modelCode", values.modelCode, "Model is verplicht voor AutoScout24.", "Le modèle est obligatoire pour AutoScout24.");
  }
  addRequired(issues, "vehicleTypeCode", values.vehicleTypeCode, "Voertuigtype is verplicht voor AutoScout24.", "Le type de véhicule est obligatoire pour AutoScout24.");
  addRequired(issues, "offerTypeCode", values.offerTypeCode, "Aanbodtype is verplicht voor AutoScout24.", "Le type d'offre est obligatoire pour AutoScout24.");
  addRequired(issues, "availabilityTypeCode", values.availabilityTypeCode, "Beschikbaarheid is verplicht voor AutoScout24.", "La disponibilité est obligatoire pour AutoScout24.");
  addRequired(issues, "bodyTypeCode", values.bodyTypeCode, "Koetswerktype is verplicht voor AutoScout24.", "La carrosserie est obligatoire pour AutoScout24.");
  addRequired(issues, "fuelCategory", values.fuelCategory, "Brandstofcategorie is verplicht voor AutoScout24.", "La catégorie de carburant est obligatoire pour AutoScout24.");
  addRequired(issues, "transmissionCode", values.transmissionCode, "Transmissie is verplicht voor AutoScout24.", "La transmission est obligatoire pour AutoScout24.");

  const firstRegistration = text(values.firstRegistrationRaw);
  if (["U", "J", "S", "O"].includes(offerType)) {
    addRequired(
      issues,
      "firstRegistrationRaw",
      firstRegistration,
      "Eerste inschrijving is verplicht voor dit aanbodtype.",
      "La première immatriculation est obligatoire pour ce type d'offre.",
    );
  }
  if (firstRegistration && !/^\d{4}-(0[1-9]|1[0-2])$/.test(firstRegistration)) {
    issues.push(issue(
      "firstRegistrationRaw",
      "invalid-format",
      "Eerste inschrijving moet maand en jaar bevatten.",
      "La première immatriculation doit contenir le mois et l'année.",
    ));
  } else if (firstRegistration) {
    const [year, month] = firstRegistration.split("-").map(Number);
    const registrationMonth = year * 12 + month;
    const now = new Date();
    const currentMonth = now.getFullYear() * 12 + now.getMonth() + 1;
    const ageInMonths = currentMonth - registrationMonth;
    if (year < 1886) {
      issues.push(issue("firstRegistrationRaw", "invalid-date-range", "Eerste inschrijving kan niet vóór 1886 liggen.", "La première immatriculation ne peut pas être antérieure à 1886."));
    } else if (ageInMonths < 0) {
      issues.push(issue("firstRegistrationRaw", "invalid-date-range", "Eerste inschrijving kan niet in de toekomst liggen.", "La première immatriculation ne peut pas être dans le futur."));
    } else if (offerType === "J" && ageInMonths > 24) {
      issues.push(issue("firstRegistrationRaw", "invalid-date-range", "Voor een jaarwagen moet de eerste inschrijving binnen de laatste 24 maanden liggen.", "Pour un véhicule de collaborateur, la première immatriculation doit dater des 24 derniers mois."));
    } else if (offerType === "S" && ageInMonths > 12) {
      issues.push(issue("firstRegistrationRaw", "invalid-date-range", "Voor een vooringeschreven voertuig mag de eerste inschrijving maximaal 12 maanden oud zijn.", "Pour un véhicule pré-immatriculé, la première immatriculation ne peut pas dater de plus de 12 mois."));
    } else if (offerType === "O" && ageInMonths < 360) {
      issues.push(issue("firstRegistrationRaw", "invalid-date-range", "Voor een oldtimer moet de eerste inschrijving minstens 30 jaar oud zijn.", "Pour un véhicule ancien, la première immatriculation doit dater d'au moins 30 ans."));
    }
  }

  const productionYear = text(values.constructionYear);
  if (!/^\d{4}$/.test(productionYear)) {
    issues.push(issue(
      "constructionYear",
      "invalid-format",
      "Productiejaar moet vier cijfers bevatten.",
      "L'année de production doit contenir quatre chiffres.",
    ));
  } else {
    const productionYearNumber = Number(productionYear);
    if (productionYearNumber < 1886 || productionYearNumber > new Date().getFullYear() + 2) {
      issues.push(issue(
        "constructionYear",
        "invalid-date-range",
        `Productiejaar moet tussen 1886 en ${new Date().getFullYear() + 2} liggen.`,
        `L'année de production doit être comprise entre 1886 et ${new Date().getFullYear() + 2}.`,
      ));
    }
  }

  addIntegerRange(issues, "price", values.price, 1, Number.MAX_SAFE_INTEGER, { nl: "Prijs", fr: "Le prix" }, true);
  addIntegerRange(issues, "mileage", values.mileage, 0, Number.MAX_SAFE_INTEGER, { nl: "Kilometerstand", fr: "Le kilométrage" }, true);
  addIntegerRange(issues, "powerKw", values.powerKw, 1, 9999, { nl: "Vermogen", fr: "La puissance" }, true);
  addIntegerRange(issues, "engineSize", values.engineSize, 1, 99999, { nl: "Cilinderinhoud", fr: "La cylindrée" });
  addIntegerRange(issues, "cylinderCount", values.cylinderCount, 1, 99, { nl: "Aantal cilinders", fr: "Le nombre de cylindres" });
  addIntegerRange(issues, "doors", values.doors, 1, 9, { nl: "Aantal deuren", fr: "Le nombre de portes" });
  addIntegerRange(issues, "seats", values.seats, 1, 99, { nl: "Aantal zitplaatsen", fr: "Le nombre de places" });
  addIntegerRange(issues, "warrantyMonths", values.warrantyMonths, 0, 999, { nl: "Garantie", fr: "La garantie" });

  const mileage = number(values.mileage);
  if (offerType === "N" && mileage !== null && mileage >= 1000) {
    issues.push(issue(
      "mileage",
      "maximum",
      "Een nieuw voertuig moet minder dan 1.000 km hebben.",
      "Un véhicule neuf doit avoir moins de 1 000 km.",
    ));
  }

  const vatRate = number(values.vatRate);
  if (vatRate !== null) {
    if (vatRate < 0 || vatRate > 100) {
      issues.push(issue(
        "vatRate",
        vatRate < 0 ? "minimum" : "maximum",
        "BTW-percentage moet tussen 0 en 100 liggen.",
        "Le taux de TVA doit être compris entre 0 et 100.",
      ));
    } else if (Math.round(vatRate * 10) !== vatRate * 10) {
      issues.push(issue(
        "vatRate",
        "vat-decimals",
        "BTW-percentage mag maximaal één decimaal bevatten.",
        "Le taux de TVA ne peut contenir qu'une seule décimale.",
      ));
    }
  }

  const grossPrice = number(values.price);
  const netPrice = number(values.netPrice);
  if (netPrice !== null) {
    if (netPrice < 1) {
      issues.push(issue("netPrice", "minimum", "Netto prijs moet minstens 1 zijn.", "Le prix net doit être au moins égal à 1."));
    } else if (grossPrice !== null && netPrice >= grossPrice) {
      issues.push(issue(
        "netPrice",
        "net-price-below-gross",
        "Netto prijs moet lager zijn dan de verkoopprijs.",
        "Le prix net doit être inférieur au prix de vente.",
      ));
    }
  }

  const warrantyMonths = number(values.warrantyMonths);
  const hasWarranty = values.hasWarranty === true || values.hasWarranty === "true" || values.hasWarranty === "on";
  if ((warrantyMonths !== null && warrantyMonths > 0 && !hasWarranty) || (hasWarranty && (!warrantyMonths || warrantyMonths <= 0))) {
    issues.push(issue(
      "hasWarranty",
      "warranty-inconsistent",
      "Vink garantie aan en vul een aantal maanden groter dan 0 in, of laat beide leeg.",
      "Cochez la garantie et saisissez un nombre de mois supérieur à 0, ou laissez les deux champs vides.",
    ));
  }

  const vin = text(values.vin);
  if (vin && vin.length !== 17) {
    issues.push(issue("vin", "exact-length", "Chassisnummer moet exact 17 tekens bevatten.", "Le numéro de châssis doit contenir exactement 17 caractères."));
  }
  addMaxLength(issues, "licencePlate", values.licencePlate, 10, { nl: "Nummerplaat", fr: "La plaque" });
  addMaxLength(issues, "manufacturerColorName", values.manufacturerColorName, 30, { nl: "Fabriekskleur", fr: "La couleur constructeur" });
  addMaxLength(issues, "description", values.description, 10000, { nl: "Beschrijving", fr: "La description" });
  addMaxLength(issues, "referenceNumber", values.referenceNumber, 50, { nl: "Referentienummer", fr: "La référence annonce" });
  addMaxLength(issues, "crossReferenceId", values.crossReferenceId, 50, { nl: "Interne referentie", fr: "La référence interne" });
  addMaxLength(issues, "version", values.version, 121, { nl: "Uitvoering", fr: "La version" });
  addForbiddenContent(issues, "referenceNumber", values.referenceNumber, { nl: "Referentienummer", fr: "La référence annonce" }, { forbidUrls: true });
  addForbiddenContent(issues, "crossReferenceId", values.crossReferenceId, { nl: "Interne referentie", fr: "La référence interne" }, { forbidUrls: true });
  addForbiddenContent(issues, "version", values.version, { nl: "Uitvoering", fr: "La version" });
  addForbiddenContent(issues, "vin", values.vin, { nl: "Chassisnummer", fr: "Le numéro de châssis" });
  addForbiddenContent(issues, "licencePlate", values.licencePlate, { nl: "Nummerplaat", fr: "La plaque" });

  if (values.isPluginHybrid === true || values.isPluginHybrid === "true" || values.isPluginHybrid === "on") {
    if (!fuelTypes.includes("12") || !fuelTypes.some((fuelType) => fuelType !== "12")) {
      issues.push(issue(
        "fuelTypeCode",
        "plugin-fuels",
        "Plug-in hybride vereist elektriciteit en minstens één bijkomend niet-elektrisch brandstoftype.",
        "Un hybride rechargeable nécessite l'électricité et au moins un carburant supplémentaire non électrique.",
      ));
    }
    if (!["2", "3", "O"].includes(fuelCategory)) {
      issues.push(issue(
        "fuelCategory",
        "plugin-category",
        "Plug-in hybride vereist brandstofcategorie Elektrisch/Benzine, Elektrisch/Diesel of Overige.",
        "Un hybride rechargeable nécessite la catégorie Électrique/Essence, Électrique/Diesel ou Autre.",
      ));
    }
  }

  const climateCodes = ["30", "241", "242", "243"].filter((code) => equipmentCodes.has(code));
  if (climateCodes.length > 1) {
    issues.push(issue(
      "equipmentCodes",
      "equipment-climate-conflict",
      "Kies slechts één automatische klimaatregeling.",
      "Sélectionnez une seule climatisation automatique.",
    ));
  }
  if (equipmentCodes.has("152") && (equipmentCodes.has("244") || equipmentCodes.has("245"))) {
    issues.push(issue(
      "equipmentCodes",
      "equipment-sliding-door-conflict",
      "Combineer de algemene schuifdeur-optie niet met schuifdeur links of rechts.",
      "Ne combinez pas l'option porte coulissante générale avec porte coulissante gauche ou droite.",
    ));
  }

  const availabilityType = text(values.availabilityTypeCode);
  if (["2", "3"].includes(availabilityType) && isBlank(values.deliveryDays) && isBlank(values.deliveryDate)) {
    issues.push(issue(
      "availabilityTypeCode",
      "delivery-details-required",
      "Deze beschikbaarheid vereist leveringsdagen of een leveringsdatum. Kies voorlopig 'onmiddellijk beschikbaar'.",
      "Cette disponibilité nécessite un délai ou une date de livraison. Choisissez provisoirement « disponible immédiatement ».",
    ));
  }

  const imageCount = number(values.imageCount);
  if (imageCount === null || imageCount < 1) {
    issues.push(issue("images", "minimum", "Voeg minstens één foto toe voor AutoScout24.", "Ajoutez au moins une photo pour AutoScout24."));
  } else if (imageCount > 50) {
    issues.push(issue("images", "maximum", "AutoScout24 accepteert maximaal 50 foto's.", "AutoScout24 accepte au maximum 50 photos."));
  }

  return issues;
}
