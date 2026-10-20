import torch
import torch.nn as nn
import torchvision.models as models

class LightweightVideoClassifier(nn.Module):
    """
    A lightweight transfer-learning model for video behavior classification.
    Spatial Extractor: Pretrained MobileNetV3-Small (576-dim feature embeddings).
    Temporal Aggregation: Combined Mean & Max pooling over video frames.
    Classification Head: Lightweight MLP for behavior classification.
    """
    def __init__(self, num_classes=3, freeze_backbone=True):
        super(LightweightVideoClassifier, self).__init__()
        
        # Load pretrained MobileNetV3-Small
        backbone = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        
        # Extract features without classification head
        self.feature_extractor = backbone.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.feature_dim = 576  # MobileNetV3-Small output channels

        if freeze_backbone:
            # Freeze early feature extraction layers for small dataset fine-tuning
            for param in self.feature_extractor.parameters():
                param.requires_grad = False
            # Unfreeze the last block for domain adaptation
            for param in self.feature_extractor[-2:].parameters():
                param.requires_grad = True

        # Classifier head operating on temporal aggregated features (2 * feature_dim from mean + max pool)
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(self.feature_dim * 2, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.3),
            nn.Linear(64, num_classes)
        )

    def extract_frame_features(self, x):
        # x: (B*T, C, H, W)
        feats = self.feature_extractor(x)  # (B*T, 576, 7, 7)
        pooled = self.avgpool(feats)       # (B*T, 576, 1, 1)
        return torch.flatten(pooled, 1)    # (B*T, 576)

    def forward(self, x):
        # x: (B, T, C, H, W)
        B, T, C, H, W = x.shape
        x_reshaped = x.view(B * T, C, H, W)

        # Spatial feature extraction
        frame_feats = self.extract_frame_features(x_reshaped)  # (B*T, 576)
        frame_feats = frame_feats.view(B, T, -1)               # (B, T, 576)

        # Temporal aggregation across T frames
        mean_feat = torch.mean(frame_feats, dim=1)  # (B, 576)
        max_feat, _ = torch.max(frame_feats, dim=1)  # (B, 576)
        temporal_feat = torch.cat([mean_feat, max_feat], dim=1)  # (B, 1152)

        # Classification
        logits = self.classifier(temporal_feat)  # (B, num_classes)
        return logits
