import torch
import torch.nn as nn
from torchvision import models

from config import N_CLASSES


def build_scratch_cnn():
    def block(in_ch, out_ch, pool=True):
        layers = [
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        ]
        if pool:
            layers.append(nn.MaxPool2d(2))
        return nn.Sequential(*layers)

    return nn.Sequential(
        block(3, 32, pool=True),
        block(32, 64, pool=True),
        block(64, 128, pool=True),
        block(128, 128, pool=True),
        block(128, 128, pool=False),
        nn.AdaptiveAvgPool2d(1),
        nn.Flatten(),
        nn.Dropout(0.4),
        nn.Linear(128, 128),
        nn.ReLU(inplace=True),
        nn.Dropout(0.4),
        nn.Linear(128, N_CLASSES),
    )


def build_pretrained_resnet(weights=models.ResNet18_Weights.IMAGENET1K_V1):
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, N_CLASSES)
    return model


MODEL_FACTORY = {
    "scratch_cnn": build_scratch_cnn,
    "resnet18_pretrained": build_pretrained_resnet,
}