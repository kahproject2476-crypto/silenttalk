import { IslCamera } from "./camera.js";
import { glossOf, GLOSS } from "./gloss.js";
import { framePair, FrameBuffer } from "./features.js";
import { centroidsFrom, matchDataset } from "./knn.js";
import { SignStabilizer } from "./classifier.js";
import { speak } from "./speech.js";
import { transcribeBlob } from "./whisper.js";

const $ = (id) => document.getElementById(id);
const views = ["sign", "speech", "data"];

function show(view) {
  for (const name of views) {
    $("view-" + name).classList.toggle("show", name === view);
    document.querySelector(`[data-view="${name}"]`)?.classList.toggle("active", name === view);
  }
}

document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => show(btn.dataset.view));
});

let centroids = null;
let cam = null;
const buffer = new FrameBuffer(10);
const stable = new SignStabilizer(3);
let minConfidence = 0.45;
let missed = 0;

function showSign(id) {
  const gloss = glossOf(id);
  $("gloss").textContent = gloss.en;
  $("liveTulu").textContent = gloss.tulu;
  $("liveNote").textContent = "Confirmed from your dataset. Audio played once.";
  speak(gloss.tulu, "tulu");
}

$("threshold").addEventListener("input", () => {
  minConfidence = Number($("threshold").value) / 100;
  $("thresholdVal").textContent = `${$("threshold").value}%`;
});

$("startCam").addEventListener("click", async () => {
  try {
    if (!cam) {
      cam = new IslCamera({
        video: $("cam"),
        overlay: $("overlay"),
        onStatus: (message) => {
          $("camStatus").textContent = message;
          $("camDot").classList.toggle("on", /on|box/i.test(message));
        },
        onSign: () => {},
        onHands: (hands, sides) => {
          if (!centroids) return;
          if (!hands.length) {
            missed += 1;
            if (missed > 10) buffer.clear();
            $("hudGuess").textContent = "Put the sign inside the box";
            $("confBar").style.width = "0%";
            stable.push(null);
            return;
          }
          missed = 0;
          buffer.push(framePair(hands, sides));
          if (!buffer.ready()) {
            $("hudGuess").textContent = `Reading the sign ${buffer.frames.length}/10`;
            $("confBar").style.width = "0%";
            return;
          }
          const guess = matchDataset(buffer.means(), centroids);
          const pct = Math.round(guess.similarity * 100);
          const gloss = glossOf(guess.label);
          const other = glossOf(guess.second);
          const count = hands.length === 2 ? "two hands" : "one hand";
          $("hudGuess").textContent = `${gloss.en} ${pct}% · ${count}`;
          $("confBar").style.width = `${pct}%`;
          const accepted = guess.similarity >= minConfidence && guess.margin >= 0.28 ? guess.label : null;
          const committed = stable.push(accepted);
          if (!accepted) {
            $("liveNote").textContent = `${gloss.en} and ${other.en} are too close in your dataset. Hold the sign the way that clip was recorded.`;
          }
          if (committed) showSign(committed);
        }
      });
    }
    buffer.frames.length = 0;
    await cam.start();
    $("startCam").disabled = true;
    $("stopCam").disabled = false;
  } catch (err) {
    $("camStatus").textContent = "Allow the camera in Chrome or Edge at http://localhost.";
    console.error(err);
  }
});

$("stopCam").addEventListener("click", () => {
  cam?.stop();
  $("startCam").disabled = false;
  $("stopCam").disabled = true;
});

let recorder = null;
let chunks = [];
let recordStream = null;

$("listenBtn").addEventListener("click", async () => {
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(recordStream);
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      recordStream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      try {
        const text = await transcribeBlob(blob, (message) => {
          $("listenStatus").textContent = message;
        });
        $("transcript").textContent = text || "No speech detected.";
        $("listenStatus").textContent = "Done.";
      } catch (err) {
        $("listenStatus").textContent = "Whisper could not transcribe that clip.";
        console.error(err);
      }
    };
    recorder.start();
    $("listenBtn").disabled = true;
    $("listenStop").disabled = false;
    $("listenStatus").textContent = "Listening… click Stop when the sentence is finished.";
  } catch (err) {
    $("listenStatus").textContent = "Allow the microphone in Chrome or Edge.";
    console.error(err);
  }
});

$("listenStop").addEventListener("click", () => {
  if (recorder && recorder.state === "recording") recorder.stop();
  $("listenBtn").disabled = false;
  $("listenStop").disabled = true;
});

function fillDataset(pack) {
  const box = $("classList");
  box.innerHTML = "";
  const labels = [...new Set(pack.prototypes.map((item) => item.label))];
  for (const id of labels) {
    const gloss = glossOf(id);
    const card = document.createElement("button");
    card.innerHTML = `<strong>${gloss.tulu}</strong><small>${gloss.en}</small>`;
    box.appendChild(card);
  }
  $("dataBlurb").textContent =
    `${pack.prototypes.length} clips from your video_features folder · ${labels.length} signs. A live sign is accepted only when it is close to one of these clips.`;
  $("modelStatus").textContent =
    `Matching your ${pack.prototypes.length} recorded clips across ${labels.length} signs.`;
}

fetch("model/prototypes.json")
  .then((res) => {
    if (!res.ok) throw new Error("missing prototypes");
    return res.json();
  })
  .then((pack) => {
    centroids = centroidsFrom(pack.prototypes);
    fillDataset(pack);
  })
  .catch((err) => {
    $("modelStatus").textContent = "Your clip library was not found.";
    console.error(err);
  });

show("sign");
void GLOSS;
