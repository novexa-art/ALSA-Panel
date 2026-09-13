const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const BOT_1_TOKEN = process.env.BOT_1_TOKEN || "";
const BOT_2_TOKEN = process.env.BOT_2_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function sendTelegram(token, message) {
  if (!token) {
    return { success: false, error: "Bot token missing" };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML"
        })
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.description || "Telegram error"
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

app.get("/", (req, res) => {
  res.json({
    app: "ALSA PANEL Backend",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy"
  });
});

app.post("/api/firebase-connected", async (req, res) => {
  try {
    const {
      event,
      firebaseUrl,
      time
    } = req.body;

    if (event !== "firebase_connected") {
      return res.status(400).json({
        success: false,
        error: "Invalid event"
      });
    }

    if (!firebaseUrl) {
      return res.status(400).json({
        success: false,
        error: "Firebase URL required"
      });
    }

    if (!CHAT_ID) {
      return res.status(500).json({
        success: false,
        error: "TELEGRAM_CHAT_ID not configured"
      });
    }

    const message = `
<b>🔥 ALSA PANEL</b>

<b>Firebase Connected</b>

<b>Firebase URL:</b>
<code>${firebaseUrl}</code>

<b>Time:</b>
<code>${time || new Date().toISOString()}</code>
`;

    const results = await Promise.all([
      sendTelegram(BOT_1_TOKEN, message),
      sendTelegram(BOT_2_TOKEN, message)
    ]);

    const sent = results.filter(
      result => result.success
    ).length;

    res.json({
      success: sent > 0,
      botsSent: sent,
      bot1: results[0].success,
      bot2: results[1].success
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `ALSA PANEL Backend running on port ${PORT}`
  );
});
