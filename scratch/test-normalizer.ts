process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Comprehensive WMI Master Database for Global and Middle East / GCC Market
export interface VehicleDecodedData {
  make: string;
  model: string;
  year: number | null;
  origin?: string;
}

export const WMI_DATABASE: Record<string, { make: string; defaultModel?: string; country: string }> = {
  // Chinese & GCC Popular Brands
  "LFP": { make: "Bestune", defaultModel: "B70", country: "China" },
  "LFA": { make: "Bestune", defaultModel: "", country: "China" },
  "LF4": { make: "Hongqi", defaultModel: "H5", country: "China" },
  "LFV": { make: "FAW-Volkswagen", defaultModel: "", country: "China" },
  "LS4": { make: "Changan", defaultModel: "CS75 Plus", country: "China" },
  "LS5": { make: "Changan", defaultModel: "CS85", country: "China" },
  "LS6": { make: "Changan", defaultModel: "UNI-K", country: "China" },
  "LSF": { make: "Changan", defaultModel: "UNI-V", country: "China" },
  "LSC": { make: "Changan", defaultModel: "Eado", country: "China" },
  "L6Y": { make: "Deepal", defaultModel: "SL03", country: "China" },
  "LB3": { make: "Geely", defaultModel: "Coolray", country: "China" },
  "L6T": { make: "Geely", defaultModel: "Monjaro", country: "China" },
  "LGB": { make: "Geely", defaultModel: "Tugella", country: "China" },
  "LGD": { make: "Lynk & Co", defaultModel: "01", country: "China" },
  "L6P": { make: "Zeekr", defaultModel: "001", country: "China" },
  "LVV": { make: "Chery", defaultModel: "Tiggo 8 Pro", country: "China" },
  "LVP": { make: "Chery", defaultModel: "Arrizo 8", country: "China" },
  "LVT": { make: "Chery", defaultModel: "Tiggo 7 Pro", country: "China" },
  "LVD": { make: "Jetour", defaultModel: "Dashing", country: "China" },
  "LVE": { make: "Exeed", defaultModel: "RX", country: "China" },
  "LVX": { make: "Omoda", defaultModel: "C5", country: "China" },
  "LVY": { make: "Jaecoo", defaultModel: "J7", country: "China" },
  "LGW": { make: "Haval", defaultModel: "H6", country: "China" },
  "LHG": { make: "Haval", defaultModel: "Jolion", country: "China" },
  "LGX": { make: "Tank", defaultModel: "300", country: "China" },
  "LGZ": { make: "Wey", defaultModel: "Coffee 01", country: "China" },
  "LGE": { make: "Great Wall", defaultModel: "Poer", country: "China" },
  "LSJ": { make: "MG", defaultModel: "GT", country: "China" },
  "LSG": { make: "Chevrolet", defaultModel: "Groove", country: "China" },
  "LSK": { make: "Maxus", defaultModel: "D90", country: "China" },
  "LSH": { make: "Roewe", defaultModel: "RX5", country: "China" },
  "LG8": { make: "BYD", defaultModel: "Song Plus", country: "China" },
  "LGK": { make: "BYD", defaultModel: "Han", country: "China" },
  "LC0": { make: "BYD", defaultModel: "Atto 3", country: "China" },
  "LGJ": { make: "BYD", defaultModel: "Seal", country: "China" },
  "LGN": { make: "GAC", defaultModel: "Empow", country: "China" },
  "LGA": { make: "GAC Aion", defaultModel: "Y Plus", country: "China" },
  "LB2": { make: "BAIC", defaultModel: "BJ40", country: "China" },
  "LBC": { make: "BAIC", defaultModel: "X35", country: "China" },
  "LBD": { make: "BAIC", defaultModel: "X7", country: "China" },
  "LGL": { make: "Forthing", defaultModel: "T5 EVO", country: "China" },
  "LDB": { make: "Dongfeng", defaultModel: "Shine Max", country: "China" },
  "LJ1": { make: "JAC", defaultModel: "J7", country: "China" },
  "LLV": { make: "Lifan", defaultModel: "", country: "China" },
  "LJN": { make: "Soueast", defaultModel: "DX8S", country: "China" },

  // Japanese Brands
  "JTD": { make: "Toyota", defaultModel: "Corolla", country: "Japan" },
  "JTE": { make: "Toyota", defaultModel: "Land Cruiser", country: "Japan" },
  "JTM": { make: "Toyota", defaultModel: "RAV4", country: "Japan" },
  "JTN": { make: "Toyota", defaultModel: "Camry", country: "Japan" },
  "JT1": { make: "Toyota", defaultModel: "Hilux", country: "Japan" },
  "JT2": { make: "Toyota", defaultModel: "Prius", country: "Japan" },
  "JT3": { make: "Toyota", defaultModel: "", country: "Japan" },
  "JT4": { make: "Toyota", defaultModel: "", country: "Japan" },
  "JT5": { make: "Toyota", defaultModel: "", country: "Japan" },
  "JT6": { make: "Lexus", defaultModel: "LX600", country: "Japan" },
  "JT8": { make: "Lexus", defaultModel: "ES350", country: "Japan" },
  "JTH": { make: "Lexus", defaultModel: "LS500", country: "Japan" },
  "JTJ": { make: "Lexus", defaultModel: "RX350", country: "Japan" },
  "4T1": { make: "Toyota", defaultModel: "Camry", country: "USA" },
  "5TD": { make: "Toyota", defaultModel: "Highlander", country: "USA" },
  "2T1": { make: "Toyota", defaultModel: "Corolla", country: "Canada" },
  "MR0": { make: "Toyota", defaultModel: "Hilux", country: "Thailand" },
  "MHF": { make: "Toyota", defaultModel: "Innova", country: "Indonesia" },
  "JN1": { make: "Nissan", defaultModel: "Patrol", country: "Japan" },
  "JN6": { make: "Nissan", defaultModel: "Navara", country: "Japan" },
  "JN8": { make: "Nissan", defaultModel: "X-Trail", country: "Japan" },
  "JNK": { make: "Infiniti", defaultModel: "QX80", country: "Japan" },
  "JNR": { make: "Infiniti", defaultModel: "QX60", country: "Japan" },
  "1N4": { make: "Nissan", defaultModel: "Altima", country: "USA" },
  "3N1": { make: "Nissan", defaultModel: "Sunny", country: "Mexico" },
  "5N1": { make: "Nissan", defaultModel: "Pathfinder", country: "USA" },
  "MNT": { make: "Nissan", defaultModel: "Urvan", country: "Thailand" },
  "JHM": { make: "Honda", defaultModel: "Accord", country: "Japan" },
  "JH4": { make: "Acura", defaultModel: "MDX", country: "Japan" },
  "1HG": { make: "Honda", defaultModel: "Civic", country: "USA" },
  "2HK": { make: "Honda", defaultModel: "CR-V", country: "Canada" },
  "5FN": { make: "Honda", defaultModel: "Pilot", country: "USA" },
  "JM1": { make: "Mazda", defaultModel: "CX-9", country: "Japan" },
  "JMZ": { make: "Mazda", defaultModel: "CX-5", country: "Japan" },
  "3MZ": { make: "Mazda", defaultModel: "Mazda 3", country: "Mexico" },
  "JMB": { make: "Mitsubishi", defaultModel: "Pajero", country: "Japan" },
  "MMB": { make: "Mitsubishi", defaultModel: "L200", country: "Thailand" },
  "JA3": { make: "Mitsubishi", defaultModel: "Outlander", country: "Japan" },
  "JF1": { make: "Subaru", defaultModel: "Forester", country: "Japan" },
  "JF2": { make: "Subaru", defaultModel: "Outback", country: "Japan" },
  "4S3": { make: "Subaru", defaultModel: "Legacy", country: "USA" },
  "JS1": { make: "Suzuki", defaultModel: "Jimny", country: "Japan" },
  "MA3": { make: "Suzuki", defaultModel: "Swift", country: "India" },

  // Korean Brands
  "KMH": { make: "Hyundai", defaultModel: "Sonata", country: "South Korea" },
  "KHM": { make: "Hyundai", defaultModel: "Elantra", country: "South Korea" },
  "KM8": { make: "Hyundai", defaultModel: "Santa Fe", country: "South Korea" },
  "KMF": { make: "Hyundai", defaultModel: "Tucson", country: "South Korea" },
  "KMU": { make: "Genesis", defaultModel: "G80", country: "South Korea" },
  "5NM": { make: "Hyundai", defaultModel: "Palisade", country: "USA" },
  "MAL": { make: "Hyundai", defaultModel: "Accent", country: "India" },
  "TMA": { make: "Hyundai", defaultModel: "Creta", country: "Czech" },
  "KNA": { make: "Kia", defaultModel: "Optima", country: "South Korea" },
  "KND": { make: "Kia", defaultModel: "Sportage", country: "South Korea" },
  "KN4": { make: "Kia", defaultModel: "Telluride", country: "South Korea" },
  "5XX": { make: "Kia", defaultModel: "K5", country: "USA" },

  // German & European Luxury Brands
  "WBA": { make: "BMW", defaultModel: "7 Series", country: "Germany" },
  "WBS": { make: "BMW", defaultModel: "M5", country: "Germany" },
  "WBY": { make: "BMW", defaultModel: "i7", country: "Germany" },
  "5UX": { make: "BMW", defaultModel: "X5", country: "USA" },
  "5YM": { make: "BMW", defaultModel: "X6", country: "USA" },
  "WDB": { make: "Mercedes-Benz", defaultModel: "S-Class", country: "Germany" },
  "WDD": { make: "Mercedes-Benz", defaultModel: "E-Class", country: "Germany" },
  "WDC": { make: "Mercedes-Benz", defaultModel: "G-Class", country: "Germany" },
  "W1K": { make: "Mercedes-Benz", defaultModel: "C-Class", country: "Germany" },
  "W1N": { make: "Mercedes-Benz", defaultModel: "GLE", country: "Germany" },
  "4JG": { make: "Mercedes-Benz", defaultModel: "GLS", country: "USA" },
  "WAU": { make: "Audi", defaultModel: "A8", country: "Germany" },
  "WA1": { make: "Audi", defaultModel: "Q7", country: "Germany" },
  "WVW": { make: "Volkswagen", defaultModel: "Touareg", country: "Germany" },
  "WV1": { make: "Volkswagen", defaultModel: "Passat", country: "Germany" },
  "WV2": { make: "Volkswagen", defaultModel: "Transporter", country: "Germany" },
  "3VW": { make: "Volkswagen", defaultModel: "Jetta", country: "Mexico" },
  "WP0": { make: "Porsche", defaultModel: "911", country: "Germany" },
  "WP1": { make: "Porsche", defaultModel: "Cayenne", country: "Germany" },
  "SAL": { make: "Land Rover", defaultModel: "Range Rover", country: "UK" },
  "SAD": { make: "Jaguar", defaultModel: "F-Pace", country: "UK" },
  "YV1": { make: "Volvo", defaultModel: "XC90", country: "Sweden" },
  "YV4": { make: "Volvo", defaultModel: "XC60", country: "Sweden" },
  "VF1": { make: "Renault", defaultModel: "Duster", country: "France" },
  "VF3": { make: "Peugeot", defaultModel: "3008", country: "France" },
  "ZFF": { make: "Ferrari", defaultModel: "F8", country: "Italy" },
  "ZHW": { make: "Lamborghini", defaultModel: "Urus", country: "Italy" },
  "ZAM": { make: "Maserati", defaultModel: "Levante", country: "Italy" },
  "SCA": { make: "Rolls-Royce", defaultModel: "Cullinan", country: "UK" },
  "SCB": { make: "Bentley", defaultModel: "Bentayga", country: "UK" },
  "SCF": { make: "Aston Martin", defaultModel: "DBX", country: "UK" },
  "SBM": { make: "McLaren", defaultModel: "720S", country: "UK" },

  // American Brands
  "1FA": { make: "Ford", defaultModel: "Mustang", country: "USA" },
  "1FT": { make: "Ford", defaultModel: "F-150", country: "USA" },
  "1FM": { make: "Ford", defaultModel: "Explorer", country: "USA" },
  "1FB": { make: "Ford", defaultModel: "Expedition", country: "USA" },
  "1LN": { make: "Lincoln", defaultModel: "Navigator", country: "USA" },
  "3FA": { make: "Ford", defaultModel: "Fusion", country: "Mexico" },
  "1G1": { make: "Chevrolet", defaultModel: "Malibu", country: "USA" },
  "1GC": { make: "Chevrolet", defaultModel: "Silverado", country: "USA" },
  "1GN": { make: "Chevrolet", defaultModel: "Tahoe", country: "USA" },
  "1GT": { make: "GMC", defaultModel: "Sierra", country: "USA" },
  "1GK": { make: "GMC", defaultModel: "Yukon", country: "USA" },
  "1GY": { make: "Cadillac", defaultModel: "Escalade", country: "USA" },
  "1G6": { make: "Cadillac", defaultModel: "CT5", country: "USA" },
  "1J4": { make: "Jeep", defaultModel: "Wrangler", country: "USA" },
  "1C4": { make: "Jeep", defaultModel: "Grand Cherokee", country: "USA" },
  "2C3": { make: "Dodge", defaultModel: "Charger", country: "Canada" },
  "2C4": { make: "Chrysler", defaultModel: "300", country: "Canada" },
  "1C6": { make: "Ram", defaultModel: "1500", country: "USA" },
  "5YJ": { make: "Tesla", defaultModel: "Model 3", country: "USA" },
  "7SA": { make: "Tesla", defaultModel: "Model Y", country: "USA" },
  "7G2": { make: "Lucid", defaultModel: "Air", country: "USA" },
};

export const YEAR_CHAR_MAP: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016, 'H': 2017,
  'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025,
  'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029, 'Y': 2030,
  '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009
};

export function cleanAndNormalizeVehicle(
  rawMake: string | undefined | null,
  rawModel: string | undefined | null,
  rawYear: number | string | undefined | null,
  vin: string
): VehicleDecodedData {
  const normVin = (vin || "").toUpperCase().trim()
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .replace(/Q/g, "0");

  const wmi = normVin.substring(0, 3);
  let make = (rawMake || "").trim();
  let model = (rawModel || "").trim();
  
  // 1. Calculate Year from 10th VIN character if missing or invalid
  let year: number | null = null;
  if (rawYear) {
    const parsed = typeof rawYear === "number" ? rawYear : parseInt(String(rawYear), 10);
    if (!isNaN(parsed) && parsed >= 1970 && parsed <= 2035) {
      year = parsed;
    }
  }
  if (!year && normVin.length >= 10) {
    const yearChar = normVin.charAt(9);
    year = YEAR_CHAR_MAP[yearChar] || null;
  }

  // 2. Identify Obsolete / Generic / Corrupted Names from NHTSA
  const isBadMake = (m: string) => {
    const upper = m.toUpperCase();
    return (
      upper.includes("FAW JIAXING") ||
      upper.includes("HAPPY MESSENGER") ||
      upper.includes("CHINA FIRST AUTOMOBILE") ||
      upper.includes("TIANJIN FAW") ||
      upper.includes("JIAXING") ||
      upper === "FAW" ||
      upper === "INCOMPLETE" ||
      upper === "UNKNOWN" ||
      upper === "OTHER"
    );
  };

  // 3. FAW / Bestune / Hongqi Rules
  if (isBadMake(make) || wmi === "LFP" || wmi === "LFA") {
    make = "Bestune";
    if (!model || isBadMake(model)) {
      const vds = normVin.substring(3, 8);
      if (vds.startsWith("83A") || vds.includes("83A")) model = "B70";
      else if (vds.startsWith("77A") || vds.includes("77A") || vds.startsWith("73A")) model = "T77";
      else if (vds.startsWith("99A") || vds.includes("99A")) model = "T99";
      else if (vds.startsWith("55A") || vds.includes("55A")) model = "T55";
      else if (vds.startsWith("33A") || vds.includes("33A")) model = "T33";
      else if (vds.startsWith("90A") || vds.includes("90A")) model = "T90";
      else if (vds.startsWith("30A") || vds.includes("30A")) model = "B30";
      else if (vds.includes("NAT")) model = "NAT";
      else model = "B70"; // Most common in GCC
    }
  } else if (wmi === "LF4") {
    make = "Hongqi";
    if (!model) model = "H5";
  }

  // 4. WMI Lookup Fallback if Make is empty or unknown
  if ((!make || make === "Unknown") && WMI_DATABASE[wmi]) {
    make = WMI_DATABASE[wmi].make;
    if (!model && WMI_DATABASE[wmi].defaultModel) {
      model = WMI_DATABASE[wmi].defaultModel!;
    }
  }

  // 5. Clean up model names
  if (model.toUpperCase().includes("NULL") || model.toUpperCase().includes("UNDEFINED") || model === "-") {
    model = "";
  }

  return {
    make,
    model,
    year,
    origin: WMI_DATABASE[wmi]?.country
  };
}

// Test LFP83ACP1S1K02383
const test1 = cleanAndNormalizeVehicle("FAW JIAXING HAPPY MESSENGER", "", 2025, "LFP83ACP1S1K02383");
console.log("Test 1 Result:", test1);
