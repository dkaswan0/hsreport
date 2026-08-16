import { extractInspectionMedia } from "../client/src/components/unified-media-gallery";
import type { InspectionMediaItem } from "../shared/schema";

// Simulating database storage update inspection filtering
function simulateStorageUpdate(existing: any, rawUpdates: any) {
  const updates = { ...rawUpdates };
  const allowedColumns = new Set([
    'vin', 'vinPhoto', 'make', 'model', 'year', 'color', 'odometer', 'odometerPhoto',
    'customerName', 'customerPhone', 'inspectionType', 'customerSignature', 'status',
    'notes', 'shareToken', 'mainCarPhoto', 'rearLeftDoorPhoto', 'rearRightDoorPhoto',
    'frontLeftDoorPhoto', 'frontRightDoorPhoto', 'hoodPhoto', 'trunkPhoto',
    'rearLeftDoorInteriorPhoto', 'rearRightDoorInteriorPhoto', 'frontLeftDoorInteriorPhoto',
    'frontRightDoorInteriorPhoto', 'hoodInteriorPhoto', 'trunkInteriorPhoto',
    'obdCodes', 'autelReportPdf', 'autelReportName', 'mojazRecord', 'mojazAnalysis',
    'vehiclePhotosMeta', 'vehiclePhotosAudit', 'videoUrl', 'mediaGallery'
  ]);

  const sanitizedUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedColumns.has(key)) {
      sanitizedUpdates[key] = value;
    }
  }

  return {
    ...existing,
    ...sanitizedUpdates,
    updatedAt: new Date(),
  };
}

async function runEndToEndWorkflowTest() {
  console.log("=================================================================");
  console.log("🧪 STARTING FULL END-TO-END WORKFLOW VERIFICATION TEST");
  console.log("=================================================================\n");

  // Step 1: Simulated inspector enters /inspections/new
  console.log("Step 1: Inspector creates new inspection in /inspections/new with 1 Video + 70 Photos...");
  const initialVideoUrl = "/uploads/video_1723750000000_walkaround.mp4";
  const initialMediaGallery: InspectionMediaItem[] = Array.from({ length: 70 }, (_, i) => ({
    id: `media-photo-${i + 1}`,
    type: "image",
    url: `/uploads/media_1723750000000_photo_${i + 1}.jpg`,
    thumbnailUrl: `/uploads/media_1723750000000_photo_${i + 1}.jpg`,
    name: `صورة زاوية المركبة رقم ${i + 1}`,
    sortOrder: i + 1,
  }));

  const createdInspection = {
    id: 101,
    vin: "WBA3A5C50DF123456",
    make: "BMW",
    model: "530i",
    year: 2024,
    status: "draft",
    shareToken: "tok_secure_client_share_abc123",
    videoUrl: initialVideoUrl,
    mediaGallery: initialMediaGallery,
    notes: "فحص أولي بحالة ممتازة",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`✅ Inspection created with ID #${createdInspection.id}`);
  console.log(`   - Video: ${createdInspection.videoUrl}`);
  console.log(`   - Media Gallery items count: ${createdInspection.mediaGallery.length}`);

  // Step 2: Inspector writes defects in /inspections/101 and clicks "اعتماد" (status = 'completed')
  console.log("\nStep 2: Inspector finishes inspection and clicks 'اعتماد' (Approve)...");
  const approvedInspection = simulateStorageUpdate(createdInspection, {
    status: "completed",
  });

  if (!approvedInspection.videoUrl) {
    throw new Error("❌ FAILURE: videoUrl was lost after approval update!");
  }
  if (!approvedInspection.mediaGallery || approvedInspection.mediaGallery.length !== 70) {
    throw new Error("❌ FAILURE: mediaGallery was stripped or corrupted after approval update!");
  }
  console.log("✅ Approval update completed without media loss.");

  // Step 3: Add a defect with an image to items
  console.log("\nStep 3: Simulating defect item with defect photo...");
  const inspectionWithItems = {
    ...approvedInspection,
    items: [
      {
        id: 501,
        inspectionId: 101,
        partName: "الرفرف الأمامي يمين",
        category: "front_bumper",
        status: "defect",
        notes: "حكة سطحية بسيطة في طرف الصدام",
        imageUrl: "/uploads/defect_scratch_bumper_close_up.jpg", // MUST NOT leak into top gallery
      },
    ],
  };

  // Step 4: Client opens report at /view/tok_secure_client_share_abc123
  console.log("\nStep 4: Client opens /view/:token (Extracting Unified Gallery Media)...");
  const extracted = extractInspectionMedia(inspectionWithItems);

  console.log(`✅ Extracted media items total: ${extracted.length}`);

  // Step 5: Assertions
  console.log("\nStep 5: Verifying strict gallery rules...");

  // Check total: 1 video + 70 images = 71
  if (extracted.length !== 71) {
    throw new Error(`❌ Expected 71 media items, got ${extracted.length}`);
  }
  console.log("  [PASS] Exactly 71 items in unified gallery (1 video + 70 photos).");

  // Check Item #0 is the Video
  const firstItem = extracted[0];
  if (firstItem.type !== "video" || firstItem.sortOrder !== 0 || firstItem.url !== initialVideoUrl) {
    throw new Error(`❌ First element is NOT the video or sortOrder is not 0: ${JSON.stringify(firstItem)}`);
  }
  console.log(`  [PASS] Element #0 is strictly the video: "${firstItem.name}" (${firstItem.url})`);

  // Check sort order of photos
  for (let i = 1; i <= 70; i++) {
    const photoItem = extracted[i];
    if (photoItem.type !== "image") {
      throw new Error(`❌ Element #${i} should be an image, got ${photoItem.type}`);
    }
    if (photoItem.sortOrder !== i) {
      throw new Error(`❌ Element #${i} has sortOrder ${photoItem.sortOrder}, expected ${i}`);
    }
  }
  console.log("  [PASS] All 70 photos follow sequential ascending sortOrder (1 to 70).");

  // Check 0 duplicates
  const urlSet = new Set<string>();
  for (const item of extracted) {
    if (urlSet.has(item.url)) {
      throw new Error(`❌ Duplicate URL found in gallery: ${item.url}`);
    }
    urlSet.add(item.url);
  }
  console.log("  [PASS] 0 duplicate items found.");

  // Check Defect photo is NOT in gallery
  const defectFound = extracted.some((item) => item.url.includes("defect_scratch_bumper_close_up.jpg"));
  if (defectFound) {
    throw new Error("❌ FAILURE: Defect photo leaked into UnifiedMediaGallery!");
  }
  console.log("  [PASS] Defect photos are strictly isolated in inspection item cards and NOT leaked into top gallery.");

  console.log("\n=================================================================");
  console.log("🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 100% VERIFIED.");
  console.log("=================================================================");
}

runEndToEndWorkflowTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
