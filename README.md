Пример текста, для руководства по развертыванию

---

# Руководство по развертыванию: Инструкция для развертывания `server_nest`

## 1. Общая информация

Проект представляет собой серверное приложение на **NestJS** (версия 10) с TypeScript. Он активно взаимодействует с целым рядом внешних сервисов и требует для работы правильно настроенного окружения.  
Ниже описаны шаги, необходимые для развертывания в стабильной production-среде.

**Ключевые зависимости и их назначение** (по `package.json`):

*   **База данных**: PostgreSQL (драйвер `pg`, ORM `sequelize` + `sequelize-typescript`).
*   **Кеш и сессии**: Redis (`ioredis`, `connect-redis`).
*   **Аутентификация**: `passport`, `passport-local`, `argon2`, `bcrypt`, сессии через `express-session` с хранилищем Redis.
*   **Файловые операции**: загрузка (`multer`), проверка типов (`file-type`), извлечение метаданных (`exifr`, `music-metadata`), обработка изображений (`sharp`), работа с PDF (`pdf-parse`, `pdf-lib`), архивами (`node-stream-zip`, `unrar-js`, `yauzl`).
*   **Мультимедиа**: видео и аудио (`fluent-ffmpeg`, `ffmpeg-static`, `ffprobe-static`). **Важно:** `ffmpeg-static` включает бинарные файлы, но в production-окружении настоятельно рекомендуется использовать системную установку FFmpeg.
*   **Безопасность**: `helmet`, `csurf`, `express-session`, `sanitize-html`, `@nestlab/google-recaptcha`, `@nestjs/throttler`.
*   **Почта**: `@nestjs-modules/mailer` (требует настройки SMTP).
*   **Антивирусная проверка файлов**: `clamdjs` (требует запущенного демона ClamAV).
*   **gRPC**: `@grpc/grpc-js`, `@authzed/authzed-node` (Authzed/SpiceDB).

## 2. Системные требования

*   **Операционная система**: Ubuntu 22.04/24.04 LTS (рекомендуется) или аналогичный дистрибутив Linux.
*   **Node.js**: версия 18.x или 20.x (LTS).
*   **Менеджер пакетов**: `npm` (устанавливается вместе с Node.js).
*   **PostgreSQL**: версия 14 или новее.
*   **Redis**: версия 7.x.
*   **FFmpeg**: системная установка (пакет `ffmpeg`).
*   **ClamAV**: демон и утилита `clamd` (опционально, если антивирусная проверка задействована).
*   **Nginx** (рекомендуется) для обратного проксирования и SSL-терминации.

## 3. Подготовка сервера

### 3.1. Установка системных зависимостей

```bash
sudo apt update
sudo apt install -y curl wget gnupg lsb-release build-essential

# Утилита для сборки нативных модулей (если понадобится)
sudo apt install -y python3 make g++
```

### 3.2. Установка Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node -v
npm -v
```

### 3.3. Установка PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Переключитесь на пользователя postgres и создайте базу данных и пользователя
sudo -u postgres psql
```

Внутри `psql` выполните:

```sql
CREATE USER ваш_db_user WITH PASSWORD 'ваш_db_password';
CREATE DATABASE server_nest OWNER ваш_db_user;
GRANT ALL PRIVILEGES ON DATABASE server_nest TO ваш_db_user;
\q
```

### 3.4. Установка Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Проверка
redis-cli ping   # должен вернуть PONG
```

### 3.5. Установка FFmpeg

```bash
sudo apt install -y ffmpeg

# Проверка
ffmpeg -version
ffprobe -version
```

**Примечание:** После системной установки FFmpeg можно удалить пакет `ffmpeg-static` из зависимостей проекта, если он не используется напрямую. Но для совместимости оставьте — код может указывать путь к встроенному бинарнику.

### 3.6. Установка ClamAV (если активирована проверка)

```bash
sudo apt install -y clamav clamav-daemon
sudo systemctl enable clamav-daemon
sudo systemctl start clamav-daemon

# Убедитесь, что демон слушает порт 3310 (значение по умолчанию)
sudo ss -tlnp | grep 3310
```

Для корректной работы может потребоваться настроить права доступа к сокету или порту, если демон слушает TCP.

## 4. Развертывание приложения

### 4.1. Клонирование репозитория

Предполагается, что исходный код доступен по Git. Если нет – просто загрузите файлы.

```bash
git clone <ваш_репозиторий> /opt/server_nest
cd /opt/server_nest
```

### 4.2. Создание файла окружения

Создайте файл **`.env`** в корне проекта (или в соответствии с настройкой `@nestjs/config`). Образец минимально необходимых переменных:

```ini
# ---- Приложение ----
NODE_ENV=production
APP_PORT=3000
SESSION_SECRET=длинная_случайная_строка_из_60+_символов

# ---- База данных (PostgreSQL) ----
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ваш_db_user
DB_PASSWORD=ваш_db_password
DB_DATABASE=server_nest

# ---- Redis ----
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=если есть

# ---- Сессии (express-session с Redis) ----
SESSION_STORE=redis
# SESSION_TTL=86400

# ---- Почта (SMTP) ----
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user@example.com
MAIL_PASSWORD=пароль
MAIL_FROM="noreply@example.com"

# ---- Google reCAPTCHA ----
RECAPTCHA_SITE_KEY=ваш_ключ_сайта
RECAPTCHA_SECRET_KEY=ваш_секретный_ключ

# ---- ClamAV (антивирус) ----
CLAMD_HOST=127.0.0.1
CLAMD_PORT=3310

# ---- Внешние API (Authzed/SpiceDB, если используется) ----
# AUTHZED_ENDPOINT=grpc.example.com:443
# AUTHZED_TOKEN=...

# ---- Прочее ----
UPLOAD_DIR=./uploads   # директория для загружаемых файлов
```

**Внимание:** Замените все заполнители на реальные значения. Для генерации `SESSION_SECRET` используйте:

```bash
openssl rand -base64 48
```

### 4.3. Установка Node-зависимостей

```bash
npm ci --omit=dev
```

Флаг `--omit=dev` пропускает devDependencies, так как на production они не нужны. Если требуется запуск тестов или сборка на сервере, выполните `npm ci` без этого флага, а затем сборку.

### 4.4. Сборка приложения

NestJS требует компиляции TypeScript перед запуском. Запустите:

```bash
npm run build
```

После успешного выполнения появится папка `dist/`.  
Продакшн-запуск осуществляется командой:

```bash
node dist/main
```

### 4.5. Инициализация базы данных (миграции)

Судя по `package.json`, используется `sequelize-cli` и `sequelize-typescript`. Скорее всего, уже имеются миграции. Для их применения выполните:

```bash
npx sequelize-cli db:migrate
```

Если используется кастомная конфигурация, убедитесь, что в `.env` заданы правильные параметры подключения к БД, а в проекте есть файл `.sequelizerc` или конфигурация в коде.

Если миграций нет, но есть модели с `sequelize-typescript`, в NestJS может использоваться автогенерация таблиц через `SequelizeModule.forRoot({ ..., synchronize: true })`. **В production-среде `synchronize: true` крайне не рекомендуется** – лучше сгенерировать миграции вручную.

## 5. Настройка process manager (systemd) для автозапуска

Для надежной работы приложения после перезагрузки сервера рекомендуется запускать его через systemd.

Создайте юнит-файл:

```bash
sudo nano /etc/systemd/system/server_nest.service
```

Содержимое:

```ini
[Unit]
Description=NestJS Server – server_nest
Documentation=https://example.com
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data   # или отдельный пользователь без прав root
WorkingDirectory=/opt/server_nest
ExecStart=/usr/bin/node dist/main
Restart=always
RestartSec=5
EnvironmentFile=/opt/server_nest/.env
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal
SyslogIdentifier=server_nest

[Install]
WantedBy=multi-user.target
```

Установка прав и запуск:

```bash
# Создайте пользователя, если нужно:
# sudo useradd -r -s /bin/false server_nest
# и дайте права на папку проекта:
# sudo chown -R server_nest:server_nest /opt/server_nest

sudo systemctl daemon-reload
sudo systemctl enable server_nest
sudo systemctl start server_nest
```

Проверьте статус:

```bash
sudo systemctl status server_nest
sudo journalctl -u server_nest -f
```

## 6. Настройка Nginx в качестве обратного прокси

Установите Nginx:

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

Создайте конфигурацию виртуального хоста:

```bash
sudo nano /etc/nginx/sites-available/server_nest
```

Пример конфигурации с проксированием на локальный порт 3000 и заголовками для сессий/WebSocket (если используются):

```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 500M;   # для больших загрузок файлов
    proxy_read_timeout 600s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию и перезапустите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/server_nest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Если требуется SSL, настройте его с помощью `certbot` и пакета `python3-certbot-nginx`.

## 7. Проверка работоспособности

1.  Убедитесь, что все сервисы запущены: PostgreSQL, Redis, ClamAV (если нужен), приложение через systemd.
2.  Проверьте логи приложения: `sudo journalctl -u server_nest -n 50`.
3.  Откройте в браузере адрес вашего API (например, `http://api.example.com/docs`), должен загрузиться Swagger-документация (пакет `@nestjs/swagger` присутствует в зависимостях).
4.  Протестируйте основные маршруты, аутентификацию и загрузку файлов.

## 8. Возможные проблемы и решения

| Проблема | Вероятная причина | Решение |
| :--- | :--- | :--- |
| `Error: Connection refused` к PostgreSQL | PostgreSQL не слушает TCP/IP | Проверить `listen_addresses` в `postgresql.conf` (должно быть `localhost` или `*`). |
| `Error: connect ECONNREFUSED 127.0.0.1:6379` | Redis не запущен или слушает только сокет | Включить TCP в `redis.conf` (`port 6379`). |
| `spawn ffmpeg ENOENT` | FFmpeg не найден системой | Установить `ffmpeg` глобально и убедиться, что он в `PATH` для процесса Node. Или скорректировать пути в коде. |
| `clamav: connect ECONNREFUSED` | Демон ClamAV не слушает порт | Настроить `clamd.conf` для TCP (`TCPSocket 3310`, `TCPAddr 127.0.0.1`). |
| Миграции Sequelize не применяются | Отсутствует папка `migrations` или неверный конфиг | Создать файл `.sequelizerc`, указать пути. Проверить `config.js` для чтения из `.env`. |
| Загруженные файлы не сохраняются | Нет прав на папку `uploads` | Убедиться, что пользователь, от которого запущено приложение (например, `www-data`), имеет права на запись в `UPLOAD_DIR`. |