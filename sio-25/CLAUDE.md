# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application. The project has been migrated from Vue to React and uses modern React 19 with TypeScript.

## Common Development Commands

```bash
# Start development server with hot module replacement
npm run dev

# Build for production
npm run build

# Run ESLint for linting
npm run lint

# Preview production build locally
npm run preview
```

## Architecture and Structure

### Build System
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Strict mode enabled with comprehensive type checking
- Configuration split across `tsconfig.json` (project references), `tsconfig.app.json` (application code), and `tsconfig.node.json` (node/build scripts)

### Frontend Framework
- **React 19**: Latest version with hooks
- Entry point: `src/main.tsx` 
- Root component: `src/App.tsx`
- Uses React Fast Refresh for development

### Code Quality
- **ESLint**: Configured with TypeScript, React Hooks, and React Refresh rules
- **TypeScript**: Strict mode with no unused locals/parameters checking
- Linting configuration in `eslint.config.js` using flat config format

### Key TypeScript Settings
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx transform
- Strict type checking enabled
- No emit mode (Vite handles bundling)