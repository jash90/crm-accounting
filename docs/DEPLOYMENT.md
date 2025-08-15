# Deployment Guide

## Prerequisites

- Node.js 18+ (Apple Silicon M1 Pro compatible)
- Supabase account and project
- Git repository (GitHub, GitLab, etc.)

## Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a strong password for your database
4. Wait for project initialization (~2 minutes)

### 2. Run Database Migrations
1. Navigate to SQL Editor in Supabase Dashboard
2. Create a new query and run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_auth_functions.sql`

### 3. Deploy Edge Functions
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Deploy functions:
   ```bash
   supabase functions deploy register-owner
   supabase functions deploy create-invite
   supabase functions deploy accept-invite
   ```

### 4. Configure Authentication
1. Go to Authentication → Settings in Supabase Dashboard
2. Disable email confirmation (for development)
3. Configure redirect URLs for your domain
4. Set up email templates (optional)

### 5. Create Initial SUPERADMIN User
1. Go to Authentication → Users in Supabase Dashboard
2. Create a new user with email/password
3. Note the user ID
4. Run this SQL to make them SUPERADMIN:
   ```sql
   INSERT INTO users (id, email, role, company_id)
   VALUES ('USER_ID_FROM_AUTH', 'admin@yourcompany.com', 'SUPERADMIN', NULL);
   ```

## Environment Configuration

### 1. Get Supabase Credentials
1. Go to Settings → API in Supabase Dashboard
2. Copy your Project URL and anon public key

### 2. Configure Environment Variables

**For Development (.env.local):**
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**For Production:**
Set these environment variables in your hosting platform.

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run cypress:open
```

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Select the project

2. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Deploy:**
   - Click "Deploy"
   - Automatic deployments on git push

### Option 2: Netlify

1. **Connect Repository:**
   - Go to [netlify.com](https://netlify.com)
   - Connect your Git repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Configure Redirects:**
   Create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option 3: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=0 /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf:**
   ```nginx
   events {
     worker_connections 1024;
   }
   
   http {
     include /etc/nginx/mime.types;
     
     server {
       listen 80;
       server_name localhost;
       
       location / {
         root /usr/share/nginx/html;
         index index.html index.htm;
         try_files $uri $uri/ /index.html;
       }
     }
   }
   ```

3. **Build and Run:**
   ```bash
   docker build -t saas-app .
   docker run -p 80:80 saas-app
   ```

## Security Checklist

### Production Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database RLS policies tested
- [ ] Edge Functions deployed
- [ ] Email confirmation enabled (production)
- [ ] Strong database password
- [ ] Regular backups configured

### Monitoring Setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring

## Performance Optimization

### 1. Build Optimization
```bash
# Analyze bundle size
npm run build && npx vite-bundle-analyzer
```

### 2. Database Optimization
- Monitor slow queries in Supabase Dashboard
- Add indexes for frequently queried columns
- Use database connection pooling

### 3. CDN Configuration
- Configure Vercel/Netlify CDN
- Enable Brotli compression
- Set appropriate cache headers

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check Supabase project URL
   - Verify environment variables

2. **RLS Policy Errors:**
   - Test policies in SQL editor
   - Check user roles and company_id

3. **Edge Function Errors:**
   - Check function logs in Supabase Dashboard
   - Verify JWT token format

4. **Build Failures:**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify environment variables

### Debug Commands
```bash
# Check build locally
npm run build && npm run preview

# Run type checking
npx tsc --noEmit

# Test database connection
npm run supabase:gen
```

## Backup Strategy

### 1. Database Backups
- Supabase provides automatic daily backups
- Export critical data regularly
- Test restore procedures

### 2. Code Backups
- Git repository with tags for releases
- Environment variable documentation
- Infrastructure as code (future)

## Scaling Considerations

### Database Scaling
- Monitor connection counts
- Consider read replicas for heavy read workloads
- Implement database connection pooling

### Application Scaling
- Use CDN for static assets
- Implement caching strategies
- Consider serverless functions for heavy computations

### Monitoring Scaling
- Set up alerts for performance metrics
- Monitor user growth and usage patterns
- Plan for traffic spikes

This deployment guide ensures a secure, scalable production deployment of your multi-tenant SaaS platform.