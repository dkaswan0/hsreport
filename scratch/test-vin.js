process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testVin() {
  const vin = "LFP83ACP1S1K02383";
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${vin}?format=json`);
    const data = await res.json();
    const r = data.Results[0];
    console.log("NHTSA Result Make:", r.Make, "Model:", r.Model, "Year:", r.ModelYear, "Manufacturer:", r.Manufacturer);
  } catch (err) {
    console.error("NHTSA Error:", err);
  }
}
testVin();
