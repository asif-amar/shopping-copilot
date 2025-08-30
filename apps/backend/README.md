# Python FastAPI Backend

Simple FastAPI backend for the Shopping Copilot application.

## Setup

```bash
cd apps/python-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Run

```bash
# Development (auto-reload)
python src/main.py

# Or using uvicorn directly (only watch src folder)
uvicorn src.main:app --reload --reload-dir src --host 127.0.0.1 --port 8000
```

## API Endpoints

- **GET** `/health` - Health check
- **POST** `/api/chat/complete` - Chat completion endpoint

## Test

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/chat/complete
```