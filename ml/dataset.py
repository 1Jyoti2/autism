import random
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset, TensorDataset, Subset

from config import CLASSES, IMAGENET_MEAN, IMAGENET_STD, IMG_SIZE, SEED


def set_seed(seed=SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def _scan(root):
    class_to_idx = {c: i for i, c in enumerate(CLASSES)}
    paths, labels = [], []
    for cls in CLASSES:
        folder = Path(root) / cls
        if not folder.exists():
            continue
        for fp in sorted(folder.glob("*")):
            if fp.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp"}:
                paths.append(str(fp))
                labels.append(class_to_idx[cls])
    return paths, np.asarray(labels, dtype=np.int64)


def build_cache(root, out_file):
    paths, labels = _scan(root)
    images = np.empty((len(paths), 3, IMG_SIZE, IMG_SIZE), dtype=np.uint8)
    for i, p in enumerate(paths):
        with Image.open(p) as im:
            img = im.convert("RGB").resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
        images[i] = np.asarray(img, dtype=np.uint8).transpose(2, 0, 1)
    torch.save(
        {"images": torch.from_numpy(images), "labels": torch.from_numpy(labels), "paths": paths},
        out_file,
    )
    print(f"Cache saved -> {out_file} ({len(paths)} images, {IMGSIZE_desc(images)})")


def IMGSIZE_desc(images):
    return f"{tuple(images.shape)}"


def load_cache(cache_file):
    data = torch.load(cache_file, map_location="cpu", weights_only=False)
    return data["images"], data["labels"], data["paths"]


def stratified_split(labels, val_fraction, seed=SEED):
    rng = random.Random(seed)
    per_class = {}
    for i, label in enumerate(labels.tolist()):
        per_class.setdefault(label, []).append(i)
    train_idx, val_idx = [], []
    for label, idxs in per_class.items():
        rng.shuffle(idxs)
        n_val = int(round(len(idxs) * val_fraction))
        val_idx.extend(idxs[:n_val])
        train_idx.extend(idxs[n_val:])
    return sorted(train_idx), sorted(val_idx)


def tensor_augment(x):
    if torch.rand(1).item() < 0.5:
        x = torch.flip(x, dims=[2])
    if torch.rand(1).item() < 0.5:
        angle = (torch.rand(1).item() * 2 - 1) * 8
        x = torchvision_rotate(x, angle)
    if torch.rand(1).item() < 0.6:
        x = color_jitter(x, brightness=0.15, contrast=0.15, saturation=0.15, hue=0.05)
    return x


def torchvision_rotate(x, angle):
    import torchvision.transforms.functional as F

    return F.rotate(x, angle, interpolation=F.InterpolationMode.BILINEAR)


def color_jitter(x, brightness, contrast, saturation, hue):
    xf = x.float()
    if torch.rand(1).item() < 0.5:
        factor = 1.0 + (torch.rand(1).item() * 2 - 1) * brightness
        xf = torch.clamp(xf * factor, 0, 255)
    if torch.rand(1).item() < 0.5:
        mean = xf.mean(dim=(1, 2), keepdim=True)
        factor = 1.0 + (torch.rand(1).item() * 2 - 1) * contrast
        xf = torch.clamp((xf - mean) * factor + mean, 0, 255)
    if torch.rand(1).item() < 0.5:
        factor = 1.0 + (torch.rand(1).item() * 2 - 1) * saturation
        gray = xf.mean(dim=0, keepdim=True)
        xf = torch.clamp(gray + (xf - gray) * factor, 0, 255)
    return xf


class TrainTransform:
    def __call__(self, x):
        return tensor_augment(x).float() / 255.0


class EvalTransform:
    def __call__(self, x):
        return x.float() / 255.0


MEAN_T = torch.tensor(IMAGENET_MEAN).reshape(3, 1, 1)
STD_T = torch.tensor(IMAGENET_STD).reshape(3, 1, 1)


def normalize(x):
    return (x - MEAN_T) / STD_T


class ArrayDataset(Dataset):
    def __init__(self, images, labels, transform=None):
        self.data = images
        self.targets = labels
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        x = self.data[idx]
        if self.transform is not None:
            x = self.transform(x)
        x = normalize(x)
        return x, self.targets[idx]


def make_datasets(cache_train, cache_test, val_fraction=0.12):
    train_imgs, train_labels, _ = load_cache(cache_train)
    test_imgs, test_labels, _ = load_cache(cache_test)
    train_idx, val_idx = stratified_split(train_labels, val_fraction)
    train_ds = ArrayDataset(train_imgs[train_idx], train_labels[train_idx], transform=TrainTransform())
    val_ds = ArrayDataset(train_imgs[val_idx], train_labels[val_idx], transform=EvalTransform())
    test_ds = ArrayDataset(test_imgs, test_labels, transform=EvalTransform())
    return train_ds, val_ds, test_ds


def loader_for(ds, batch_size, shuffle=True):
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle, num_workers=0)


def balanced_sampler(labels, n_classes=len(CLASSES), seed=SEED):
    import numpy as np

    counts = np.zeros(n_classes, dtype=np.float64)
    for label in labels.tolist():
        counts[label] += 1
    weights = np.zeros(len(labels), dtype=np.float64)
    for i, label in enumerate(labels.tolist()):
        weights[i] = 1.0 / counts[label]
    return torch.utils.data.WeightedRandomSampler(
        torch.from_numpy(weights), num_samples=len(labels), replacement=True
    )


def class_counts(labels, n_classes=len(CLASSES)):
    counts = np.zeros(n_classes, dtype=np.float64)
    for label in labels.tolist():
        counts[label] += 1
    return counts


def class_weights_from(labels):
    counts = class_counts(labels)
    total = counts.sum()
    weights = total / (len(CLASSES) * counts)
    return torch.tensor(weights, dtype=torch.float32)