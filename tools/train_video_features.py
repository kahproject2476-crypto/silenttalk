"""Train SilentTalk on the video_features dataset and write browser weights."""
import json
import os
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

ROOT = Path(r"C:\Users\manoj\Downloads\video_features\video_features")
OUT = Path(__file__).resolve().parents[1] / "model" / "video-model.json"


def hand_vector(clip):
    """Mean of the two wrist-normalized hands. The last 48 numbers are pose extras."""
    return clip[:, :126].mean(axis=0)


def main():
    xs = []
    ys = []
    for label in sorted(p.name for p in ROOT.iterdir() if p.is_dir()):
        for file in sorted((ROOT / label).glob("*.npy")):
            clip = np.load(file)
            if clip.shape != (40, 174):
                raise SystemExit(f"Unexpected shape {clip.shape} in {file}")
            xs.append(hand_vector(clip))
            ys.append(label)
    x = np.asarray(xs, dtype=np.float64)
    y = np.asarray(ys)
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=1, stratify=y
    )
    scaler = StandardScaler().fit(x_train)
    model = MLPClassifier(hidden_layer_sizes=(64,), max_iter=400, random_state=1)
    model.fit(scaler.transform(x_train), y_train)
    pred = model.predict(scaler.transform(x_test))
    acc = accuracy_score(y_test, pred)
    print(f"clips {len(y)} classes {len(model.classes_)}")
    print(f"held-out {len(y_test)} accuracy {acc:.4f}")
    print(classification_report(y_test, pred, digits=3))

    payload = {
        "source": str(ROOT),
        "clips": int(len(y)),
        "frames": 40,
        "handFeatures": 126,
        "heldOut": int(len(y_test)),
        "accuracy": float(acc),
        "classes": model.classes_.tolist(),
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "w1": model.coefs_[0].tolist(),
        "b1": model.intercepts_[0].tolist(),
        "w2": model.coefs_[1].tolist(),
        "b2": model.intercepts_[1].tolist(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
