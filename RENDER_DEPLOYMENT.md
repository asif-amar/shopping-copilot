# Render Deployment Guide

## Quick Setup

1. **Connect Repository**: Link your GitHub repository to Render
2. **Choose Service Type**: Select "Web Service"
3. **Configuration**: Render will auto-detect the `render.yaml` file

## Manual Setup (Alternative)

If you prefer manual setup instead of using `render.yaml`:

### Service Configuration
- **Name**: `shopping-copilot-backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r apps/backend/requirements.txt`
- **Start Command**: `cd apps/backend && python -m uvicorn src.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### Required Environment Variables

Set these in your Render dashboard:

```
ENVIRONMENT=production
DATABASE_URL=postgresql://username:password@host:port/database
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
HOST=0.0.0.0
PORT=10000
```

### Optional Environment Variables

```
CORS_ORIGINS=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=INFO
```

## Deployment Steps

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Configure environment variables in Render dashboard
5. Deploy!

## Health Check

Your service will be available at `https://your-service.onrender.com`
Health check endpoint: `https://your-service.onrender.com/health`

## Notes

- Render automatically sets the `PORT` environment variable
- Your service will sleep after 15 minutes of inactivity on free tier
- Database connections should use connection pooling for production