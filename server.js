const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const { VoiceResponse } = twilio.twiml;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const MY_CELL = process.env.MY_CELL;

// Helper: respond with TwiML
function sendTwiML(res, twiml) {
  res.type("text/xml");
  res.send(twiml.toString());
}

// Root test route
app.get("/", (req, res) => {
  res.send("AI call screener is running successfully!");
});

// Voice endpoint (supports GET + POST)
function handleVoice(req, res) {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: "speech dtmf",
    numDigits: 1,
    timeout: 3,
    action: "/route",
    method: "POST"
  });
  gather.say("Hi, you have reached your assistant. If this is urgent, press 1 or say urgent. Otherwise, please leave a short message after the tone.");
  twiml.redirect({ method: "POST" }, "/voicemail");
  sendTwiML(res, twiml);
}
app.get("/voice", handleVoice);
app.post("/voice", handleVoice);

// Route endpoint
function handleRoute(req, res) {
  const twiml = new VoiceResponse();
  const digit = (req.body.Digits || "").trim();
  const speech = (req.body.SpeechResult || "").toLowerCase();

  if (digit === "1" || speech.includes("urgent")) {
    twiml.say("Thank you. Connecting you now.");
    twiml.dial(MY_CELL);
  } else {
    twiml.redirect({ method: "POST" }, "/voicemail");
  }
  sendTwiML(res, twiml);
}
app.get("/route", handleRoute);
app.post("/route", handleRoute);

// Voicemail endpoint
function handleVoicemail(req, res) {
  const twiml = new VoiceResponse();
  twiml.say("Please leave your name, number, and a brief message after the tone.");
  twiml.record({
    maxLength: 60,
    playBeep: true,
    action: "/goodbye",
    method: "POST"
  });
  sendTwiML(res, twiml);
}
app.get("/voicemail", handleVoicemail);
app.post("/voicemail", handleVoicemail);

// Goodbye endpoint
function handleGoodbye(req, res) {
  const twiml = new VoiceResponse();
  twiml.say("Thank you. Goodbye.");
  sendTwiML(res, twiml);
}
app.get("/goodbye", handleGoodbye);
app.post("/goodbye", handleGoodbye);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
