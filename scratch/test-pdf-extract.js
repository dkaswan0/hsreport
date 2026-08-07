import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

function extractPdfText(buffer) {
  try {
    const raw = buffer.toString("latin1");
    // Find strings inside PDF parentheses
    const matches = raw.match(/\(([^()]{3,100})\)/g) || [];
    const text = matches.map(m => m.slice(1, -1)).join(" ");
    if (text.length > 10) return text;
  } catch (e) {}
  return buffer.toString("utf8");
}

(async () => {
  console.log("Testing zero-dependency PDF text extraction...");
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

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const seqList = await client.search({ all: true });
      const list = Array.isArray(seqList) ? seqList : [];
      console.log(`Total messages in INBOX: ${list.length}`);
      const recent = list.slice(-100).reverse();

      for (const seq of recent) {
        const msg = await client.fetchOne(String(seq), { source: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const att of parsed.attachments) {
            if (att.filename?.endsWith(".pdf") || att.contentType?.includes("pdf")) {
              console.log(`\n========================================`);
              console.log(`Attachment: "${att.filename}" (${att.size} bytes)`);
              const text = extractPdfText(att.content);
              console.log(`Extracted Text Snippet (first 400 chars):`);
              console.log(text.substring(0, 400));

              // Search for VIN pattern (17 alphanumeric)
              const vinMatch = att.content.toString("latin1").match(/[A-HJ-NPR-Z0-9]{17}/g);
              if (vinMatch) {
                console.log(`VINs found in buffer:`, Array.from(new Set(vinMatch)));
              }
              break;
            }
          }
        }
      }
    } finally {
      await lock.release();
      await client.logout();
    }
  } catch (err) {
    console.error("IMAP Error:", err);
  }
})();
