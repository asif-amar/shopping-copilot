# Shopping Copilot

A unified monorepo containing a shopping assistant project with three main applications:

1. **Backend** (`apps/backend/`) - Node.js/Express server with Vercel AI SDK
2. **Chrome Extension** (`apps/extension/`) - React-based Chrome extension with side panel
3. **MCP Server** (`apps/mcp-server/`) - Model Context Protocol server for Israeli e-commerce sites

## Quick Start

```bash
# Install all dependencies
npm install

# Start all services in development mode
npm run dev

# Build all projects
npm run build
```

## Available Scripts

- `npm run dev` - Start all services in development mode
- `npm run build` - Build all projects  
- `npm run type-check` - TypeScript type checking across all projects
- `npm run test` - Run tests in all projects
- `npm run lint` - Run ESLint on extension
- `npm run clean` - Clean build artifacts

## Individual Development

See [CLAUDE.md](./CLAUDE.md) for detailed development instructions for each application.

## Architecture

This project uses npm workspaces to manage dependencies across all three applications. Each app maintains its own package.json while sharing common development tools and scripts at the root level.