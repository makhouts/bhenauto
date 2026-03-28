// Comprehensive car brands and models database for the Netherlands/Belgium market
export const CAR_BRANDS_MODELS: Record<string, string[]> = {
    "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "4C", "Giulietta", "MiTo", "159", "147", "156", "GT"],
    "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "e-tron GT", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "TT", "R8"],
    "BMW": ["1 Serie", "2 Serie", "3 Serie", "4 Serie", "5 Serie", "6 Serie", "7 Serie", "8 Serie", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z4", "iX", "iX1", "iX3", "i4", "i5", "i7", "M2", "M3", "M4", "M5", "M8"],
    "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "SpaceTourer", "ë-C4", "ë-Berlingo"],
    "Cupra": ["Formentor", "Leon", "Born", "Ateca", "Tavascan"],
    "Dacia": ["Sandero", "Logan", "Duster", "Jogger", "Spring"],
    "DS": ["DS 3", "DS 4", "DS 7", "DS 9"],
    "Ferrari": ["296 GTB", "296 GTS", "SF90 Stradale", "F8 Tributo", "Roma", "Portofino M", "812 Superfast", "Purosangue", "488", "458", "California"],
    "Fiat": ["500", "500X", "500L", "500e", "Panda", "Tipo", "Punto", "Doblo"],
    "Ford": ["Fiesta", "Focus", "Puma", "Kuga", "Explorer", "Mustang", "Mustang Mach-E", "Ranger", "Galaxy", "S-Max", "Mondeo", "EcoSport", "Transit"],
    "Honda": ["Civic", "HR-V", "CR-V", "Jazz", "ZR-V", "e:Ny1", "Honda e", "Accord", "NSX"],
    "Hyundai": ["i10", "i20", "i30", "Kona", "Tucson", "Santa Fe", "Ioniq 5", "Ioniq 6", "Bayon", "NEXO"],
    "Jaguar": ["F-Pace", "E-Pace", "I-Pace", "XE", "XF", "F-Type", "XJ"],
    "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Avenger"],
    "Kia": ["Picanto", "Rio", "Ceed", "Proceed", "XCeed", "Sportage", "Sorento", "Niro", "EV6", "EV9", "Stinger", "Stonic"],
    "Lamborghini": ["Huracán", "Urus", "Revuelto", "Aventador", "Gallardo"],
    "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque"],
    "Lexus": ["UX", "NX", "RX", "ES", "IS", "LC", "LS", "LBX", "RZ"],
    "Maserati": ["Ghibli", "Levante", "Quattroporte", "MC20", "GranTurismo", "Grecale"],
    "Mazda": ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-60", "MX-5", "MX-30"],
    "Mercedes-Benz": ["A-Klasse", "B-Klasse", "C-Klasse", "E-Klasse", "S-Klasse", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQE", "EQS", "AMG GT", "SL", "G-Klasse", "V-Klasse", "Vito"],
    "MINI": ["Cooper", "Countryman", "Clubman", "Cabrio", "Electric", "Paceman"],
    "Mitsubishi": ["ASX", "Eclipse Cross", "Outlander", "Space Star", "L200"],
    "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "370Z", "GT-R", "Navara"],
    "Opel": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Insignia", "Combo", "Zafira", "Vivaro"],
    "Peugeot": ["208", "308", "408", "508", "2008", "3008", "5008", "Rifter", "Partner", "e-208", "e-308", "e-2008"],
    "Porsche": ["911", "718 Cayman", "718 Boxster", "Taycan", "Macan", "Cayenne", "Panamera"],
    "Renault": ["Clio", "Captur", "Mégane", "Arkana", "Austral", "Espace", "Scenic", "Kangoo", "Zoe", "Twingo", "Talisman", "Koleos"],
    "SEAT": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
    "Škoda": ["Fabia", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Scala", "Enyaq iV", "Citigo"],
    "Smart": ["ForTwo", "ForFour", "#1", "#3"],
    "Suzuki": ["Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Across", "Swace"],
    "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
    "Toyota": ["Aygo X", "Yaris", "Yaris Cross", "Corolla", "Camry", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Supra", "GR86", "Mirai", "Hilux", "Proace"],
    "Volkswagen": ["Polo", "Golf", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Passat", "Arteon", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Up!", "Caddy", "Transporter", "Multivan", "Amarok"],
    "Volvo": ["XC40", "XC60", "XC90", "C40", "S60", "S90", "V60", "V90", "EX30", "EX90"],
    // Less common but present in NL/BE
    "Alpine": ["A110"],
    "Aston Martin": ["DB11", "DB12", "DBX", "Vantage", "DBS"],
    "Bentley": ["Continental GT", "Flying Spur", "Bentayga"],
    "BYD": ["Atto 3", "Han", "Tang", "Dolphin", "Seal"],
    "Chevrolet": ["Camaro", "Corvette", "Spark", "Cruze", "Captiva"],
    "Chrysler": ["300C", "Pacifica"],
    "Dodge": ["Challenger", "Charger", "Durango", "RAM 1500"],
    "Genesis": ["G70", "G80", "GV60", "GV70", "GV80"],
    "Lotus": ["Emira", "Eletre", "Evija"],
    "MG": ["MG4", "ZS", "HS", "5", "Marvel R", "Cyberster"],
    "Polestar": ["Polestar 2", "Polestar 3", "Polestar 4"],
    "Rolls-Royce": ["Ghost", "Phantom", "Spectre", "Cullinan", "Wraith", "Dawn"],
    "SsangYong": ["Tivoli", "Korando", "Rexton", "Musso"],
    "Subaru": ["Impreza", "XV", "Forester", "Outback", "BRZ", "Solterra", "WRX"],
};

// Sorted brand names for the dropdown
export const BRAND_NAMES = Object.keys(CAR_BRANDS_MODELS).sort();

// Get models for a given brand
export function getModelsForBrand(brand: string): string[] {
    return CAR_BRANDS_MODELS[brand] || [];
}
