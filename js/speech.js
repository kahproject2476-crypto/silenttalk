export function speak(text, langHint = "en") {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const pick =
    (langHint === "tulu"
      ? voices.find((v) => /kn-IN|hi-IN|ta-IN|te-IN|en-IN/i.test(v.lang))
      : voices.find((v) => /en-IN|en-GB|en-US/i.test(v.lang))) || voices[0];
  if (pick) u.voice = pick;
  u.lang = pick?.lang || (langHint === "tulu" ? "hi-IN" : "en-IN");
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

export function listenEnglish(onText, onStatus) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    onStatus("Speech recognition is not available in this browser. Use Chrome.");
    return { stop() {} };
  }
  const rec = new Rec();
  rec.lang = "en-IN";
  rec.interimResults = false;
  rec.onresult = (e) => {
    const said = e.results[0][0].transcript;
    onText(said);
  };
  rec.onerror = () => onStatus("Mic listening failed.");
  rec.onend = () => onStatus("Listening stopped.");
  rec.start();
  onStatus("Listening for English…");
  return rec;
}
