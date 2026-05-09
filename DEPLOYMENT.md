# Deployment Guide — transcribe.dmnstech.com

## Stack
- **App**: Next.js 16 (Node.js server)
- **Process manager**: PM2
- **Reverse proxy**: Nginx
- **TLS**: Let's Encrypt via Certbot
- **DNS/CDN**: Cloudflare
- **Hosting**: AWS EC2 (Ubuntu 22.04 LTS recommended)

---

## 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu 22.04 LTS** (t3.small or larger recommended)
3. Security Group — open inbound ports:
   - **22** (SSH)
   - **80** (HTTP)
   - **443** (HTTPS)
4. Create or select a key pair, download the `.pem` file
5. Note the **Public IPv4 address** after launch

---

## 2. Connect & Install Dependencies

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## 3. Deploy the App

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /home/ubuntu/transcriber-app
cd /home/ubuntu/transcriber-app

# Install dependencies
npm ci

# Create environment file
cp .env.local.example .env.local
nano .env.local
# Fill in: GROQ_API_KEY, NEXT_PUBLIC_ADSENSE_CLIENT_ID, slot IDs

# Build the app
npm run build
```

---

## 4. Start with PM2

```bash
cd /home/ubuntu/transcriber-app

# Start Next.js production server on port 3000
pm2 start npm --name "transcriber" -- start

# Save PM2 process list
pm2 save

# Configure PM2 to start on system reboot
pm2 startup
# Run the command it outputs (starts with: sudo env PATH=...)
```

Useful PM2 commands:
```bash
pm2 status          # check running processes
pm2 logs transcriber  # view logs
pm2 restart transcriber  # restart after code changes
```

---

## 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/transcriber
```

Paste this config:

```nginx
server {
    listen 80;
    server_name transcribe.dmnstech.com;

    # Increase upload size limit for audio files (25MB + overhead)
    client_max_body_size 30M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/transcriber /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Cloudflare DNS Setup

1. Log in to Cloudflare → select `dmnstech.com`
2. Go to **DNS** → Add record:
   - Type: `A`
   - Name: `transcribe`
   - IPv4: `<EC2_PUBLIC_IP>`
   - Proxy status: **Proxied** (orange cloud ✓)
3. Go to **SSL/TLS** → set mode to **Full (strict)**
4. Go to **Rules** → **Cache Rules** → Create rule:
   - Match: `hostname equals transcribe.dmnstech.com AND path starts with /api`
   - Cache: **Bypass cache**

---

## 7. TLS Certificate (Let's Encrypt)

> Note: Temporarily set Cloudflare proxy to **DNS only** (grey cloud) for this step, then re-enable after.

```bash
sudo certbot --nginx -d transcribe.dmnstech.com
# Follow prompts, choose to redirect HTTP → HTTPS
```

After Certbot completes, re-enable Cloudflare proxy (orange cloud).

---

## 8. Updating the App

```bash
cd /home/ubuntu/transcriber-app
git pull
npm ci
npm run build
pm2 restart transcriber
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq API key from console.groq.com |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optional | AdSense publisher ID (ca-pub-xxx) |
| `NEXT_PUBLIC_TOP_AD_SLOT_ID` | Optional | AdSense slot ID for top banner |
| `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID` | Optional | AdSense slot ID for bottom banner |
