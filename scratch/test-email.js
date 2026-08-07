import { ImapFlow } from "imapflow";

(async () => {
  console.log("Testing Gmail IMAP login for autelhighsafety@gmail.com...");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: {
      user: "autelhighsafety@gmail.com",
      pass: "Mhmed1@#$"
    },
    logger: false,
  });

  try {
    await client.connect();
    console.log("[PASS] Gmail IMAP connected successfully!");
    const lock = await client.getMailboxLock("INBOX");
    try {
      const seqList = await client.search({ all: true });
      const list = Array.isArray(seqList) ? seqList : [];
      console.log(`Found ${list.length} total messages in INBOX`);
    } finally {
      await lock.release();
      await client.logout();
    }
  } catch (err) {
    console.error("[FAIL] Gmail IMAP Error:", err.message);
  }
})();
