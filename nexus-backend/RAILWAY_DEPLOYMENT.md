# Railway Deployment Guide for Nexus Backend

This guide will walk you through deploying your Nexus backend to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Plaid Account**: For financial data integration
4. **Sentry Account**: For error tracking (optional)

## Step 1: Connect Your Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `nexus` repository
5. Select the `nexus-backend` directory as the source

## Step 2: Set Up Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the `DATABASE_URL` from the database service variables

## Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables:
```
NODE_ENV=production
DATABASE_URL=<your_railway_postgres_url>
JWT_SECRET=<your_super_secret_jwt_key>
PLAID_CLIENT_ID=<your_plaid_client_id>
PLAID_SECRET=<your_plaid_secret>
PLAID_ENV=sandbox
```

### Optional Variables:
```
SENTRY_DSN=<your_sentry_dsn>
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
JWT_EXPIRES_IN=24h
```

## Step 4: Deploy

1. Railway will automatically detect your Node.js app
2. It will install dependencies from `package.json`
3. Run the start command: `npm start`
4. Your app will be deployed and get a Railway URL

## Step 5: Database Migration

After deployment, you'll need to run database migrations:

1. Go to your Railway project
2. Click on your backend service
3. Go to "Deployments" tab
4. Click "Deploy" to trigger a new deployment

## Step 6: Verify Deployment

1. Visit your Railway URL (e.g., `https://nexus-backend-production.up.railway.app`)
2. You should see: "Nexus API Running"
3. Test your API endpoints

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment | Yes | production |
| `DATABASE_URL` | PostgreSQL connection | Yes | - |
| `JWT_SECRET` | JWT signing key | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration | No | 24h |
| `PLAID_CLIENT_ID` | Plaid client ID | Yes | - |
| `PLAID_SECRET` | Plaid secret key | Yes | - |
| `PLAID_ENV` | Plaid environment | No | sandbox |
| `SENTRY_DSN` | Sentry error tracking | No | - |
| `CORS_ORIGIN` | CORS allowed origin | No | * |
| `LOG_LEVEL` | Logging level | No | info |

## Custom Domain (Optional)

1. In Railway, go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Configure DNS records as instructed

## Monitoring & Logs

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Railway automatically checks your `/` endpoint

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check Node.js version compatibility
2. **Database Connection**: Verify `DATABASE_URL` format
3. **Environment Variables**: Ensure all required vars are set
4. **Port Issues**: Railway sets `PORT` automatically

### Debug Commands:

```bash
# Check Railway logs
railway logs

# Connect to Railway shell
railway shell

# View environment variables
railway variables
```

## API Endpoints

Your deployed API will have these endpoints:

- `GET /` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile
- `POST /api/plaid/link` - Link Plaid account
- `GET /api/cardrank/recommendations` - Get card recommendations
- `POST /api/interestkiller/optimize` - Interest optimization

## Security Best Practices

1. **Use strong JWT secrets**
2. **Enable HTTPS** (automatic on Railway)
3. **Set proper CORS origins**
4. **Use environment variables for secrets**
5. **Regular security updates**

## Cost Optimization

- Railway charges based on usage
- Consider using sleep mode for development
- Monitor resource usage in dashboard
- Use appropriate instance sizes

---

Your Nexus backend is now deployed and ready to serve your mobile app! 🚀 