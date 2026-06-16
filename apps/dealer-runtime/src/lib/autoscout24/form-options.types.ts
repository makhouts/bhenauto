export type AutoScoutSelectOption = {
  value: string;
  label: string;
  vehicleTypes?: string[];
};

export type AutoScoutMakeOption = {
  value: string;
  label: string;
  vehicleTypes?: string[];
  models: AutoScoutSelectOption[];
};

export type AutoScoutReferenceOptions = {
  availabilityTypes: AutoScoutSelectOption[];
  bodyColors: AutoScoutSelectOption[];
  bodyTypes: AutoScoutSelectOption[];
  drivetrains: AutoScoutSelectOption[];
  emissionClasses: AutoScoutSelectOption[];
  equipment: AutoScoutSelectOption[];
  fuelCategories: AutoScoutSelectOption[];
  fuelTypes: AutoScoutSelectOption[];
  offerTypes: AutoScoutSelectOption[];
  transmissions: AutoScoutSelectOption[];
  upholsteryColors: AutoScoutSelectOption[];
  upholsteryTypes: AutoScoutSelectOption[];
  vehicleTypes: AutoScoutSelectOption[];
};

export type AutoScoutFormOptions = {
  makes: AutoScoutMakeOption[];
  references: AutoScoutReferenceOptions;
  error?: string;
};
