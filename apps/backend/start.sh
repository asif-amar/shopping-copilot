#!/bin/bash
echo "Starting server on host 0.0.0.0 port $PORT"
cd apps/backend
python -m uvicorn src.main:app --host 0.0.0.0 --port $PORT