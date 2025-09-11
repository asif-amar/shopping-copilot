# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Think carefully and only action the specific task that I have given you with the most concise and elegant solution that changes as little code as possible.

## Project Architecture

This is a shopping assistant project with two main applications that work together:

1. **Backend** (`apps/backend/`) - Python FastAPI server with Agno integration for shopping tools
2. **Chrome Extension** (`apps/extension/`) - React-based Chrome extension with side panel for shopping assistance

Note: The root package.json references a third workspace `apps/mcp-server` for Model Context Protocol functionality, but this component is not currently implemented.

## Key Commands

### Monorepo Commands (Root Level)

```bash
# Install all dependencies for all workspaces
npm install

# Start all services in development mode
npm run dev

# Start individual services
npm run dev:backend     # Start Python FastAPI backend with uvicorn
npm run dev:extension   # Start extension with watch mode

# Build all projects
npm run build

# Build individual projects
npm run build:backend   # No build step for Python backend (just dependency install)
npm run build:extension # Build extension for Chrome store

# Type checking across all projects
npm run type-check

# Linting (extension only)
npm run lint           # ESLint code checking
npm run lint:fix       # Fix ESLint issues automatically

# Testing
npm run test           # Run tests in all projects

# Cleanup
npm run clean          # Clean build artifacts
```

### Backend Development (Python FastAPI)

```bash
cd apps/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows

# Install Python dependencies
pip install -r requirements.txt

# Start development server (auto-reload)
python src/main.py

# Or using uvicorn directly (only watch src folder)
uvicorn src.main:app --reload --reload-dir src --host 127.0.0.1 --port 8000

# Production deployment (via render)
npm run render:build  # Install Python dependencies
npm run render:start  # Start with uvicorn on production host/port
```

### Chrome Extension Development

```bash
cd apps/extension
npm run dev          # Build with watch mode for development
npm run build        # Production build for Chrome store
npm run build:dev    # Development build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code checking
npm run lint:fix     # Fix ESLint issues automatically
npm test             # Run Vitest tests
npm run clean        # Clean dist folder
```

## Architecture Overview

### Backend Service Architecture (FastAPI + Agno)

- **FastAPI** server with CORS configuration for Chrome extension integration
- **Agno Toolkit integration** for shopping tools functionality using `ShoppingTools` class
- **Shopping Adapters**: Extensible adapter pattern for different e-commerce sites (Rami Levy, Shufersal)
- **Authentication system** with Google OAuth integration
- **Database integration** with PostgreSQL for user management and conversation persistence
- **Health monitoring** endpoint at `/health`
- **Core endpoints**:
  - `/api/auth/*` - Authentication routes (login, logout, profile)
  - `/api/user/*` - User management (profile, preferences)
  - `/api/chat/*` - Conversation handling with Agno integration

### Chrome Extension Architecture

- **Manifest V3** Chrome extension with side panel UI
- **React + TypeScript** frontend with Vite bundling
- **Google OAuth integration** for user authentication
- **Background service worker** for credential extraction from shopping websites
- **Network request interception** - Captures authentication headers/cookies from shopping sites
- **Conversation Management** - Communicates with FastAPI backend for chat functionality
- **Website context detection** - Identifies current shopping website for contextual assistance

### Shopping Tools Integration

- **Agno Toolkit**: Shopping functionality implemented as `ShoppingTools` class in `src/tools/shopping_tools.py`
- **Supported Sites**: Rami Levy, Shufersal (Israeli grocery chains)
- **Core Tools**: Product search, cart management (add/remove/update), price comparison
- **Security**: Input validation with Zod-like patterns, SQL injection protection, credential sanitization
- **Credential Management**: Extracts auth tokens and cookies from intercepted network requests

## Integration Flow

1. **User browses** shopping websites with Chrome extension active
2. **Background service worker** intercepts and captures authentication credentials from network requests
3. **User interacts** with Chrome extension side panel for shopping assistance
4. **Extension communicates** with FastAPI backend via REST API
5. **Backend uses Agno** with ShoppingTools to execute shopping operations (search, cart management)
6. **Shopping adapters** use captured credentials to interact with e-commerce APIs
7. **Agno processes** responses and returns AI-generated shopping advice to extension
8. **Responses are displayed** in the extension's chat interface

## Environment Configuration

### Backend (.env)

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `JWT_SECRET_KEY` - For session management
- `DATABASE_URL` - PostgreSQL connection string
- `AGNO_API_KEY` - Agno service authentication
- `LOG_LEVEL` - Logging verbosity (DEBUG, INFO, WARNING, ERROR). Defaults to WARNING for reduced verbosity
- Rami Levy credentials: `RAMI_LEVY_API_KEY`, `RAMI_LEVY_ECOM_TOKEN`, `RAMI_LEVY_COOKIE`
- Shufersal credentials: `SHUFERSAL_CSRF_TOKEN`, `SHUFERSAL_COOKIE`

### Chrome Extension (manifest.json)

- Google OAuth client ID configured in manifest
- Host permissions for supported shopping sites and backend endpoints
- Background service worker for credential capture

## Key Development Patterns

### Shopping Tools Architecture

Shopping functionality is organized in `/apps/backend/src/tools/shopping/`:

- `shopping_tools.py` - Main Agno Toolkit implementation
- `adapters/base_adapter.py` - Abstract base class defining shopping interface
- `adapters/rami_levy_adapter.py`, `adapters/shufersal_adapter.py` - Site-specific implementations
- `factory.py` - Factory pattern for adapter selection
- `security.py` - Input validation and sanitization
- `credential_manager.py` - Credential extraction and management

### Chrome Extension Credential Flow

- Background service worker intercepts network requests via `chrome.webRequest` API
- Captures authentication headers and cookies from shopping site API calls
- Stores credentials in Chrome storage for use by shopping tools
- Extension sends credentials to backend via headers for tool authentication

### FastAPI + Agno Integration

- Shopping tools implemented as Agno Toolkit class
- Request headers passed to tools for credential extraction
- Async tool execution with proper error handling
- Structured response formatting for consistent UI display

## Database Schema

Backend uses structured tables for:

- User management with Google OAuth profiles
- Conversation persistence with threading
- Shopping session tracking per website

## Testing and Quality

- **TypeScript**: Strict mode enabled across all projects
- **Testing**: Vitest for unit tests (extension), pytest patterns for backend
- **Linting**: ESLint with Prettier integration (extension)
- **Security**: Input validation, credential sanitization, secure error handling

## Deployment Targets

- **Backend**: FastAPI server (configured for Render deployment via `render:*` scripts)
- **Extension**: Chrome Web Store via `dist/` folder
- **Environment**: Production URLs configured in manifest for deployed backend
