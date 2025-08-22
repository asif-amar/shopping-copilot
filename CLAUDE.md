# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a shopping assistant project with three main applications that work together:

1. **Backend** (`apps/backend/`) - Node.js/Express server with Vercel AI SDK for streaming LLM responses
2. **Chrome Extension** (`apps/extension/`) - React-based Chrome extension with side panel for shopping assistance
3. **MCP Server** (`apps/mcp-server/`) - Model Context Protocol server providing shopping tools for Israeli e-commerce sites

## Key Commands

### Monorepo Commands (Root Level)
```bash
# Install all dependencies for all workspaces
npm install

# Start all services in development mode
npm run dev

# Start individual services
npm run dev:backend     # Start backend server with hot reload
npm run dev:extension   # Start extension with watch mode
npm run dev:mcp        # Start MCP server development

# Build all projects
npm run build

# Build individual projects
npm run build:backend   # Build backend TypeScript to JavaScript
npm run build:extension # Build extension for Chrome store
npm run build:mcp      # Deploy MCP server to Cloudflare Workers

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

### Legacy Individual Commands (for reference)
```bash
# Backend Development
cd apps/backend
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run type-check   # TypeScript type checking

# Chrome Extension Development
cd apps/extension
npm run dev          # Build with watch mode for development
npm run build        # Production build for Chrome store
npm run build:dev    # Development build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code checking
npm run lint:fix     # Fix ESLint issues automatically
npm test             # Run Vitest tests
npm run clean        # Clean dist folder

# MCP Server Development
cd apps/mcp-server
wrangler dev         # Start Cloudflare Workers development server
npm run dev          # Alternative dev command
npm run deploy       # Deploy to Cloudflare Workers
npm run type-check   # TypeScript compilation check
npm run test         # Unit tests with Vitest
npm run test:ui      # Test UI interface
wrangler types       # Generate Cloudflare Worker types
```

## Architecture Overview

### Backend Service Architecture
- **Express.js** server with CORS configuration for Chrome extension integration
- **Vercel AI SDK** for streaming LLM responses from OpenAI/Anthropic models
- **Database integration** with Neon PostgreSQL for message persistence
- **Health monitoring** endpoint at `/health`
- **Two main endpoints**: `/api/chat/stream` (streaming) and `/api/chat/complete` (single response)

### Chrome Extension Architecture
- **Manifest V3** Chrome extension with side panel UI
- **React + TypeScript** frontend with Vite bundling
- **MCP Client Integration** - Uses `@modelcontextprotocol/sdk` to connect to shopping MCP server
- **Conversation Management** - Per-hostname message persistence using Chrome storage API
- **Background service worker** handles message routing and hostname detection

### MCP Server Architecture (Cloudflare Workers)
- **Shopping Adapters**: Extensible adapter pattern for different e-commerce sites
- **Supported Sites**: Rami Levy, Shufersal (Israeli grocery chains)
- **Core Tools**: Product search, cart management, price comparison, sale detection
- **Security**: Input validation with Zod, SQL injection protection, authentication tokens

## Integration Flow

1. **User interacts** with Chrome extension side panel on shopping websites
2. **Extension sends messages** to MCP server via StreamableHTTP transport
3. **MCP server** executes shopping tools (search products, add to cart, etc.)
4. **Google Gemini** processes responses using MCP tools and returns AI-generated shopping advice
5. **Responses are displayed** in the extension's chat interface with conversation persistence

## Environment Configuration

### Backend (.env)
- API keys for OpenAI/Anthropic models
- Database connection string (Neon PostgreSQL)
- CORS origins for Chrome extension

### MCP Server (.dev.vars)
- `RAMI_LEVY_API_KEY`, `RAMI_LEVY_ECOM_TOKEN`, `RAMI_LEVY_COOKIE` - Authentication tokens
- `SHUFERSAL_CSRF_TOKEN`, `SHUFERSAL_COOKIE` - Session tokens
- User IDs for cart operations

### Chrome Extension
- Hardcoded Google AI API key in source (should be moved to options)
- MCP server endpoint: `http://localhost:8787/mcp`

## Key Development Patterns

### MCP Tool Registration
Tools are organized in `/apps/mcp-server/src/tools/shopping/` with adapter pattern:
- `base-adapter.ts` - Abstract base class defining shopping interface
- `rami-levy-adapter.ts`, `shufersal-adapter.ts` - Site-specific implementations
- `factory.ts` - Factory pattern for adapter selection
- `security.ts` - Input validation and sanitization

### Chrome Extension Message Flow
- Background service worker routes messages between content scripts and side panel
- Conversation state managed per hostname using Chrome storage API
- Side panel loads via `createRoot` and maintains chat state

### Database Schema
Backend uses structured message storage with conversation threading and user context.

## Testing and Quality

- **TypeScript**: Strict mode enabled across all projects
- **Testing**: Vitest for unit tests (extension and MCP server)
- **Linting**: ESLint with Prettier integration (extension)
- **Security**: Input validation, error sanitization, no hardcoded secrets in production

## Deployment Targets

- **Backend**: Node.js server (configured for Vercel/similar platforms)
- **Extension**: Chrome Web Store via `dist/` folder
- **MCP Server**: Cloudflare Workers via Wrangler CLI