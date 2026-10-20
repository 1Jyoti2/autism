import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(os.path.dirname(BASE_DIR), "datasets", "vedio")
OUTPUT_DIR = BASE_DIR

# File outputs
MODEL_PATH = os.path.join(OUTPUT_DIR, "video_model.pth")
CONFIG_PATH = os.path.join(OUTPUT_DIR, "config.json")
CLASS_LABELS_PATH = os.path.join(OUTPUT_DIR, "class_labels.json")
REPORT_PATH = os.path.join(OUTPUT_DIR, "evaluation_report.json")

# Model & Preprocessing hyperparameters
CLASSES = ["arm_flapping", "head_banging", "spinning"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}
IDX_TO_CLASS = {i: c for i, c in enumerate(CLASSES)}
CLASS_NAMES = {
    "arm_flapping": "Arm Flapping",
    "head_banging": "Head Banging",
    "spinning": "Spinning",
}

FRAME_SIZE = (224, 224)
CLIP_LENGTH = 16  # Number of frames sampled per video clip
SAMPLE_STRIDE = 4  # Frame sampling stride
IMAGE_MEAN = [0.485, 0.456, 0.406]
IMAGE_STD = [0.229, 0.224, 0.225]

# Training configuration
SEED = 42
EPOCHS = 20
BATCH_SIZE = 4
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
