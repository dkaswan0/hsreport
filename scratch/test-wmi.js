process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Comprehensive WMI and Make normalization dictionary
const WMI_CORRECTIONS = {
  "LFP": { make: "Bestune", defaultModel: "B70" },
  "LFA": { make: "Bestune", defaultModel: "" },
  "LF4": { make: "Hongqi", defaultModel: "H5" },
  "LFV": { make: "Volkswagen", defaultModel: "" },
  "LS4": { make: "Changan", defaultModel: "CS75" },
  "LS5": { make: "Changan", defaultModel: "CS85" },
  "LS6": { make: "Changan", defaultModel: "UNI-K" },
  "LSF": { make: "Changan", defaultModel: "UNI-V" },
  "L6Y": { make: "Deepal", defaultModel: "SL03" },
  "LB3": { make: "Geely", defaultModel: "Coolray" },
  "L6T": { make: "Geely", defaultModel: "Monjaro" },
  "LGB": { make: "Geely", defaultModel: "Tugella" },
  "LGD": { make: "Lynk & Co", defaultModel: "01" },
  "L6P": { make: "Zeekr", defaultModel: "001" },
  "LVV": { make: "Chery", defaultModel: "Tiggo 8 Pro" },
  "LVP": { make: "Chery", defaultModel: "Arrizo 8" },
  "LVD": { make: "Jetour", defaultModel: "Dashing" },
  "LVE": { make: "Exeed", defaultModel: "RX" },
  "LVX": { make: "Omoda", defaultModel: "C5" },
  "LVY": { make: "Jaecoo", defaultModel: "J7" },
  "LGW": { make: "Haval", defaultModel: "H6" },
  "LHG": { make: "Haval", defaultModel: "Jolion" },
  "LGX": { make: "Tank", defaultModel: "300" },
  "LSJ": { make: "MG", defaultModel: "GT" },
  "LG8": { make: "BYD", defaultModel: "Song Plus" },
  "LGK": { make: "BYD", defaultModel: "Han" },
  "LC0": { make: "BYD", defaultModel: "Atto 3" },
  "LGN": { make: "GAC", defaultModel: "Empow" },
  "LGA": { make: "GAC Aion", defaultModel: "Y Plus" },
  "LB2": { make: "BAIC", defaultModel: "BJ40" },
};

function normalizeMakeAndModel(rawMake, rawModel, vin) {
  const normVin = (vin || "").toUpperCase().trim();
  const wmi = normVin.substring(0, 3);
  let make = rawMake || "";
  let model = rawModel || "";

  // 1. Check if make is obsolete or contains known bad strings
  const badMakes = [
    "FAW JIAXING HAPPY MESSENGER",
    "CHINA FIRST AUTOMOBILE",
    "TIANJIN FAW",
    "JIAXING",
  ];

  if (badMakes.some(b => make.toUpperCase().includes(b)) || wmi === "LFP" || wmi === "LFA") {
    make = "Bestune";
    if (!model || model.trim() === "") {
      // Decode Bestune VDS
      const vds = normVin.substring(3, 8);
      if (vds.startsWith("83A") || vds.includes("83A")) model = "B70";
      else if (vds.startsWith("77A") || vds.includes("77A")) model = "T77";
      else if (vds.startsWith("99A") || vds.includes("99A")) model = "T99";
      else if (vds.startsWith("55A") || vds.includes("55A")) model = "T55";
      else if (vds.startsWith("33A") || vds.includes("33A")) model = "T33";
      else if (vds.startsWith("90A") || vds.includes("90A")) model = "T90";
      else if (vds.startsWith("30A") || vds.includes("30A")) model = "B30";
      else if (vds.includes("NAT")) model = "NAT";
      else model = "B70";
    }
  }

  // Check known WMI overrides if make is empty or unknown
  if ((!make || make === "Unknown") && WMI_CORRECTIONS[wmi]) {
    make = WMI_CORRECTIONS[wmi].make;
    if (!model) model = WMI_CORRECTIONS[wmi].defaultModel;
  }

  return { make, model };
}

const res = normalizeMakeAndModel("FAW JIAXING HAPPY MESSENGER", "", "LFP83ACP1S1K02383");
console.log("Corrected Result:", res);
