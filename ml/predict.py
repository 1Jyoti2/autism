import argparse
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision.transforms import functional as F

from config import CLASSES, IMAGENET_MEAN, IMAGENET_STD, IMG_SIZE, MODEL_DIR
from models import MODEL_FACTORY

MEAN = torch.tensor(IMAGENET_MEAN).view(3, 1, 1)
STD = torch.tensor(IMAGENET_STD).view(3, 1, 1)


def load_image(path):
    img = Image.open(path).convert("RGB")
    img = F.resize(img, (IMG_SIZE, IMG_SIZE), F.InterpolationMode.BILINEAR)
    x = F.to_tensor(img)
    x = F.normalize(x, IMAGENET_MEAN, IMAGENET_STD).unsqueeze(0)
    return x


def predict_pytorch(path, model_name="resnet18_pretrained"):
    ckpt = torch.load(MODEL_DIR / f"best_{model_name}.pt", map_location="cpu", weights_only=False)
    model = MODEL_FACTORY[model_name]()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    x = load_image(path)
    with torch.no_grad():
        prob = torch.softmax(model(x), dim=1)[0]
    return prob


def predict_onnx(path, onnx_path=MODEL_DIR / "best_model.onnx"):
    import onnxruntime as ort
    sess = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    x = load_image(path)
    logits = sess.run(None, {"input": x.numpy()})[0]
    prob = torch.tensor(logits).softmax(dim=1)[0]
    return prob


def main():
    parser = argparse.ArgumentParser(description="Predict emotion class for a face image")
    parser.add_argument("image", type=Path, help="path to an image file")
    parser.add_argument("--backend", choices=["pytorch", "onnx"], default="pytorch")
    parser.add_argument("--topk", type=int, default=3)
    args = parser.parse_args()

    if not args.image.exists():
        sys.exit(f"File not found: {args.image}")

    prob = predict_pytorch(args.image) if args.backend == "pytorch" else predict_onnx(args.image)
    order = np.argsort(prob.numpy())[::-1]
    print(f"Backend  : {args.backend}")
    for i in order[: args.topk]:
        print(f"{CLASSES[i]:<10}{prob[i].item():.3f}")


if __name__ == "__main__":
    main()