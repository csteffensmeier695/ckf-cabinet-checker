const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/check", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({
        error: { message: "ANTHROPIC_API_KEY not configured on server." }
      });
    }

    const anthropic = new Anthropic({
      apiKey
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: req.body.system,
      messages: req.body.messages
    });

    res.json(response);

  } catch (err) {
    console.error("Anthropic error:", err);

    res.status(err.status || 500).json({
      error: {
        message: err.message || "Anthropic request failed"
      }
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`CKF Cabinet Checker running on port ${PORT}`);
});
