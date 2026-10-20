from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = ML_DIR.parent
ROOT = WORKSPACE_DIR / "datasets" / "archive (1)" / "Autism Facial Recognition Dataset_Augmented"
DATA = ROOT / "train"
TEST = ROOT / "test"

MODEL_DIR = ML_DIR / "models"
REPORT_DIR = ML_DIR / "reports"
PLOT_DIR = ML_DIR / "plots"
TEMP_DIR = ML_DIR / "_tmp_history"
CACHE_DIR = ML_DIR / "_cache"
for d in (MODEL_DIR, REPORT_DIR, PLOT_DIR, TEMP_DIR, CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

TRAIN_CACHE = CACHE_DIR / "train_128.pt"
TEST_CACHE = CACHE_DIR / "test_128.pt"

CLASSES = ["anger", "fear", "joy", "Natural", "sadness", "surprise"]
N_CLASSES = len(CLASSES)

IMG_SIZE = 128
SEED = 42
VAL_FRACTION = 0.12
NUM_WORKERS = 0

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

BATCH_TRANSFER = 96
BATCH_SCRATCH = 128
EPOCHS_TRANSFER = 10
EPOCHS_SCRATCH = 12
PATIENCE = 3