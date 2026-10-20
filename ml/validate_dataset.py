"""Dataset validation & data-quality report for the Autism Facial Recognition Dataset."""
import hashlib
import json
import os
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import numpy as np
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = False
Image.MAX_IMAGE_PIXELS = 80_000_000

ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent / "datasets" / "archive (1)" / "Autism Facial Recognition Dataset_Augmented"
OUT = ML_DIR / "reports"
OUT.mkdir(parents=True, exist_ok=True)

CLASSES = ["anger", "fear", "joy", "Natural", "sadness", "surprise"]
SPLITS = ["train", "test"]


def file_hash(path, chunk=1 << 16):
    h = hashlib.md5()
    with open(path, "rb") as f:
        while block := f.read(chunk):
            h.update(block)
    return h.hexdigest()


def main():
    report = {}
    per_class_counts = {}
    total_files = 0
    total_bytes = 0
    corrupt = []
    unreadable = []
    not_rgb = Counter()
    sizes = defaultdict(list)

    all_files = sorted(
        filter(lambda p: p.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp"}, Path(ROOT).rglob("*"))
    )

    for fp in all_files:
        pieces = fp.relative_to(ROOT).parts
        if len(pieces) < 3 or pieces[0] not in SPLITS or pieces[1] not in CLASSES:
            continue
        split, cls = pieces[0], pieces[1]
        total_files += 1
        total_bytes += fp.stat().st_size
        per_class_counts[(split, cls)] = per_class_counts.get((split, cls), 0) + 1
        try:
            with Image.open(fp) as im:
                im.verify()
        except Exception as exc:  # noqa: BLE001
            corrupt.append((str(fp.relative_to(ROOT)), str(exc)))
            continue
        try:
            with Image.open(fp) as im:
                img = im.convert("RGB")
                sizes[(split, cls)].append(img.size)
                if im.mode != "RGB":
                    not_rgb[im.mode] += 1
        except Exception as exc:  # noqa: BLE001
            unreadable.append((str(fp.relative_to(ROOT)), str(exc)))

    # duplicates within a class and across the whole dataset
    dup_within = Counter()
    dup_examples = []
    seen = {}
    for split in SPLITS:
        for cls in CLASSES:
            hashes = Counter()
            for fp in sorted((ROOT / split / cls).glob("*")):
                if fp.suffix.lower() != ".jpg":
                    continue
                h = file_hash(fp)
                hashes[h] += 1
                if h in seen:
                    dup_examples.append((h, cls, fp.name, seen[h]))
                else:
                    seen[h] = (split, cls, fp.name)
            dup_within[cls] += sum(1 for c in hashes.values() if c > 1)

    sizes_flat = []
    min_w = min_h = 10**9
    max_w = max_h = 0
    for key, vals in sizes.items():
        for w, h in vals:
            sizes_flat.append((w, h))
            min_w, min_h = min(min_w, w), min(min_h, h)
            max_w, max_h = max(max_w, w), max(max_h, h)

    widths = [s[0] for s in sizes_flat]
    heights = [s[1] for s in sizes_flat]

    report = {
        "dataset": ROOT.name,
        "total_images": total_files,
        "total_size_mb": round(total_bytes / 1024 / 1024, 1),
        "classes": CLASSES,
        "splits": SPLITS,
        "per_split_class_counts": {
            split: {cls: per_class_counts.get((split, cls), 0) for cls in CLASSES} for split in SPLITS
        },
        "class_ratios_min_max": None,
        "corrupt_files": corrupt[:50],
        "corrupt_count": len(corrupt),
        "unreadable_files": len(unreadable),
        "duplicates_within_class": dict(dup_within),
        "duplicate_examples_sample": dup_examples[:20],
        "duplicate_pairs_count": len(dup_examples),
        "mode_counts": dict(not_rgb),
        "size_px": {
            "min": [min_w, min_h],
            "max": [max_w, max_h],
            "median": [int(np.median(widths)), int(np.median(heights))],
            "mean": [round(float(np.mean(widths)), 1), round(float(np.mean(heights)), 1)],
            "std": [round(float(np.std(widths)), 1), round(float(np.std(heights)), 1)],
        },
    }

    cls_totals = {cls: sum(per_class_counts.get((s, cls), 0) for s in SPLITS) for cls in CLASSES}
    if cls_totals:
        most = max(cls_totals, key=cls_totals.get)
        least = min(cls_totals, key=cls_totals.get)
        report["class_ratios_min_max"] = {
            "largest": {"class": most, "count": cls_totals[most]},
            "smallest": {"class": least, "count": cls_totals[least]},
            "ratio": round(cls_totals[most] / cls_totals[least], 2),
        }

    (OUT / "dataset_validation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("=" * 72)
    print("DATASET VALIDATION REPORT")
    print("=" * 72)
    print(f"Dataset      : {ROOT.name}")
    print(f"Total images : {total_files}  ({report['total_size_mb']} MB)")
    print()
    print("Class distribution (train / test / total):")
    for cls in CLASSES:
        tr = per_class_counts.get(("train", cls), 0)
        te = per_class_counts.get(("test", cls), 0)
        print(f"  {cls:<10} train={tr:>5}  test={te:>5}  total={tr + te:>5}")
    print()
    if report["class_ratios_min_max"]:
        r = report["class_ratios_min_max"]
        print(f"Imbalance: {r['largest']['class']}={r['largest']['count']} vs "
              f"{r['smallest']['class']}={r['smallest']['count']}  (ratio {r['ratio']}x)")
    print()
    s = report["size_px"]
    print(f"Image size  : min={s['min']} max={s['max']} median={s['median']} "
          f"mean={s['mean']} std={s['std']}")
    print(f"Modes       : {report['mode_counts'] or 'all RGB'}")
    print()
    print(f"Corrupt     : {report['corrupt_count']}  Unreadable: {report['unreadable_files']}")
    print(f"Duplicate files same-size-hash within class: {report['duplicates_within_class']}")
    print(f"Duplicate pairs across splits/classes       : {report['duplicate_pairs_count']}")
    print()
    print(f"Report saved -> {OUT / 'dataset_validation.json'}")
    print("=" * 72)


if __name__ == "__main__":
    main()