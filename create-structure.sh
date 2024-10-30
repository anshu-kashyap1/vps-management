#!/bin/bash

# Create main project directories
mkdir -p src/{config,controllers,middleware,routes,utils,services,interfaces,types}
mkdir -p prisma
mkdir -p src/templates

# Create config files
touch .env
touch .gitignore
touch tsconfig.json
touch package.json

# Create source files
# Config
touch src/config/config.ts
touch src/config/database.ts

# Controllers
touch src/controllers/authController.ts
touch src/controllers/userController.ts
touch src/controllers/vmController.ts
touch src/controllers/paymentController.ts
touch src/controllers/adminController.ts

# Middleware
touch src/middleware/auth.ts
touch src/middleware/errorHandler.ts
touch src/middleware/validate.ts
touch src/middleware/rateLimiter.ts

# Routes
touch src/routes/auth.ts
touch src/routes/user.ts
touch src/routes/vm.ts
touch src/routes/payment.ts
touch src/routes/admin.ts
touch src/routes/index.ts

# Utils
touch src/utils/prisma.ts
touch src/utils/logger.ts
touch src/utils/proxmox.ts
touch src/utils/validation.ts

# Services
touch src/services/authService.ts
touch src/services/userService.ts
touch src/services/vmService.ts
touch src/services/paymentService.ts
touch src/services/emailService.ts

# Interfaces
touch src/interfaces/user.interface.ts
touch src/interfaces/vm.interface.ts
touch src/interfaces/payment.interface.ts

# Types
touch src/types/express.d.ts
touch src/types/environment.d.ts

# Main application file
touch src/index.ts

# Prisma
touch prisma/schema.prisma

# Create initial content for package.json
echo '{
  "name": "vps-management",
  "version": "1.0.0",
  "description": "VPS Management System",
  "main": "src/index.ts",
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}' > package.json

# Create initial content for .gitignore
echo 'node_modules
.env
dist
.DS_Store
*.log
.vscode/*
!.vscode/settings.json
!.vscode/launch.json
coverage' > .gitignore

# Create initial content for .env
echo '# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vps_management"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=24h

# Proxmox
PROXMOX_HOST=your-proxmox-host
PROXMOX_USER=root@pam
PROXMOX_PASSWORD=your-proxmox-password

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password

# Payment
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret' > .env

# Create initial content for tsconfig.json
echo '{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "lib": ["es6", "es2017", "esnext.asynciterable"],
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "./dist",
    "moduleResolution": "node",
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "exclude": ["node_modules"],
  "include": ["./src/**/*.ts"]
}' > tsconfig.json