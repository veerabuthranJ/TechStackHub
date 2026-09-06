# Secure Content Portal

## Project Overview
Secure Content Portal is a role-based internal training and reference portal for sharing videos, PDF documents, and HTML content. The system uses Google OAuth, JWT-based HttpOnly cookies, server-side role enforcement, and private S3 delivery to keep the content access model controlled and auditable.

## Features
- Google OAuth authentication
- Role-based access control with ADMIN and VIEWER roles
- Admin upload, metadata editing, and delete workflows
- Secure private S3 storage for uploaded files
- Video streaming with range requests
- PDF rendering through authenticated views
- Sandboxed HTML rendering without direct public URLs

## Architecture
```text
                     ┌──────────────────────┐
                     │      Vercel          │
                     │   React + Vite UI    │
                     └──────────┬───────────┘
                                │ HTTPS with cookies
                                ▼
                     ┌──────────────────────┐
                     │      Render          │
                     │ Express + Passport    │
                     │ JWT auth + RBAC      │
                     │ Content API          │
                     └──────────┬───────────┘
                                │
                     ┌──────────┴───────────┐
                     ▼                      ▼
             ┌─────────────────┐    ┌─────────────────┐
             │ Supabase        │    │ AWS S3          │
             │ PostgreSQL      │    │ Private bucket  │
             └─────────────────┘    └─────────────────┘
```

## Tech Stack
- React, Vite, and Tailwind for the frontend experience
- React Router, Axios, and React Hook Form for the portal interactions
- Express, Passport, JWT, Helmet, and rate limiting for backend security
- Prisma and PostgreSQL for persistent user and metadata storage
- AWS S3 for private content hosting with authenticated stream access
- Zod for validation and HttpOnly cookies for session state

## Local Setup
1. Install Node.js and ensure package managers are available.
2. Create environment files from the example files in the client and server folders.
3. In the backend folder, run npm install and then npm run dev.
4. In the frontend folder, run npm install and then npm run dev.
5. Open the frontend in a browser and sign in with Google.
6. Set the ADMIN_EMAILS value to allow at least one admin account.

## Environment Variables
The project expects the following configuration values:

- NODE_ENV: development or production mode
- PORT: the backend server port
- DATABASE_URL: Supabase PostgreSQL connection string
- CLIENT_URL: the frontend origin used for CORS and redirecting
- GOOGLE_CLIENT_ID: Google OAuth client ID
- GOOGLE_CLIENT_SECRET: Google OAuth client secret
- GOOGLE_CALLBACK_URL: Google callback endpoint for the backend
- JWT_SECRET: a long random secret used for JWT signing
- ADMIN_EMAILS: comma-separated admin email allow list
- AWS_REGION: AWS region for S3
- AWS_ACCESS_KEY_ID: AWS access key
- AWS_SECRET_ACCESS_KEY: AWS secret key
- AWS_S3_BUCKET: the private S3 bucket name
- VITE_API_URL: frontend API base URL for the backend

Do not commit real credentials or secrets to source control.

## Deployment

### 1. Deploy the backend to Render

Create a Render Web Service from this repository with:

- Root Directory: `server`
- Runtime: Node
- Build Command: `npm install && npx prisma generate`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Set these Render environment variables from `server/.env.example`:

- `NODE_ENV=production`
- `PORT=10000`
- `DATABASE_URL` using the Supabase connection string with SSL enabled
- `CLIENT_URL` using the final Vercel URL
- Google OAuth credentials
- `GOOGLE_CALLBACK_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/auth/google/callback`
- A long random `JWT_SECRET`
- The two admin addresses in `ADMIN_EMAILS`, separated by commas
- AWS S3 credentials and the private bucket name

After deployment, verify `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns a successful status.

### 2. Deploy the frontend to Vercel

Create a Vercel project from this repository with:

- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set this Vercel environment variable:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

The `client/vercel.json` file keeps React Router URLs working after refresh.

### 3. Finish Google OAuth configuration

In Google Cloud Console, add this authorized redirect URI exactly:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/auth/google/callback
```

Add the deployed Vercel origin to the OAuth authorized JavaScript origins if Google requests it. Update Render `CLIENT_URL` to the exact Vercel origin, including the `https://` scheme and without a trailing slash.

### 4. Configure Supabase and S3

The Supabase database must contain the Prisma schema. From the server directory, run `npx prisma db push` once against the intended production database, or use a reviewed migration workflow before the first production login. Keep the S3 bucket private and grant the backend only the required object actions: `GetObject`, `PutObject`, `DeleteObject`, and `HeadObject`.

## Security Decisions
- HttpOnly cookies keep JWTs out of browser storage.
- Server-side RBAC enforces admin-only access on every protected route.
- Private S3 remains hidden behind authenticated API endpoints.
- Content is streamed with range support instead of exposing direct object URLs.
- Input validation blocks invalid uploads, wrong file types, and oversized files.
- Helmet and rate limits reduce common web application attack vectors.

## Known Limitations
> It is not possible to completely prevent a determined authenticated user from capturing content displayed in a browser. Measures such as disabling download buttons, sandboxing, streaming, and short-lived access controls are deterrents and access-control mechanisms, not full DRM.

## Future Improvements
- Watermarking
- HLS streaming
- DRM
- Expiring session-bound access tokens
- Audit logging
- Automated security tests
- Malware scanning for uploaded files
