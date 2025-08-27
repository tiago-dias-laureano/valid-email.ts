import https from "https";

let cachedTLDs: string[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h em ms

/**
 * Busca lista de TLDs oficiais da IANA
 * Usa cache em memória por 24h
 */
export async function fetchTLDs(): Promise<string[]> {
  const now = Date.now();

  if (cachedTLDs && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
    return cachedTLDs;
  }

  return new Promise((resolve, reject) => {
    https
      .get("https://data.iana.org/TLD/tlds-alpha-by-domain.txt", (res) => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Failed to fetch TLDs. Status: ${res.statusCode}`)
          );
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const list = data
            .split("\n")
            .filter((line) => line && !line.startsWith("#"))
            .map((tld) => tld.trim().toUpperCase());

          cachedTLDs = list;
          lastFetchTime = now;
          resolve(list);
        });
      })
      .on("error", (err) => reject(err));
  });
}
