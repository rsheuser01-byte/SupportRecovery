# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Your new Neon database URL: `postgresql://neondb_owner:npg_JELe2kia8YnI@ep-fragrant-art-aezubqms-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`

## Steps to Deploy

### 1. Set up your database schema
Before deploying, push your database schema to your new Neon database:

```bash
# Set your database URL temporarily for schema push
export DATABASE_URL="postgresql://neondb_owner:npg_JELe2kia8YnI@ep-fragrant-art-aezubqms-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Push the schema to your database
npm run db:push
```

### 2. Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy the application**:
   ```bash
   vercel
   ```

3. **Set environment variables** in your Vercel dashboard:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_JELe2kia8YnI@ep-fragrant-art-aezubqms-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `SESSION_SECRET`: Generate a strong random string (use: `openssl rand -base64 32`)
   - `NODE_ENV`: `production`
   - `REPLIT_DOMAINS`: Your Vercel domain (will be provided after deployment)
   - `REPL_ID`: Your authentication client ID (if using Replit auth)
   - `ISSUER_URL`: `https://replit.com/oidc` (if using Replit auth)

### 3. Alternative Authentication Setup
Since you're moving off Replit, you may want to replace Replit authentication with a different provider:

- **Auth0**: Popular choice for production apps
- **NextAuth.js**: Simple authentication for Next.js apps
- **Firebase Auth**: Google's authentication service
- **Custom JWT**: Roll your own authentication

### 4. Production Optimizations

1. **Database Connection Pooling**: Your Neon database already includes connection pooling
2. **Environment Variables**: All sensitive data is moved to environment variables
3. **Session Storage**: Uses PostgreSQL for session storage (production-ready)
4. **Security**: HTTPS enforcement and secure cookies in production

### 5. Testing Your Deployment

After deployment:
1. Visit your Vercel URL
2. Test user authentication
3. Verify database connectivity
4. Test all major features (revenue entry, reports, etc.)

## Files Created for Deployment

- `vercel.json`: Vercel deployment configuration
- `.env.example`: Template for environment variables
- `api/index.ts`: Serverless function handler for Vercel
- `DEPLOYMENT_GUIDE.md`: This deployment guide

## Notes

- The app is configured to work with serverless functions
- Database sessions are persisted in PostgreSQL
- All environment-specific configurations are handled via environment variables
- The frontend is statically built and served by Vercel's CDN