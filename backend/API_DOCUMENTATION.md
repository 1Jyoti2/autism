# Early Autism Detection API Documentation

Comprehensive REST API reference for the Early Autism Detection platform backend built with FastAPI, PyTorch, and PostgreSQL/SQLAlchemy.

---

## Base URLs
- **Development**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Specification**: `http://localhost:8000/redoc`

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
```

---

## API Endpoints Reference

### 1. Health & System Status

#### `GET /api/health`
Returns backend health status, database connection, and pre-warmed ML model availability.
- **Access**: Public
- **Response**:
```json
{
  "status": "healthy",
  "environment": "development",
  "database": "connected",
  "models": {
    "emotion_model_available": true,
    "video_model_available": true
  },
  "ml_inference": {
    "emotion_model": {
      "loaded": true,
      "device": "cpu",
      "load_duration_ms": 35.12,
      "architecture": "ResNet18"
    },
    "video_model": {
      "loaded": true,
      "device": "cpu",
      "load_duration_ms": 48.65,
      "architecture": "Temporal MobileNetV3",
      "classes": ["arm_flapping", "head_banging", "spinning"]
    }
  }
}
```

#### `GET /api/models/health`
Returns dedicated ML model status and loaded class definitions.

---

### 2. User Authentication

#### `POST /api/auth/register`
Register a new parent, doctor, caretaker, or admin account.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Alex Johnson",
  "role": "parent"
}
```
- **Response (201 Created)**:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_a1b2c3d4",
    "email": "user@example.com",
    "fullName": "Alex Johnson",
    "role": "parent",
    "isActive": true
  }
}
```

#### `POST /api/auth/login`
Authenticate existing user and issue JWT access token.
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOi...",
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "usr_a1b2c3d4",
    "email": "user@example.com",
    "fullName": "Alex Johnson",
    "role": "parent"
  }
}
```

#### `GET /api/auth/me`
Retrieve currently authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: User profile object.

---

### 3. AI Inference & Video/Image Analysis

#### `POST /api/analyze-image`
Upload a child's facial image for Facial Emotion Recognition inference (ResNet18).
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Image file (JPEG, PNG, WebP, max 15MB)
  - `child_name`: (Optional) Child display name
  - `child_id`: (Optional) Child profile ID
- **Response (200 OK)**:
```json
{
  "predictedEmotion": "Anger",
  "confidenceScore": 0.997,
  "confidencePercentage": "99.7%",
  "probabilities": [
    { "class_key": "anger", "label": "Anger", "confidence": 0.997, "percentage": "99.7%" },
    { "class_key": "fear", "label": "Fear", "confidence": 0.002, "percentage": "0.2%" },
    { "class_key": "joy", "label": "Joy", "confidence": 0.001, "percentage": "0.1%" }
  ],
  "status": "Autism-Related Signs Detected",
  "statusTone": "danger",
  "hasSigns": true,
  "childName": "Maya Patel",
  "detectedClass": "Atypical Facial Engagement & Eye-Contact Cues",
  "assessmentType": "Image Analysis",
  "recommendation": "Further evaluation by a qualified healthcare professional is recommended.",
  "explanation": "The facial image analysis detected anger expression characteristics with reduced mutual eye-gaze alignment...",
  "analyzedAt": "2026-09-22T21:05:14.542Z",
  "predictionId": "pred_3ec9aa44",
  "fileId": "file_8dc60c9d"
}
```

#### `POST /api/analyze-video`
Upload an MP4/AVI video for Repetitive Stimming Motor Action Recognition (Temporal MobileNetV3).
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Video file (MP4, AVI, MOV, max 100MB)
  - `child_name`: (Optional) Child display name
  - `child_id`: (Optional) Child profile ID
- **Response (200 OK)**:
```json
{
  "predictedBehavior": "Arm Flapping",
  "behaviorKey": "arm_flapping",
  "confidenceScore": 0.956,
  "confidencePercentage": "95.6%",
  "probabilities": [
    { "class_key": "arm_flapping", "label": "Arm Flapping", "confidence": 0.956, "percentage": "95.6%" },
    { "class_key": "head_banging", "label": "Head Banging", "confidence": 0.032, "percentage": "3.2%" },
    { "class_key": "spinning", "label": "Spinning", "confidence": 0.012, "percentage": "1.2%" }
  ],
  "status": "Autism-Related Behavioral Signs Detected",
  "statusTone": "danger",
  "hasSigns": true,
  "childName": "Ayaan Patel",
  "detectedBehavior": "Arm Flapping",
  "assessmentType": "Video Analysis",
  "videoMetadata": {
    "filename": "sample_video.mp4",
    "resolution": "1920x1080",
    "fps": 30.0,
    "total_frames": 180,
    "duration_sec": 6.0
  },
  "predictionId": "pred_7b19de20",
  "fileId": "file_9387e678"
}
```

---

### 4. Prediction History

#### `GET /api/predictions`
Retrieve authenticated user's prediction history with type/date filters and pagination.
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `pageSize`: Records per page (default: `10`, max `100`)
  - `type`: Filter by `"image"`, `"video"`, or `"all"`
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD`
  - `childId`: Filter by associated child profile
- **Response (200 OK)**:
```json
{
  "items": [...],
  "total": 12,
  "page": 1,
  "pageSize": 10,
  "totalPages": 2,
  "hasMore": true
}
```

#### `GET /api/predictions/{prediction_id}`
Retrieve full details, probabilities, uploaded media metadata, and audit log timeline.
- **Headers**: `Authorization: Bearer <token>`

#### `DELETE /api/predictions/{prediction_id}`
Delete own prediction record, uploaded asset, and audit trail.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `{ "success": true, "message": "Prediction deleted successfully." }`

---

### 5. Dynamic Dashboard Statistics

#### `GET /api/dashboard/metrics`
Retrieve live database aggregations (prediction totals, image/video counts, top detected emotions, top detected behaviors, and daily activity timeline).
- **Access**: Public / Optional Auth (scopes to user if parent)

#### `GET /api/dashboard/{role}`
Retrieve role-tailored dashboard packages (`parent`, `doctor`, `admin`, `caretaker`).
- **Response**: Contains role-specific patient/children registries, review flags, and metrics.

---

### 6. Children & Clinical Notes

- `GET /api/children`: Retrieve child profiles.
- `POST /api/children`: Create a new child record.
- `PUT /api/children/{id}`: Update child record.
- `DELETE /api/children/{id}`: Delete child record.
- `GET /api/notes`: Retrieve clinical notes.
- `POST /api/notes`: Create new clinical observation note.
- `GET /api/notifications`: Retrieve user alerts and notifications.
