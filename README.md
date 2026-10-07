# SilentTalk

**Two-way communication using Indian Sign Language recognition, translated into Tulu.**

ಸೈಲೆಂಟ್‌ಟಾಕ್: ಭಾರತೀಯ ಸಂಜ್ಞಾ ಭಾಷೆ ಗುರುತು ಮಲ್ತ್‌ದ್ ತುಳುಟು ರಡ್ಡ್ ದಿಕ್ಕ್‌ದ ಸಂವಾದ

A browser app for a signer and a Tulu speaker:

1. **ISL → Tulu** — webcam + MediaPipe Hands classifies handshapes and speaks/shows Tulu (Kannada script + romanization).
2. **Text/speech → ISL** — English or Tulu is matched to a Tulunadu lexicon and played as an animated ISL hand. Unknown words are fingerspelled.

## Run it

Chrome or Edge is required for the camera and microphone.

**Do not open `index.html` as a file.** The webcam is blocked on `file://`. Serve the folder:

### Option A — VS Code Live Server
Right-click `index.html` → Open with Live Server.

### Option B — Python (if installed)
```bash
python -m http.server 8080
```
Then open http://localhost:8080

### Option C — PowerShell (this PC)
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Then open http://localhost:8080

Allow camera when the browser asks.

## What the recognizer knows

The camera model is a nearest-centroid classifier on five finger-extension scores (joint angles from 21 MediaPipe landmarks). The same function scores the webcam and `dataset/samples.json`, so a clear handshape gets the dataset label. Inference is a few distance calculations — typically well under 1 ms after the hand tracker runs. A sign commits after 3 agreeing frames (about a tenth of a second). MediaPipe Hands uses its fast model (`modelComplexity: 0`).

Hold the shape steadily in good light, palm facing the camera:

| Dataset id | Handshape | Meaning | Tulu |
| --- | --- | --- | --- |
| HELLO | Open palm, or two open palms together | Hello | ನಮಸ್ಕಾರ |
| YES | Thumb up | Yes | ಅಂದ್ |
| A | Fist | Letter A | ಎ |
| 1 | Index | One | ಒಂಜಿ |
| 2 | Index + middle | Two | ರಡ್ಡ್ |
| WATER | Three fingers | Water | ನೀರ್ |
| B | Four fingers | Letter B | ಬಿ |
| NO | Index + pinky | No | ಇಜ್ಜಿ |
| L | Thumb + index | Letter L | ಎಲ್ |
| Y | Thumb + pinky | Letter Y | ವೈ |
| I | Pinky | Letter I | ಐ |
| GOOD | Thumb + index + middle | Good | ಎಡ್ಡೆ |
| HELP | Two hands close together | Help | ಸಾಯ |

The ISL page scores every saved sample and shows the match rate. Rebuild the file with Node:

```bash
node tools/build-dataset.mjs
```

The lexicon in `js/dictionary.js` holds everyday Tulu lines (Solmelu, Encha ullar, Enk bodu, …). Phrase chips still cover signs the camera does not model as their own handshape (thank you, please, goodbye).

## Project layout

```
index.html
css/styles.css
dataset/samples.json
js/app.js
js/camera.js
js/classifier.js
js/dataset.js
js/dictionary.js
js/eval.js
js/signs.js
js/speech.js
tools/build-dataset.mjs
```

## Academic note

Tulu is written here in **Kannada script**, which is the common digital orthography. Speech uses the browser voice closest to Kannada/Hindi/Indian English, because dedicated Tulu TTS is not built into browsers.
