# Redwood Classroom Maintenance Management

### Before Deployment
- Optimise Google OAuth configuration for production
- Database migrations for production
- Database and Cloudflare R2 setup for production
- Add PPDO numbers to each classroom

A comprehensive, high-performance fullstack monorepo template powered by **Bun**, **Turborepo**, and **oRPC**. This project provides a unified architecture for building Web, Desktop (Electron), and Mobile (Expo) applications with a shared backend and type-safe contracts.

## 🚀 Tech Stack

### Core Tooling
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Monorepo Management:** [Turborepo](https://turbo.build/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Linting & Formatting:** [Biome](https://biomejs.dev/)
- **Validation:** [Zod](https://zod.dev/)

### Backend API (`apps/api`)
- **Framework:** [ElysiaJS](https://elysiajs.com/) (High-performance web framework for Bun)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **Storage:** [AWS S3](https://aws.amazon.com/s3/) with SDK v3
- **Logging:** [Pino](https://getpino.io/)

### Shared Contracts & RPC (`packages/contracts`)
- **Communication:** [oRPC](https://orpc.dev/) (End-to-end type-safe APIs with TanStack Query integration)
- **OpenAPI:** Automated documentation and client generation

### Frontend Applications
- **Web (`apps/web`):** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query/latest), [Zustand](https://zustand-demo.pmnd.rs/), [Framer Motion](https://www.framer.com/motion/), [nuqs](https://nuqs.dev/)
- **Desktop (`apps/electron`):** [Electron](https://www.electronjs.org/), [Vite](https://vitejs.dev/), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Mobile (`apps/expo`):** [Expo SDK 54](https://expo.dev/), [React Native 0.81](https://reactnative.dev/), [Expo Router](https://docs.expo.dev/router/introduction/)

### UI Library (`packages/ui`)
- **Styling:** Tailwind CSS v4
- **Components:** [Radix UI](https://www.radix-ui.com/) primitives (Shadcn-style)
- **Forms:** [React Hook Form](https://react-hook-form.com/) with Zod resolvers

## 📁 Project Structure

```text
├── apps
│   ├── api          # Elysia backend
│   ├── electron     # Electron desktop app (Vite + React)
│   ├── expo         # Cross-platform mobile app
│   └── web          # Next.js web application
├── packages
│   ├── contracts    # Shared oRPC schema and types
│   ├── shad-ui      # Shared UI component library
│   └── typescript-config # Shared tsconfig bases
├── turbo.json       # Turborepo configuration
└── biome.json       # Biome linting/formatting rules
```

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/docs/installation) installed (version >= 1.1.0 recommended)
- Node.js >= 18

### Installation

```bash
bun install
```

### Development

Run all applications in development mode:

```bash
bun dev
```

Or run a specific application:

```bash
bun dev --filter=@redwood/web
```

### Build

```bash
bun build
```

### Linting & Formatting

```bash
bun lint
```

## 🔑 Environment Variables

Each application requires its own `.env` file.
