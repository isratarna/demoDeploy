# Deployment Cheatsheet

Repo: `https://github.com/isratarna/demoDeploy.git` | VPS: `187.52.122.100` | User: `s20230204056`

## 1. Local check
```powershell
cd D:\demoVPS2\cicd-learning-app
git remote -v
node -v
npm -v
npm install
```

## 2. SSH into VPS
```powershell
ssh -i C:\Users\ARNA\.ssh\s20230204056 s20230204056@187.52.122.100
```

## 3. VPS update + tools
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install git curl unzip -y
git --version
```

## 4. PM2
```bash
sudo npm install pm2 -g
pm2 -v
```

## 5. Docker check
```bash
docker --version
docker ps
sudo usermod -aG docker $USER   # if permission error, then: exit, ssh back in
docker compose version
```

## 6. Clone project
```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/isratarna/demoDeploy.git
cd demoDeploy
ls
```

## 7. MySQL via Docker
```bash
nano docker-compose.yml
```
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
```bash
docker compose up -d
docker ps
```

## 8. Test MySQL
```bash
docker exec -it cicd-learning-mysql mysql -u root -p
# password: NewStrongPass123!
```
```sql
SHOW DATABASES;
exit;
```

## 9. Backend
```bash
cd backend
nano .env
```
```env
DB_HOST=localhost
DB_PORT=3311
DB_USER=root
DB_PASSWORD=NewStrongPass123!
DB_NAME=cicd_learning
PORT=4056
```
```bash
npm install
npm run build
cat package.json
pm2 start npm --name cicd-backend -- start
pm2 list
pm2 save
```

## 10. Frontend
```bash
cd ../frontend
nano .env.local
```
```env
NEXT_PUBLIC_API_URL=http://187.52.122.100:4056
```
```bash
npm install
npm run build
pm2 start npm --name cicd-frontend -- start
pm2 list
pm2 save
```

## 11. Nginx install
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

## 12. Nginx reverse proxy
```bash
sudo nano /etc/nginx/sites-available/demoDeploy
```
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
```bash
sudo ln -s /etc/nginx/sites-available/demoDeploy /etc/nginx/sites-enabled/demoDeploy
sudo ufw allow 8090
sudo nginx -t
sudo systemctl reload nginx
sudo ss -tulpn | grep 8090
```
App URL: `http://187.52.122.100:8090`

## 13. GitHub Actions workflow
```powershell
mkdir .github
mkdir .github\workflows
notepad .github\workflows\ci-cd.yml
```
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

## 14. GitHub secrets
`Settings → Secrets and variables → Actions`

| Name | Value |
|---|---|
| `VPS_HOST` | `187.52.122.100` |
| `VPS_USER` | `s20230204056` |
| `VPS_PORT` | `22` |
| `VPS_APP_DIR` | `/home/s20230204056/apps/demoDeploy` |
| `VPS_SSH_KEY` | (private key contents) |

## 15. Push to trigger CI/CD
```powershell
git add .
git commit -m "add github actions"
git push origin main
```
Check: `GitHub → Actions → Deploy Application`

## Day-to-day deploy (after setup)
```powershell
git add .
git commit -m "your change"
git push origin main
```

## Verify on VPS
```bash
pm2 list
pm2 logs cicd-backend
pm2 logs cicd-frontend
docker ps
sudo systemctl status nginx
```
