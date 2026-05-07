const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Proxy endpoint — keeps API key server-side
app.post("/api/check", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "API key not configured on server." } });

  const body = JSON.stringify({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8000,
    system: req.body.system,
    messages: req.body.messages,
  });

  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", (chunk) => (data += chunk));
    proxyRes.on("end", () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: { message: "Failed to parse Anthropic response." } });
      }
    });
  });

  proxyReq.on("error", (e) => res.status(500).json({ error: { message: e.message } }));
  proxyReq.write(body);
  proxyReq.end();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`CKF Cabinet Checker running on port ${PORT}`));
