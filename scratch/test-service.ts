process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testVinDecoder() {
  const { VinDecoderService } = await import("../server/services/vin-decoder.ts");
  const testVins = [
    "LFP83ACP1S1K02383", // Bestune B70 2025
    "LF4A2A2A8P1000001", // Hongqi H5 2023
    "LB3743513N1000001", // Geely Coolray
    "LS4A1A1A8R1000001", // Changan
    "JTEBU5JR2R1000001", // Toyota Land Cruiser
    "WBA3A5C58N1000001", // BMW
  ];

  for (const vin of testVins) {
    const res = await VinDecoderService.decode(vin);
    console.log(`VIN: ${vin} -> Make: "${res.make}" | Model: "${res.model}" | Year: ${res.year} | Provider: ${res.provider}`);
  }
}

testVinDecoder();
