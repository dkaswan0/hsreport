import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

(async () => {
  console.log("Searching for Autel reports with attachments...");
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
      console.log(`Total INBOX messages: ${list.length}`);

      // Search through recent 100 messages for attachments
      const recent = list.slice(-100).reverse();
      let foundWithPdf = 0;

      for (const seq of recent) {
        const msg = await client.fetchOne(String(seq), { source: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        if (parsed.attachments && parsed.attachments.length > 0) {
          foundWithPdf++;
          console.log(`\n--- Found Email (Seq ${seq}) ---`);
          console.log(`  Subject: "${parsed.subject}"`);
          console.log(`  From: "${parsed.from?.text}"`);
          console.log(`  Date: "${parsed.date}"`);
          for (const att of parsed.attachments) {
            console.log(`  -> Attachment: filename="${att.filename}" contentType="${att.contentType}" size=${att.size}`);
          }
          if (foundWithPdf >= 5) break;
        }
      }

      if (foundWithPdf === 0) {
        console.log("\nNo messages with attachments found in last 100 emails.");
      }
    } finally {
      await lock.release();
      await client.logout();
    }
  } catch (err) {
    console.error("IMAP Error:", err);
  }
})();
