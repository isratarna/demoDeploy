# CI/CD Learning App — Deployment Guide

This document is the full, step-by-step process used to deploy this project (`demoDeploy / cicd-learning-app`) to a VPS, and how the GitHub Actions CI/CD pipeline automates redeploys afterward. Every command used is listed in order — nothing skipped.

Repo: `https://github.com/isratarna/demoDeploy.git`
VPS: `187.52.122.100`
VPS user: `s20230204056`

---

## Part A — One-time Manual Setup (done once to prepare the VPS)

### Step 1: Local Project Check

On your PC, in the project folder:

```powershell
cd D:\demoVPS2\cicd-learning-app
```

Check git remote:

```powershell
git remote -v
```

Expected output:

```text
origin  https://github.com/isratarna/demoDeploy.git
```

Check Node and npm versions:

```powershell
node -v
npm -v
```

Install dependencies:

```powershell
npm install
```

---

### Step 2: VPS Login

From your PC PowerShell:

```powershell
ssh -i C:\Users\ARNA\.ssh\s20230204056 s20230204056@187.52.122.100
```

You should land at:

```bash
s20230204056@srv1918328:~$
```

---

### Step 3: VPS Basic Update

On the VPS:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install git curl unzip -y
git --version
```

---

### Step 4: Install PM2

```bash
sudo npm install pm2 -g
pm2 -v
```

---

### Step 5: Docker Check

```bash
docker --version
docker ps
```

If you get a permission error, fix it:

```bash
sudo usermod -aG docker $USER
exit
```

Log back in via SSH (Step 2), then verify:

```bash
docker ps
docker compose version
```

---

### Step 6: Clone the Project on the VPS

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/isratarna/demoDeploy.git
cd demoDeploy
ls
```

Expected output:

```text
backend
frontend
package.json
package-lock.json
```

---

### Step 7: Create MySQL Docker Container

From `~/apps/demoDeploy`:

```bash
nano docker-compose.yml
```

Paste this content:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: cicd-learning-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: "NewStrongPass123!"
      MYSQL_DATABASE: cicd_learning
    ports:
      - "3311:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Start the container:

```bash
docker compose up -d
docker ps
```

---

### Step 8: Test MySQL

```bash
docker exec -it cicd-learning-mysql mysql -u root -p
```

Enter password when prompted:

```text
NewStrongPass123!
```

Inside the MySQL shell:

```sql
SHOW DATABASES;
exit;
```

---

### Step 9: Backend Setup

```bash
cd backend
nano .env
```

Content of `.env`:

```env
DB_HOST=localhost
DB_PORT=3311
DB_USER=root
DB_PASSWORD=NewStrongPass123!
DB_NAME=cicd_learning

PORT=4056
```

Install, build, and check the start script:

```bash
npm install
npm run build
cat package.json
```

Start with PM2:

```bash
pm2 start npm --name cicd-backend -- start
pm2 list
pm2 save
```

---

### Step 10: Frontend Setup

```bash
cd ../frontend
nano .env.local
```

Content of `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://187.52.122.100:4056
```

Install, build, and start:

```bash
npm install
npm run build
pm2 start npm --name cicd-frontend -- start
pm2 list
pm2 save
```

---

### Step 11: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

### Step 12: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/demoDeploy
```

Content:

```nginx
server {

    listen 8090;

    server_name _;

    location / {

        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;

    }


    location /api/ {

        proxy_pass http://localhost:4056/api/;

        proxy_set_header Host $host;

    }

}
```

Enable the site, open the firewall port, test, and reload:

```bash
sudo ln -s /etc/nginx/sites-available/demoDeploy /etc/nginx/sites-enabled/demoDeploy
sudo ufw allow 8090
sudo nginx -t
sudo systemctl reload nginx
sudo ss -tulpn | grep 8090
```

App is now reachable at:

```text
http://187.52.122.100:8090
```

---

## Part B — CI/CD Setup (GitHub Actions auto-deploy)

### Step 13: Add the GitHub Actions Workflow

On your local PC, inside the project folder:

```powershell
mkdir .github
mkdir .github\workflows
notepad .github\workflows\ci-cd.yml
```

Paste the following workflow (this is the exact file used, located at [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)):

```yaml
name: Deploy Application

on:
  push:
    branches:
      - main

jobs:
  deploy:

    runs-on: ubuntu-latest

    steps:

      - name: Checkout code
        uses: actions/checkout@v4


      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.2.0

        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}

          script: |

            cd ${{ secrets.VPS_APP_DIR }}

            git pull origin main


            cd backend

            npm install

            npm run build

            pm2 restart cicd-backend


            cd ../frontend

            npm install

            npm run build

            pm2 restart cicd-frontend
```

This workflow triggers on every push to `main`, connects to the VPS over SSH, pulls the latest code, rebuilds both backend and frontend, and restarts both PM2 processes.

---

### Step 14: Add GitHub Secrets

In the GitHub repository, go to:

```text
Settings → Secrets and variables → Actions
```

Add the following repository secrets:

| Secret name    | Value                                       |
|----------------|----------------------------------------------|
| `VPS_HOST`     | `187.52.122.100`                              |
| `VPS_USER`     | `s20230204056`                                |
| `VPS_PORT`     | `22`                                          |
| `VPS_APP_DIR`  | `/home/s20230204056/apps/demoDeploy`          |
| `VPS_SSH_KEY`  | (paste the full private SSH key contents)     |

---

### Step 15: Push and Trigger CI/CD

On your local PC:

```powershell
git add .
git commit -m "add github actions"
git push origin main
```

Then check the pipeline run in GitHub:

```text
GitHub → Actions → Deploy Application
```

---

## How to Deploy After Initial Setup (day-to-day)

Once Part A and Part B are done once, every future deployment is automatic:

```powershell
git add .
git commit -m "your change description"
git push origin main
```

Pushing to `main` triggers the `Deploy Application` workflow, which SSHes into the VPS, pulls the code, rebuilds backend and frontend, and restarts both PM2 processes — no manual VPS steps required.

---

## Useful Verification Commands (on the VPS)

```bash
pm2 list
pm2 logs cicd-backend
pm2 logs cicd-frontend
docker ps
sudo systemctl status nginx
```
