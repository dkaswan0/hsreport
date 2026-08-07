import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

(async () => {
  console.log("Testing fast bulk IMAP Autel matching...");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: {
      user: "autelhighsafety@gmail.com",
      pass: "azpbijvfdfpjntnr"
    },
    logger: false,
  });

  const targetMake = "Toyota";
  const targetModel = "";
  const targetYear = "";
  const targetVin = "";

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const seqList = await client.search({ all: true });
      const list = Array.isArray(seqList) ? seqList : [];
      console.log(`Total messages in INBOX: ${list.length}`);
      const recentSeqs = list.slice(-200).reverse();

      console.time("BulkFetchHeader");
      const headers = [];
      for await (const msg of client.fetch(recentSeqs.join(","), { envelope: true, bodyStructure: true })) {
        headers.push(msg);
      }
      console.timeEnd("BulkFetchHeader");

      // Filter messages with PDF attachments
      const pdfMsgs = headers.filter(m => {
        const bs = JSON.stringify(m.bodyStructure || {}).toLowerCase();
        return bs.includes("pdf") || bs.includes("attachment");
      });

      console.log(`Found ${pdfMsgs.length} emails with attachments out of 200 recent emails.`);

      const PDF_TYPES = ["application/pdf", "application/x-pdf", "application/octet-stream", "binary/octet-stream"];
      const candidates = [];

      for (const meta of pdfMsgs) {
        const msg = await client.fetchOne(String(meta.seq), { source: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        if (!parsed.attachments) continue;

        let pdfAttachment = null;
        for (const att of parsed.attachments) {
          const isPdfByType = PDF_TYPES.includes(att.contentType?.toLowerCase() || "");
          const isPdfByName = att.filename?.toLowerCase().endsWith(".pdf");
          if (isPdfByType || isPdfByName) {
            pdfAttachment = att;
            break;
          }
        }

        if (!pdfAttachment) continue;

        const filename = pdfAttachment.filename || "autel-report.pdf";
        const rawContent = pdfAttachment.content.toString("latin1");
        const combinedText = `${parsed.subject || ''} ${filename} ${rawContent}`.toLowerCase();
        const combinedUpper = `${parsed.subject || ''} ${filename} ${rawContent}`.toUpperCase();

        let score = 0;
        let reason = "";

        if (targetVin && targetVin.length >= 10 && combinedUpper.includes(targetVin)) {
          score = 100;
          reason = `مطابقة تامة برقم الهيكل (${targetVin})`;
        } else {
          if (targetMake && combinedText.includes(targetMake.toLowerCase())) score += 40;
          if (targetModel && combinedText.includes(targetModel.toLowerCase())) score += 40;
          if (targetYear && combinedText.includes(targetYear)) score += 20;
          reason = `مطابقة مواصفات السيارة (${targetMake} ${targetModel} ${targetYear})`;
        }

        if (score >= 40) {
          candidates.push({ seq: meta.seq, filename, score, reason, date: parsed.date });
          console.log(`[MATCH FOUND] Seq ${meta.seq} ("${filename}") Date: ${parsed.date} -> Score: ${score}%`);
          if (score === 100) break;
        }
      }

      console.log(`Total matching candidate reports: ${candidates.length}`);
    } finally {
      await lock.release();
      await client.logout();
    }
  } catch (err) {
    console.error("IMAP Error:", err);
  }
})();
