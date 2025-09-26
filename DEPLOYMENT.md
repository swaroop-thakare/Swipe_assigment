# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository: `swaroop-thakare/Swipe_assigment`

2. **Configure Build Settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variables:**
   Go to Project Settings > Environment Variables and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_MEET_API_KEY=your_google_meet_api_key_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=your_private_key_here
   GOOGLE_CALENDAR_ID=primary
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project? No
   - Project name: ai-interview-platform
   - Directory: ./
   - Override settings? No

## 🔧 Configuration Details

### Vercel Configuration (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

### Environment Variables Setup

1. **MongoDB Atlas (Recommended):**
   - Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create new cluster
   - Get connection string
   - Add to Vercel as `MONGODB_URI`

2. **OpenAI API:**
   - Get API key from [platform.openai.com](https://platform.openai.com)
   - Add to Vercel as `OPENAI_API_KEY`

3. **Google Meet API:**
   - Set up Google Cloud Project
   - Enable Google Meet API
   - Create service account
   - Add credentials to Vercel

## 📱 Post-Deployment

### 1. Test Your Deployment
- Visit your Vercel URL
- Test resume upload
- Test interview flow
- Check WebSocket connection

### 2. Custom Domain (Optional)
- Go to Project Settings > Domains
- Add your custom domain
- Update DNS records

### 3. Monitor Performance
- Check Vercel Analytics
- Monitor API usage
- Set up error tracking

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Node.js version (18+ required)
   - Verify all dependencies in package.json
   - Check for TypeScript errors

2. **API Routes Not Working:**
   - Ensure `vercel.json` is configured correctly
   - Check API routes are in `/api` directory
   - Verify environment variables

3. **Database Connection Issues:**
   - Check MongoDB Atlas connection string
   - Verify network access settings
   - Test connection locally first

4. **WebSocket Issues:**
   - Vercel has limited WebSocket support
   - Consider using Socket.io with polling fallback
   - Check CORS settings

### Debug Commands:
```bash
# Check build locally
npm run build

# Test API routes locally
vercel dev

# Check logs
vercel logs
```

## 🚀 Production Optimizations

### 1. Performance:
- Enable Vercel Analytics
- Use Vercel Edge Functions for API routes
- Optimize images and assets
- Enable compression

### 2. Security:
- Set up proper CORS
- Use environment variables for secrets
- Enable HTTPS only
- Set up rate limiting

### 3. Monitoring:
- Set up error tracking (Sentry)
- Monitor API usage
- Set up uptime monitoring
- Configure alerts

## 📞 Support

If you encounter issues:
1. Check Vercel documentation
2. Review build logs
3. Test locally first
4. Contact support if needed

---

**Your AI Interview Platform is now live on Vercel! 🎉**
