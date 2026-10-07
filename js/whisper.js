let asrPromise = null;

function loadWhisper() {
  if (!asrPromise) {
    asrPromise = import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2").then(async ({ pipeline, env }) => {
      env.allowLocalModels = false;
      return pipeline("automatic-speech-recognition", "Xenova/whisper-tiny");
    });
  }
  return asrPromise;
}

function resample(channel, fromRate, toRate) {
  if (fromRate === toRate) return channel;
  const length = Math.round(channel.length * toRate / fromRate);
  const out = new Float32Array(length);
  const step = fromRate / toRate;
  for (let i = 0; i < length; i++) {
    const pos = i * step;
    const left = Math.floor(pos);
    const right = Math.min(channel.length - 1, left + 1);
    const mix = pos - left;
    out[i] = channel[left] * (1 - mix) + channel[right] * mix;
  }
  return out;
}

async function blobTo16k(blob) {
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(await blob.arrayBuffer());
  const channel = decoded.getChannelData(0);
  const audio = resample(channel, decoded.sampleRate, 16000);
  await audioCtx.close();
  return audio;
}

export async function transcribeBlob(blob, onStatus) {
  onStatus("Loading Whisper. The first run downloads the model.");
  const asr = await loadWhisper();
  onStatus("Transcribing…");
  const audio = await blobTo16k(blob);
  const out = await asr(audio, { language: "english", task: "transcribe" });
  return (out.text || "").trim();
}
