// ==============================================================================
// Full Workflow & QA Test Script
// Tests: Inspections CRUD, VIN, Media, Deep Fault Library Search, 6 Canonical Sections,
// Customer Report Generation & Token Verification
// ==============================================================================

import { storage } from "./server/storage";
import { mapLegacyCategoryToMainSection, MAIN_SECTIONS } from "./shared/categories";

async function runAudit() {
  console.log("=================================================");
  console.log("🚀 STARTING AUTOMATED WORKFLOW & FUNCTIONAL AUDIT");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // ── TEST 1: Check Canonical 6 Sections System ──
  console.log("\n--- TEST SUITE 1: CANONICAL 6 SECTIONS SYSTEM ---");
  assert(MAIN_SECTIONS.length === 6, "Must have exactly 6 canonical sections");
  const sectionIds = MAIN_SECTIONS.map((s) => s.id);
  assert(sectionIds.includes("mechanical"), "Contains mechanical section");
  assert(sectionIds.includes("exterior_body"), "Contains exterior_body section");
  assert(sectionIds.includes("electrical_electronics"), "Contains electrical_electronics section");
  assert(sectionIds.includes("transmission"), "Contains transmission section");
  assert(sectionIds.includes("chassis"), "Contains chassis section");
  assert(sectionIds.includes("other"), "Contains other section");

  // Test Legacy Mapping
  assert(mapLegacyCategoryToMainSection("engine") === "mechanical", "Legacy 'engine' maps to 'mechanical'");
  assert(mapLegacyCategoryToMainSection("door_front_left") === "exterior_body", "Legacy 'door_front_left' maps to 'exterior_body'");
  assert(mapLegacyCategoryToMainSection("transmission_auto") === "transmission", "Legacy 'transmission_auto' maps to 'transmission'");
  assert(mapLegacyCategoryToMainSection("chassis_frame") === "chassis", "Legacy 'chassis_frame' maps to 'chassis'");
  assert(mapLegacyCategoryToMainSection("battery") === "electrical_electronics", "Legacy 'battery' maps to 'electrical_electronics'");

  // ── TEST 2: Deep Fault Library Search Engine ──
  console.log("\n--- TEST SUITE 2: DEEP FAULT LIBRARY SEARCH (9,000+ ITEMS) ---");
  const totalFaults = await storage.getFaultLibrary();
  console.log(`📊 Total faults in database: ${totalFaults.length}`);
  assert(totalFaults.length > 0, "Fault library is loaded and not empty");

  // Search 'زيت' (Oil)
  const oilSearch = await storage.getFaultLibrary("زيت", "mechanical");
  console.log(`🔍 Search 'زيت' returned: ${oilSearch.length} results`);
  assert(oilSearch.length >= 5, "Search 'زيت' returns rich results (>= 5)");

  // Search 'تهريب زيت' (Oil Leak)
  const leakSearch = await storage.getFaultLibrary("تهريب زيت", "mechanical");
  console.log(`🔍 Search 'تهريب زيت' returned: ${leakSearch.length} results`);
  assert(leakSearch.length >= 3, "Search 'تهريب زيت' returns rich results (>= 3)");

  // Search English 'brake' / 'oil'
  const engSearch = await storage.getFaultLibrary("oil", "mechanical");
  console.log(`🔍 Search 'oil' returned: ${engSearch.length} results`);
  assert(engSearch.length > 0, "English search 'oil' returns matching results");

  // Search 'شاص' (Chassis)
  const chassisSearch = await storage.getFaultLibrary("شاص", "chassis");
  console.log(`🔍 Search 'شاص' returned: ${chassisSearch.length} results`);
  assert(chassisSearch.length > 0, "Search 'شاص' returns chassis results");

  // Search 'رش' / 'صدمة' (Body/Paint)
  const paintSearch = await storage.getFaultLibrary("رش", "exterior_body");
  console.log(`🔍 Search 'رش' returned: ${paintSearch.length} results`);
  assert(paintSearch.length > 0, "Search 'رش' returns body paint results");

  // ── TEST 3: Inspection Lifecycle & Workflow ──
  console.log("\n--- TEST SUITE 3: INSPECTION LIFECYCLE & PERSISTENCE ---");
  const testVin = `TESTVIN${Date.now().toString().slice(-10)}`;
  const created = await storage.createInspection({
    vin: testVin,
    make: "تويوتا",
    model: "كامري",
    year: 2024,
    color: "أبيض لؤلؤي",
    odometer: 45000,
    customerName: "محمد الشمري",
    customerPhone: "0501234567",
    inspectionType: "فحص شامل",
    status: "draft",
    videoUrl: "data:video/mp4;base64,AAAA",
    mediaGallery: [
      { id: "g1", type: "image", url: "https://example.com/car1.jpg", name: "صورة الواجهة الأمامية", sortOrder: 1 },
      { id: "g2", type: "image", url: "https://example.com/car2.jpg", name: "صورة الجانب الأيمن", sortOrder: 2 },
    ],
  });

  assert(!!created.id, `Created test inspection with ID: ${created.id}`);
  assert(created.vin === testVin, "VIN matches input exactly");

  // Add Fault Items across multiple sections
  console.log("\n--- TEST SUITE 4: ADDING FAULTS UNDER CANONICAL SECTIONS ---");
  const item1 = await storage.createInspectionItem({
    inspectionId: created.id,
    category: "mechanical",
    faultName: "يوجد تهريب زيت حول غطاء البلوف",
    status: "fail",
    severity: "medium",
    notes: "يوجد تهريب زيت حول غطاء البلوف",
    imageUrl: "https://example.com/leak.jpg",
  });
  assert(item1.category === "mechanical", "Item 1 saved under mechanical");

  const item2 = await storage.createInspectionItem({
    inspectionId: created.id,
    category: "exterior_body",
    faultName: "يوجد آثار رش تجميلي بالرفرف الأمامي الأيمن",
    status: "fail",
    severity: "medium",
    notes: "يوجد آثار رش تجميلي بالرفرف الأمامي الأيمن",
    imageUrl: "https://example.com/fender.jpg",
  });
  assert(item2.category === "exterior_body", "Item 2 saved under exterior_body");

  // Verify fetch with items
  const fetched = await storage.getInspectionWithItems(created.id);
  assert(!!fetched, "Fetched inspection with items successfully");
  assert(fetched?.items.length === 2, "Has exactly 2 items attached");

  // Test Update Vehicle Specs
  console.log("\n--- TEST SUITE 5: VEHICLE SPECS UPDATE & PERSISTENCE ---");
  const updated = await storage.updateInspection(created.id, {
    odometer: 52000,
    color: "فضي ميتاليك",
    notes: "تم فحص المركبة بالكامل",
  });
  assert(updated.odometer === 52000, "Odometer updated to 52,000");
  assert(updated.color === "فضي ميتاليك", "Color updated successfully");

  // Test Status Completion & Share Token
  console.log("\n--- TEST SUITE 6: STATUS COMPLETION & TOKEN VERIFICATION ---");
  const completed = await storage.updateInspection(created.id, {
    status: "completed",
  });
  assert(completed.status === "completed", "Inspection status updated to 'completed'");
  assert(!!completed.shareToken, `Share token generated: ${completed.shareToken}`);

  // Test Public Access by Share Token
  const publicFetched = await storage.getInspectionByToken(completed.shareToken!);
  assert(!!publicFetched, "Inspection retrievable via public shareToken");
  assert(publicFetched?.items.length === 2, "Public report includes all 2 fault items");
  assert(publicFetched?.vin === testVin, "Public report preserves VIN");

  // Cleanup test inspection
  await storage.deleteInspection(created.id);
  console.log("🧹 Cleaned up temporary test inspection");

  console.log("\n=================================================");
  console.log(`🎯 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("=================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Audit Execution Error:", err);
  process.exit(1);
});
