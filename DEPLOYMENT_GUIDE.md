# 🚀 Bean Coffee POS — Deployment Guide

This guide covers deploying Bean Coffee POS to production environments.

## Prerequisites

- **Backend:** .NET 10 SDK, PostgreSQL 12+
- **Frontend:** Node.js 18+, npm 9+
- **Infrastructure:** Docker/Kubernetes (optional), Linux/macOS/Windows server, reverse proxy (nginx recommended)

---

## Local Development Setup

### 1. Backend Configuration

```bash
cd backend/Bean.Api

# Set local database connection string (macOS/Linux)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=bean_pos;Username=postgres;Password=postgres"

# Or edit appsettings.Development.json directly for testing
```

### 2. Start Backend

```bash
cd backend/Bean.Api
ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls http://localhost:5080
```

Backend health check:
```bash
curl http://localhost:5080/api/health/database
```

Swagger API docs: http://localhost:5080/swagger

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## Production Deployment

### 1. Environment Configuration

#### Backend — appsettings.Production.json

The production settings use environment variables for secrets:

```bash
# Set environment variables before running
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Host=prod-db.example.com;Port=5432;Database=bean_pos_prod;Username=app_user;Password=SECURE_PASSWORD;SSL Mode=Require"
export Cors__AllowedOrigins__0="https://your-frontend-domain.com"
```

Or use a `.env` file with a process manager like systemd or Docker:

```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=prod-db.example.com;Port=5432;Database=bean_pos_prod;Username=app_user;Password=SECURE_PASSWORD;SSL Mode=Require
Cors__AllowedOrigins__0=https://your-frontend-domain.com
```

#### Frontend — .env.production

```env
VITE_API_URL=https://api.your-domain.com/api
```

### 2. Build for Production

#### Backend

```bash
cd backend/Bean.Api

# Publish self-contained runtime
dotnet publish -c Release -o ./publish --self-contained -r linux-x64

# Or use Docker
docker build -f Dockerfile -t bean-coffee-api:latest .
```

#### Frontend

```bash
cd frontend

# Create production build
npm run build

# Output in: frontend/dist/
```

### 3. Database Setup

Before deploying the application, ensure PostgreSQL is running and the database exists:

```bash
# Create database
createdb bean_pos_prod

# Migrations run automatically on app startup via:
# dbContext.Database.Migrate();
# (see Program.cs line ~33)
```

### 4. Server Deployment

#### Option A: Standalone Linux Service (systemd)

**Backend Service File** — `/etc/systemd/system/bean-api.service`

```ini
[Unit]
Description=Bean Coffee POS API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bean-api
EnvironmentFile=/var/www/bean-api/.env
ExecStart=/var/www/bean-api/Bean.Api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bean-api
sudo systemctl start bean-api
```

#### Option B: Docker Deployment

**Dockerfile** — `backend/Bean.Api/Dockerfile` (if not present, create it)

```dockerfile
FROM mcr.microsoft.com/dotnet/runtime:10 AS base
WORKDIR /app
EXPOSE 5080

FROM mcr.microsoft.com/dotnet/sdk:10 AS build
WORKDIR /src
COPY ["backend/Bean.Api/Bean.Api.csproj", "Bean.Api/"]
RUN dotnet restore "Bean.Api/Bean.Api.csproj"
COPY . .
WORKDIR "/src/Bean.Api"
RUN dotnet build "Bean.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Bean.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Bean.Api.dll"]
```

Build and run:
```bash
docker build -t bean-coffee-api:latest .
docker run -d \
  --name bean-api \
  -p 5080:5080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__DefaultConnection="Host=db-host;..." \
  -e Cors__AllowedOrigins__0="https://frontend.com" \
  bean-coffee-api:latest
```

### 5. Nginx Reverse Proxy Configuration

**File:** `/etc/nginx/sites-available/bean-coffee`

```nginx
upstream bean_api {
    server localhost:5080;
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    client_max_body_size 10M;

    location /api {
        proxy_pass http://bean_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/bean-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bean-coffee /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 6. SSL/TLS Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.your-domain.com -d your-domain.com
```

Auto-renewal:
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 7. Database Backup Strategy

**Daily backup script** — `/usr/local/bin/backup-bean-db.sh`

```bash
#!/bin/bash
BACKUP_DIR="/backups/bean-pos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres -h localhost bean_pos_prod | gzip > "$BACKUP_DIR/bean_pos_$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -name "bean_pos_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
sudo crontab -e
# 0 2 * * * /usr/local/bin/backup-bean-db.sh
```

---

## Monitoring & Logging

### Health Check Endpoints

```bash
# API health
curl https://api.your-domain.com/api/health

# Database connectivity
curl https://api.your-domain.com/api/health/database
```

### Application Logs

**Backend logs** (systemd):
```bash
sudo journalctl -u bean-api -f
```

**Frontend errors** — Browser DevTools Console

### Key Metrics to Monitor

- **API Response Time:** Target < 200ms
- **Database Connection Pool:** Monitor for exhaustion
- **Disk Space:** Ensure sufficient for database growth
- **Memory Usage:** .NET app typically 50–150 MB
- **SSL Certificate Expiry:** Auto-renew before expiration

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
sudo journalctl -u bean-api -n 50

# Verify database connection
psql -h localhost -U postgres -d bean_pos_prod -c "SELECT 1;"

# Verify environment variables are set
echo $ConnectionStrings__DefaultConnection
```

### CORS Errors

If frontend receives "CORS policy" errors, check:

1. **Backend CORS config** matches frontend domain
   ```bash
   echo $Cors__AllowedOrigins__0
   ```

2. **Nginx forwards headers correctly:**
   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

### Database Connection Timeout

Increase connection string timeout:
```
ConnectionStrings__DefaultConnection=Host=db;...;Timeout=30;CommandTimeout=30
```

---

## Post-Deployment Verification

- [ ] Health endpoints respond (HTTP 200)
- [ ] POS page loads without API errors
- [ ] Add product to cart and complete checkout
- [ ] Verify sale saved to database
- [ ] Verify stock decremented
- [ ] Admin dashboard loads and displays products
- [ ] Inventory adjustment modal appears and saves
- [ ] SSL certificate valid and auto-renews
- [ ] Backups running and stored safely
- [ ] Logs being generated and monitored

---

## Next Steps (Phase 12)

Before full production deployment, implement:

1. **Authentication & Authorization** — User login, role-based access
2. **Audit Trail** — Track who made which changes
3. **Rate Limiting** — Protect API from abuse
4. **Input Validation** — Server-side sanitization
5. **Error Tracking** — Sentry or similar service
6. **Performance Monitoring** — APM tool (New Relic, Datadog)

See `DEPLOYMENT_ROADMAP.md` for Phase 12 details.

---

## Support & Documentation

- **API Docs:** `https://api.your-domain.com/swagger`
- **README:** `./README.md`
- **Source:** `https://github.com/Larcadeee/Bean-Coffee-POS`

