import { ImageAnalysisService } from "../server/services/image-analysis";

export interface CandidateEmail {
  seq: number;
  subject: string;
  filename: string;
  pdfContent: Buffer;
  textSnippet: string;
}

export async function findBestMatchingAutelEmail(
  target: { vin?: string; make?: string; model?: string; year?: number; customerName?: string },
  candidates: CandidateEmail[]
): Promise<{ best: CandidateEmail | null; score: number; reason: string }> {
  if (candidates.length === 0) {
    return { best: null, score: 0, reason: "لا توجد رسائل في البريد الوارد" };
  }

  const normalizedVin = target.vin?.toUpperCase().trim() || "";
  const normalizedMake = target.make?.toLowerCase().trim() || "";
  const normalizedModel = target.model?.toLowerCase().trim() || "";
  const normalizedYear = target.year ? String(target.year) : "";

  console.log(`[AI Autel Matcher] Target Vehicle: VIN="${normalizedVin}", Make="${target.make}", Model="${target.model}", Year="${target.year}"`);

  let bestCandidate: CandidateEmail | null = null;
  let highestScore = 0;
  let bestReason = "";

  for (const candidate of candidates) {
    let score = 0;
    const combinedText = `${candidate.subject} ${candidate.filename} ${candidate.textSnippet}`.toLowerCase();
    const combinedUpper = `${candidate.subject} ${candidate.filename} ${candidate.textSnippet}`.toUpperCase();

    // 1. VIN Exact Match (100% confidence match)
    if (normalizedVin && normalizedVin.length >= 10 && combinedUpper.includes(normalizedVin)) {
      score += 100;
      bestReason = `مطابقة تامة برقم الهيكل (VIN: ${normalizedVin})`;
    } else {
      // 2. Make Match
      if (normalizedMake && normalizedMake.length > 1 && combinedText.includes(normalizedMake)) {
        score += 40;
      }
      // 3. Model Match
      if (normalizedModel && normalizedModel.length > 1 && combinedText.includes(normalizedModel)) {
        score += 40;
      }
      // 4. Year Match
      if (normalizedYear && combinedText.includes(normalizedYear)) {
        score += 20;
      }
      // 5. Customer Name Match
      if (target.customerName && combinedText.includes(target.customerName.toLowerCase())) {
        score += 20;
      }
    }

    console.log(`  Candidate seq=${candidate.seq} ("${candidate.subject}") -> Score=${score}`);

    if (score > highestScore) {
      highestScore = score;
      bestCandidate = candidate;
      if (!bestReason) {
        bestReason = `مطابقة المواصفات (${target.make || ''} ${target.model || ''} ${target.year || ''}) بنسبة ${score}%`;
      }
    }
  }

  // If highest score < 30, try AI prompt for fuzzy reasoning if candidate list has items
  if (highestScore < 30 && candidates.length > 0) {
    try {
      const candidatesSummary = candidates.slice(0, 8).map((c, idx) => `Index ${idx}: Subject: "${c.subject}", Filename: "${c.filename}", Snippet: "${c.textSnippet.substring(0, 100)}"`).join("\n");
      const prompt = `Target Vehicle Specs: Make="${target.make}", Model="${target.model}", Year="${target.year}", VIN="${target.vin}".
Candidates from email inbox:
${candidatesSummary}

Identify which candidate index (0-${candidates.length - 1}) matches the target vehicle best.
Return ONLY JSON: {"bestIndex": number_or_minus1, "confidence": number_0_to_100, "reason": "..."}`;

      const aiRes = await ImageAnalysisService.callAI(prompt);
      if (aiRes && typeof aiRes.bestIndex === 'number' && aiRes.bestIndex >= 0 && aiRes.bestIndex < candidates.length && aiRes.confidence >= 40) {
        bestCandidate = candidates[aiRes.bestIndex];
        highestScore = aiRes.confidence;
        bestReason = `مطابقة عبر الذكاء الاصطناعي: ${aiRes.reason || 'تطابق الموديل بالمحتوى'}`;
      }
    } catch (err: any) {
      console.warn("AI Email Matching fallback skipped:", err?.message || err);
    }
  }

  return { best: bestCandidate, score: highestScore, reason: bestReason };
}
