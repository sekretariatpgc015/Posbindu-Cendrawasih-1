import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { createServer as createViteServer } from "vite";

// Robust HTTP/HTTPS request helper that handles redirects and sets standard browser User-Agent
function fetchCsvFromSheets(url: string, redirectCount = 0): Promise<string> {
  if (redirectCount > 10) {
    return Promise.reject(new Error("Too many redirects"));
  }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/csv,text/plain,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    };

    const req = client.get(options, (res) => {
      const { statusCode } = res;

      // Handle redirects (status 301, 302, 303, 307, 308)
      if (statusCode && statusCode >= 300 && statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
          // Resolve relative URL
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        fetchCsvFromSheets(redirectUrl, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (statusCode !== 200) {
        reject(new Error(`Request to Google Sheets failed. Status Code: ${statusCode}`));
        return;
      }

      res.setEncoding("utf8");
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        resolve(rawData);
      });
    });

    req.on("error", (e) => {
      reject(e);
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy Google Sheet Warga (Citizens) to bypass CORS and iframe sandbox restrictions
  app.get("/api/proxy-warga", async (req, res) => {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYG3FkCHn7OXTyiLCtqdLwFkFexQQVXVlPtwpxIOlzWt3mpcCZbMyYDp2p4PabbbQnB1GciwkokN20/pub?gid=1055267267&single=true&output=csv';
      const text = await fetchCsvFromSheets(url);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(text);
    } catch (err: any) {
      console.error("Proxy warga failed:", err);
      res.status(500).json({ error: err.message || "Failed to fetch warga from Google Sheets" });
    }
  });

  // Proxy Google Sheet Kunjungan (Visits) to bypass CORS and iframe sandbox restrictions
  app.get("/api/proxy-kunjungan", async (req, res) => {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYG3FkCHn7OXTyiLCtqdLwFkFexQQVXVlPtwpxIOlzWt3mpcCZbMyYDp2p4PabbbQnB1GciwkokN20/pub?gid=0&single=true&output=csv';
      const text = await fetchCsvFromSheets(url);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(text);
    } catch (err: any) {
      console.error("Proxy kunjungan failed:", err);
      res.status(500).json({ error: err.message || "Failed to fetch kunjungan from Google Sheets" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
