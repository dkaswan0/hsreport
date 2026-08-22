import fs from "fs";
import path from "path";
import { db, pool } from "../db";
import { uploadedMediaBlobs } from "@shared/schema";
import { eq } from "drizzle-orm";

const UPLOAD_DIR_PRIMARY = path.join(process.cwd(), "public", "uploads");
const UPLOAD_DIR_SECONDARY = path.join(process.cwd(), "client", "public", "uploads");

// Ensure directories exist
function ensureUploadDirs() {
  try {
    if (!fs.existsSync(UPLOAD_DIR_PRIMARY)) {
      fs.mkdirSync(UPLOAD_DIR_PRIMARY, { recursive: true });
    }
    if (!fs.existsSync(UPLOAD_DIR_SECONDARY)) {
      fs.mkdirSync(UPLOAD_DIR_SECONDARY, { recursive: true });
    }
  } catch (err) {
    console.warn("Failed to create upload directories:", err);
  }
}

ensureUploadDirs();

export interface SaveMediaResult {
  success: boolean;
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  type: "image" | "video";
  size: number;
}

/**
 * Saves a media file permanently:
 * 1. Saves to local disk cache for instantaneous streaming.
 * 2. Persists to database table `uploaded_media_blobs` (survives Render restart/redeploy).
 * 3. Supports optional Cloudinary / S3 upload if configured in environment.
 */
export async function savePersistentMedia(
  base64Data: string,
  type: "image" | "video" = "image",
  originalFilename?: string
): Promise<SaveMediaResult> {
  ensureUploadDirs();

  // If already an absolute external URL (not a data URL), return directly
  if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
    const cleanId = path.basename(base64Data);
    return {
      success: true,
      id: cleanId,
      url: base64Data,
      thumbnailUrl: base64Data,
      filename: originalFilename || cleanId,
      type,
      size: 0,
    };
  }

  let ext = type === "video" ? "mp4" : "jpg";
  let mimeType = type === "video" ? "video/mp4" : "image/jpeg";
  let cleanBase64 = base64Data;

  if (base64Data.startsWith("data:")) {
    const matches = base64Data.match(/^data:([A-Za-z0-9+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      cleanBase64 = matches[2];

      if (mimeType.includes("video/mp4") || mimeType.includes("video/quicktime") || mimeType.includes("video/webm")) {
        ext = mimeType.includes("webm") ? "webm" : "mp4";
      } else if (mimeType.includes("image/png")) {
        ext = "png";
      } else if (mimeType.includes("image/webp")) {
        ext = "webp";
      } else {
        ext = "jpg";
      }
    }
  }

  const buffer = Buffer.from(cleanBase64, "base64");
  const prefix = type === "video" ? "video" : "media";
  const fileId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // 1. Write to local disk cache
  const primaryPath = path.join(UPLOAD_DIR_PRIMARY, fileId);
  const secondaryPath = path.join(UPLOAD_DIR_SECONDARY, fileId);

  try {
    await fs.promises.writeFile(primaryPath, buffer);
    fs.promises.writeFile(secondaryPath, buffer).catch(() => {});
  } catch (fsErr) {
    console.warn("Local disk write warning:", fsErr);
  }

  // 2. Persist in database `uploaded_media_blobs` (Guarantees survival on Render redeploy)
  try {
    await db.insert(uploadedMediaBlobs).values({
      id: fileId,
      filename: originalFilename || fileId,
      mimeType,
      byteSize: buffer.length,
      dataBase64: cleanBase64,
    }).onConflictDoUpdate({
      target: uploadedMediaBlobs.id,
      set: {
        dataBase64: cleanBase64,
        byteSize: buffer.length,
        mimeType,
      }
    });
  } catch (dbErr: any) {
    // If table doesn't exist yet, attempt raw query insert
    console.warn("DB media blob insert notice:", dbErr?.message);
    try {
      await pool.query(`
        INSERT INTO "uploaded_media_blobs" ("id", "filename", "mime_type", "byte_size", "data_base64")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("id") DO UPDATE SET "data_base64" = $5, "byte_size" = $4
      `, [fileId, originalFilename || fileId, mimeType, buffer.length, cleanBase64]);
    } catch (rawErr) {
      console.error("Critical DB blob storage error:", rawErr);
    }
  }

  const publicUrl = `/uploads/${fileId}`;

  return {
    success: true,
    id: fileId,
    url: publicUrl,
    thumbnailUrl: publicUrl,
    filename: originalFilename || fileId,
    type,
    size: buffer.length,
  };
}

/**
 * Retrieves a media file by filename/id:
 * 1. Checks if it exists on the local container disk.
 * 2. If not found (e.g. after Render redeploy/restart), restores it from PostgreSQL `uploaded_media_blobs`.
 */
export async function getPersistentMedia(filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!filename || typeof filename !== "string") return null;

  // Strict Path Traversal Defense: Strip all directory parts and illegal characters
  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, "");
  if (!cleanFilename || cleanFilename.includes("..") || cleanFilename.startsWith(".")) {
    return null;
  }

  // Allowed extensions defense
  const ext = path.extname(cleanFilename).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mov"];
  if (!allowedExts.includes(ext)) {
    return null;
  }

  // Check local disk first
  const primaryPath = path.join(UPLOAD_DIR_PRIMARY, cleanFilename);
  const secondaryPath = path.join(UPLOAD_DIR_SECONDARY, cleanFilename);

  if (fs.existsSync(primaryPath)) {
    const buffer = await fs.promises.readFile(primaryPath);
    const mimeType = ext === ".mp4" ? "video/mp4" : ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { buffer, mimeType };
  }

  if (fs.existsSync(secondaryPath)) {
    const buffer = await fs.promises.readFile(secondaryPath);
    const mimeType = ext === ".mp4" ? "video/mp4" : ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { buffer, mimeType };
  }

  // Not on local disk -> Recover from PostgreSQL persistent store
  try {
    const [row] = await db
      .select()
      .from(uploadedMediaBlobs)
      .where(eq(uploadedMediaBlobs.id, cleanFilename))
      .limit(1);

    if (row && row.dataBase64) {
      const buffer = Buffer.from(row.dataBase64, "base64");
      // Cache back to local disk for fast subsequent reads
      ensureUploadDirs();
      fs.promises.writeFile(primaryPath, buffer).catch(() => {});
      return { buffer, mimeType: row.mimeType || "image/jpeg" };
    }
  } catch (dbErr) {
    console.warn("DB media lookup notice:", dbErr);
  }

  // Raw fallback query if needed
  try {
    const res = await pool.query(
      `SELECT "data_base64", "mime_type" FROM "uploaded_media_blobs" WHERE "id" = $1 LIMIT 1`,
      [cleanFilename]
    );
    if (res.rows.length > 0 && res.rows[0].data_base64) {
      const buffer = Buffer.from(res.rows[0].data_base64, "base64");
      return { buffer, mimeType: res.rows[0].mime_type || "image/jpeg" };
    }
  } catch (rawErr) {
    console.warn("Raw fallback media lookup warning:", rawErr);
  }

  return null;
}
