import dns from "dns/promises";
import net from "net";

/**
 * Faz deep check SMTP (best effort).
 * Retorna true se o servidor aceitou RCPT TO,
 * false em caso de rejeição/erro/timeout.
 */
export async function smtpCheck(
  email: string,
  domain: string,
  timeoutMs = 5000
): Promise<boolean> {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return false;

    const mx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

    return await new Promise((resolve) => {
      const client = net.createConnection(25, mx);
      let stage = 0;
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          client.destroy();
          resolve(false);
        }
      }, timeoutMs);

      client.on("data", (buffer) => {
        const msg = buffer.toString();

        if (stage === 0 && msg.startsWith("220")) {
          client.write("HELO valid-email.js\r\n");
          stage++;
        } else if (stage === 1 && msg.startsWith("250")) {
          client.write("MAIL FROM:<noreply@valid-email.js>\r\n");
          stage++;
        } else if (stage === 2 && msg.startsWith("250")) {
          client.write(`RCPT TO:<${email}>\r\n`);
          stage++;
        } else if (stage === 3) {
          clearTimeout(timer);
          finished = true;
          client.end("QUIT\r\n");
          resolve(msg.startsWith("250"));
        }
      });

      client.on("error", () => {
        if (!finished) {
          clearTimeout(timer);
          finished = true;
          resolve(false);
        }
      });

      client.on("end", () => {
        if (!finished) {
          clearTimeout(timer);
          finished = true;
          resolve(false);
        }
      });
    });
  } catch {
    return false;
  }
}
