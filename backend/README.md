# Early Autism Detection Backend

High-performance Python FastAPI backend for AI-assisted Early Autism Detection & Behavioral Screening. Integrates PyTorch ResNet18 Facial Emotion Recognition, Temporal MobileNetV3 Video Stimming Action Recognition, PostgreSQL/SQLAlchemy ORM, JWT Authentication, and dynamic clinical analytics.

---

## Features
- **PyTorch ML Models**:
  - `ml/models/best_model.pt`: ResNet18 Facial Emotion Recognition (Anger, Fear, Joy, Natural, Sadness, Surprise).
  - `video_ml/video_model.pth`: Temporal MobileNetV3 Stimming Action Classifier (Arm Flapping, Head Banging, Spinning).
- **Dedicated ML Inference Service Layer**:
  - Thread-safe singleton model caching with zero reload overhead on concurrent requests.
  - Deep media validation (PIL image verification and OpenCV video stream check).
  - Lifespan pre-warming on application startup.
- **Database & Security**:
  - PostgreSQL / SQLite multi-engine database support via SQLAlchemy ORM.
  - BCrypt password hashing & JWT Bearer authentication.
  - Multi-tenant user isolation on prediction history and profile records.
- **Full Frontend Integration**:
  - Built-in CORS and Vite proxy configuration for React frontend communication.

---

## 1. Prerequisites
- Python 3.10+ (Recommended: Python 3.11 or 3.12/3.14)
- Node.js 18+ & npm (for frontend)
- PostgreSQL (Optional, defaults to local SQLite `autism_detection.db` if PostgreSQL not running)

---

## 2. Installation & Setup

### Step 1: Clone / Navigate to Backend
```bash
cd backend
```

### Step 2: Create and Activate Virtual Environment
```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
APP_NAME=Early Autism Detection API
APP_ENV=development
PORT=8000
HOST=0.0.0.0
DEBUG=True

# Security / JWT
SECRET_KEY=supersecretkey_change_in_production_1234567890
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database (PostgreSQL with SQLite fallback)
DATABASE_URL=sqlite:///./autism_detection.db

# ML Model Paths
EMOTION_MODEL_PATH=../ml/models/best_model.pt
VIDEO_MODEL_PATH=../video_ml/video_model.pth
VIDEO_CLASS_LABELS_PATH=../video_ml/class_labels.json
UPLOAD_DIR=./uploads
```

### Step 5: Initialize Database Tables & Seed Data
```bash
python init_db.py
```

---

## 3. Startup Commands

### Start Backend Server (FastAPI)
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

### Start Frontend Server (React + Vite)
In a separate terminal:
```bash
cd ../early-autism-detection
npm install
npm run dev
```
- Frontend UI: `http://localhost:3000`

---

## 4. Run Automated Integration Tests

Run the complete 14-point test suite:
```bash
python test_backend.py
```

---

## 5. Sample API Requests (cURL)

### 1. Health Check
```bash
curl -X GET http://localhost:8000/api/health
```

### 2. User Registration
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "parent@example.com", "password": "Password123!", "fullName": "Jane Doe", "role": "parent"}'
```

### 3. User Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "parent@example.com", "password": "Password123!"}'
```

### 4. Facial Emotion Image Analysis
```bash
curl -X POST http://localhost:8000/api/analyze-image \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -F "file=@/path/to/child_face.jpg" \
  -F "child_name=Maya Patel" \
  -F "child_id=ch_maya"
```

### 5. Video Stimming Behavior Analysis
```bash
curl -X POST http://localhost:8000/api/analyze-video \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -F "file=@/path/to/child_video.mp4" \
  -F "child_name=Ayaan Patel" \
  -F "child_id=ch_ayaan"
```

### 6. Query User Prediction History
```bash
curl -X GET "http://localhost:8000/api/predictions?type=image&page=1&pageSize=10" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### 7. Dashboard Analytics
```bash
curl -X GET http://localhost:8000/api/dashboard/metrics
```

---

## 6. Directory Structure

```
backend/
├── app/
│   ├── ml/                       # ML Models & Architectures
│   │   ├── emotion_model.py      # ResNet18 Facial Emotion Classifier
│   │   └── video_model.py        # Temporal MobileNetV3 Stimming Classifier
│   ├── models/                   # SQLAlchemy Database Models
│   │   ├── user.py
│   │   ├── child.py
│   │   ├── prediction.py
│   │   ├── uploaded_file.py
│   │   ├── prediction_history.py
│   │   ├── screening.py
│   │   ├── note.py
│   │   └── notification.py
│   ├── routes/                   # FastAPI API Routers
│   │   ├── auth.py
│   │   ├── analysis.py
│   │   ├── dashboard.py
│   │   ├── children.py
│   │   ├── screenings.py
│   │   ├── notes.py
│   │   └── notifications.py
│   ├── schemas/                  # Pydantic Request/Response Models
│   ├── services/                 # Business Logic & Inference Engine
│   │   ├── inference_service.py  # Dedicated ML Inference Manager
│   │   ├── prediction_service.py # Persistence & History Queries
│   │   ├── auth_service.py
│   │   ├── child_service.py
│   │   └── dashboard_service.py
│   └── utils/                    # Security, File Handlers & Logging
│       ├── exceptions.py
│       ├── file_handler.py
│       ├── logger.py
│       └── security.py
├── uploads/                      # Uploaded Media Files
├── .env.example                  # Environment Configuration Template
├── API_DOCUMENTATION.md          # Full REST API Reference
├── init_db.py                    # Database Seeder Script
├── main.py                       # FastAPI Application Entrypoint
├── requirements.txt              # Dependencies List
└── test_backend.py               # Complete 14-Point Test Suite
```
