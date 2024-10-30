#!/bin/bash

# Install dependencies
npm install express @prisma/client cors dotenv bcrypt jsonwebtoken winston stripe @types/stripe proxmox-api nodemailer zod

# Install dev dependencies
npm install -D prisma typescript ts-node @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/nodemailer nodemon @types/jest jest ts-jest supertest @types/supertest

# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate