# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive 3D globe visualization application for tracking and displaying global disaster data using EM-DAT (Emergency Events Database). Built with React 19, TypeScript, and globe.gl for 3D visualization.

## Common Development Commands

```bash
# Navigate to the main project directory
cd sio-25

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run ESLint for linting
npm run lint

# Preview production build
npm run preview
```

## Architecture and Structure

### Core Technologies
- **React 19** with TypeScript for UI components
- **Vite** for fast builds and HMR
- **globe.gl** for 3D globe visualization
- **three.js** for 3D graphics
- **axios** for API requests
- **xlsx** for Excel file processing (EM-DAT data)
- **framer-motion** for animations

### Project Structure
```
sio-25/
├── src/
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Main app component with disaster data management
│   ├── components/
│   │   ├── Globe.tsx              # 3D globe visualization using globe.gl
│   │   ├── DisasterPanel.tsx     # Disaster details panel
│   │   ├── FilterBar.tsx         # Filter controls for disasters
│   │   └── ConvexGlobeData.tsx   # Convex data integration
│   ├── services/
│   │   ├── emdatService.ts       # EM-DAT Excel data processing
│   │   ├── api.ts                # API client setup
│   │   ├── convexService.ts      # Convex data service
│   │   └── browserUseAgent.ts    # Browser agent utilities
│   ├── types/
│   │   └── disaster.ts           # TypeScript type definitions
│   ├── hooks/
│   │   └── useConvexData.ts      # Custom React hooks
│   └── data/
│       └── mockDisasters.ts      # Mock data for development
```

### Key Components

**App.tsx**: Main application component that:
- Loads disaster data from EM-DAT Excel files
- Manages filtering (by type, severity, date range)
- Coordinates between Globe, DisasterPanel, and FilterBar components

**Globe Component**: 
- Uses globe.gl library for 3D Earth visualization
- Renders disaster markers as colored points on the globe
- Handles click interactions for disaster selection

**EmdatService**: 
- Parses EM-DAT Excel files containing disaster data
- Maps Excel columns to DisasterLocation types
- Filters data for 2024-2025 disasters

### Data Model

Main type: `DisasterLocation`
- Disaster types: wildfire, flood, hurricane, drought, heatwave, storm, earthquake, other
- Severity levels: low, moderate, high, critical
- Includes location (lat/long), date, affected people count, and donation links

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Target: ES2022
- Module: ESNext with bundler resolution
- No emit mode (Vite handles bundling)

### Development Notes
- The project uses React 19 with modern hooks patterns
- globe.gl handles 3D rendering with WebGL
- Data source is EM-DAT Excel files in public directory
- ESLint configured with TypeScript and React rules