const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

//app.get("/api/debug-key", (req, res) => {
 //const key = process.env.ANTHROPIC_API_KEY || "";
 // res.json({
  //  exists: !!key,
  //  length: key.length,
  //  startsWith: key.substring(0, 12),
  //  hasSpaces: key !== key.trim()
 // });
//});

app.post("/api/check", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log("API key exists:", !!apiKey);
  console.log("API key prefix:", apiKey?.substring(0, 12));

  if (!apiKey) {
    return res.status(500).json({
      error: { message: "API key not configured on server." }
    });
  }

  const body = JSON.stringify({
    model: "claude-sonnet-4-5",
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
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";

    proxyRes.on("data", (chunk) => {
      data += chunk;
    });

    proxyRes.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        res.status(proxyRes.statusCode || 200).json(parsed);
      } catch (e) {
        res.status(500).json({
          error: {
            message: "Failed to parse Anthropic response.",
            raw: data
          }
        });
      }
    });
  });

  proxyReq.on("error", (e) => {
    res.status(500).json({
      error: { message: e.message }
    });
  });

  proxyReq.write(body);
  proxyReq.end();
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`CKF Cabinet Checker running on port ${PORT}`);
});
