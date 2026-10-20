# Early Autism Spectrum Disorder (ASD) Detection Platform

An end-to-end, AI-powered behavioral screening and early autism detection web application. The platform integrates computer vision, deep learning emotion recognition, temporal stimming action classification from video, and clinical behavioral questionnaires to aid parents and healthcare professionals in early ASD screening.

---

## 🌟 Key Features

- **Facial Emotion Recognition**:
  - Deep Learning model (`ml/models/best_model.pt`) based on ResNet18 transfer learning.
  - Detects emotional affect: *Anger*, *Fear*, *Joy*, *Natural*, *Sadness*, *Surprise*.
  - Test-Time Augmentation (TTA) and ONNX export support.

- **Temporal Video Stimming Behavior Classifier**:
  - Video analysis deep learning model (`video_ml/video_model.pth`) based on Temporal MobileNetV3.
  - Detects common repetitive motor behaviors (stimming): *Arm Flapping*, *Head Banging*, *Spinning*.
  - Uniform temporal frame sampling and deep frame validation.

- **Clinical Behavioral Screening (10-Question Screener)**:
  - Standardized screening questionnaire adapted from M-CHAT-R protocols.
  - Automated risk scoring (Low, Medium, High risk) with clinical recommendations.

- **Comprehensive Management & Dashboards**:
  - Multi-tenant Parent and Doctor role-based dashboards.
  - Child profile management, historical trend tracking, and analytics.
  - Downloadable PDF clinical screening and evaluation reports.

---

## 🏗️ System Architecture

```
                          ┌────────────────────────────┐
                          │   React 19 + Vite + CSS    │
                          │   (early-autism-detection) │
                          └──────────────┬─────────────┘
                                         │ REST API / Axios
                                         ▼
                          ┌────────────────────────────┐
                          │      FastAPI Backend       │
                          │         (backend/)         │
                          └──────┬──────────────┬──────┘
                                 │              │
                   ┌─────────────▼───┐    ┌─────▼─────────────┐
                   │  SQLAlchemy ORM │    │ Inference Service │
                   │  (SQLite/PG)    │    │ (PyTorch Engine)  │
                   └─────────────────┘    └────────┬──────────┘
                                                   │
                                      ┌────────────┴───────────┐
                                      │                        │
                               ┌──────▼──────┐          ┌──────▼──────┐
                               │   ResNet18  │          │ MobileNetV3 │
                               │ Facial ML   │          │ Video ML    │
                               └─────────────┘          └─────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI REST API Backend
│   ├── app/                  # Application source (routers, services, schemas, models)
│   ├── migrations/           # Alembic database migrations
│   ├── uploads/              # Runtime media directory (kept via .gitkeep)
│   ├── main.py               # FastAPI entrypoint
│   ├── init_db.py            # Database seeder & initialization script
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Sample environment configuration
│   └── test_backend.py       # Integration test suite
├── early-autism-detection/   # Frontend Application
│   ├── src/                  # React components, pages, context, hooks
│   ├── public/               # Public assets
│   ├── package.json          # Node dependencies & scripts
│   ├── vite.config.js        # Vite build & reverse-proxy configuration
│   └── .env.example          # Frontend environment sample
├── ml/                       # Facial Emotion Recognition ML Pipeline
│   ├── models/               # Trained model weights (best_model.pt, ONNX)
│   ├── reports/              # Model validation & evaluation reports
│   ├── plots/                # Confusion matrices & training history plots
│   ├── train.py              # Model training script
│   └── evaluate.py           # Evaluation pipeline
├── video_ml/                 # Video Stimming Action Recognition ML Pipeline
│   ├── video_model.pth       # Trained Temporal MobileNetV3 model weights
│   ├── class_labels.json     # Class label dictionary
│   ├── model.py              # Neural network architecture definition
│   └── train.py              # Model training pipeline
├── datasets/                 # Training & Validation Datasets
│   ├── archive (1)/          # Augmented facial emotion recognition dataset
│   └── vedio/                # Video stimming behavior action dataset
├── .gitignore                # Comprehensive Git ignore rules (secrets, caches, uploads)
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.11 / 3.12 / 3.14)
- **Node.js 18+** & npm
- (Optional) **PostgreSQL** (SQLite fallback is automatically enabled for zero-config setup)

---

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create & activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Initialize database schema and initial seed data
python init_db.py

# Launch FastAPI development server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://localhost:8000/api`
- Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

In a separate terminal:

```bash
# Navigate to frontend
cd early-autism-detection

# Install Node dependencies
npm install

# Configure environment (optional, defaults to /api proxy)
cp .env.example .env

# Start Vite development server
npm run dev
```

- Web UI: `http://localhost:3000` (or `http://localhost:5173`)

---

## 🧪 Testing & Verification

Run the comprehensive 14-point backend integration test suite:

```bash
cd backend
python test_backend.py
```

Run frontend linting:
```bash
cd early-autism-detection
npm run lint
```

---

## 🔒 Security & Safe Secrets Management

- **Secrets Isolation**: Secrets and environment configurations are kept in `.env` files which are strictly excluded from version control via `.gitignore`.
- **Large File Handling**: Large intermediate PyTorch tensors (`ml/_cache/*`, `ml/_tmp_history/*`) and runtime media uploads (`backend/uploads/*`) are excluded to comply with GitHub file-size limits.
- **Production Models**: Optimized production PyTorch weights (`best_model.pt` ~44MB and `video_model.pth` ~4MB) are stored in their respective model directories for direct out-of-the-box inference.

---

## 📄 License

This project is developed for research and educational purposes in early childhood behavioral analysis.