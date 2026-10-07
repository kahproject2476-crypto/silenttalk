"""Export one feature vector per clip so live prediction can match the dataset directly."""
import json
from pathlib import Path

import numpy as np

ROOT = Path(r"C:\Users\manoj\Downloads\video_features\video_features")
OUT = Path(__file__).resolve().parents[1] / "model" / "prototypes.json"


def clip_vector(clip):
    hands = clip[:, :126]
    present = np.abs(hands).sum(axis=1) > 0.05
    if present.sum() < 5:
        present = np.ones(len(clip), dtype=bool)
    return hands[present].mean(axis=0)


def main():
    prototypes = []
    for label in sorted(path.name for path in ROOT.iterdir() if path.is_dir()):
        for file in sorted((ROOT / label).glob("*.npy")):
            vec = np.round(clip_vector(np.load(file)), 4)
            prototypes.append({"label": label, "v": vec.tolist()})
    payload = {
        "source": str(ROOT),
        "clips": len(prototypes),
        "prototypes": prototypes,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"wrote {len(prototypes)} prototypes to {OUT}")


if __name__ == "__main__":
    main()
