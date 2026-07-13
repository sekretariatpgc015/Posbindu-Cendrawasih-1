import express from "express";
import path from "path";

// Fetch CSV data using native global fetch
async function fetchCsvFromSheets(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/csv,text/plain,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`Request to Google Sheets failed. Status Code: ${response.status} ${response.statusText}`);
  }

  return response.text();
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
    const { createServer: createViteServer } = await import("vite");
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
