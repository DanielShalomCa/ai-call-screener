const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const { VoiceResponse } = twilio.twiml;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Your iPhone number in international format, e.g. +1506XXXXXXX
const MY_CELL = process.env.MY_CELL;

app.get("/", (req, res) => {
  res.send("AI call screener is running successfully!");
});

app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: "speech dtmf",
    numDigits: 1,
    timeout: 3,
    action: "/route"
  });

  gather.say(
    "Hi, you have reached your assistant. " +
    "If this is urgent, press 1 or say urgent. " +
    "Otherwise, please leave a short message after the tone."
  );

  twiml.redirect("/voicemail");
  res.type("text/xml").send(twiml.toString());
});

app.post("/route", (req, res) => {
  const twiml = new VoiceResponse();
  const digit = (req.body.Digits || "").trim();
  const speech = (req.body.SpeechResult || "").toLowerCase();

  if (digit === "1" || speech.includes("urgent")) {
    twiml.say("Thank you. Connecting you now.");
    twiml.dial(MY_CELL);
  } else {
    twiml.redirect("/voicemail");
  }

  res.type("text/xml").send(twiml.toString());
});

app.post("/voicemail", (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say("Please leave your name, number, and a brief message after the tone.");
  twiml.record({
    maxLength: 60,
    playBeep: true,
    action: "/goodbye"
  });
  res.type("text/xml").send(twiml.toString());
});

app.post("/goodbye", (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say("Thank you. Goodbye.");
  res.type("text/xml").send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
