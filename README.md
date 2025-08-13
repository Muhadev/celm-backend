# Celm Backend - Business Registration Platform

A robust, scalable Node.js + TypeScript backend API for the Celm business registration platform with multi-step onboarding and Google OAuth integration.

## 🚀 Features

- **Multi-Step Registration Flow**: Email → Personal Info → Business Type → Shop Details → Location
- **Google OAuth Integration**: Seamless authentication with Google accounts
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Email Verification**: Professional HTML email templates with MailHog testing
- **Database Management**: PostgreSQL with Knex.js migrations and seeds
- **Redis Caching**: Session management and caching layer
- **Docker Development**: Complete containerized development environment
- **Security**: Rate limiting, CORS, input validation, password hashing
- **Error Handling**: Centralized error management with custom error classes
- **Logging**: Winston logger with structured logging
- **Type Safety**: Full TypeScript implementation with strict mode

## 📋 Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 18+ (if running locally)
- PostgreSQL 15+ (if running locally)
- Redis 6+ (if running locally)

## 🛠️ Quick Start

### 1. Clone & Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd celm-backend

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Update `.env` with your settings:

```bash
# Core Configuration
NODE_ENV=development
PORT=3000

# Database (Docker)
DB_HOST=postgres
DB_NAME=celm_db
DB_USER=postgres
DB_PASSWORD=password

# JWT Secrets (Generate secure keys)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long

# Google OAuth (Get from Google Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Start Development Environment

```bash
# Start all services (PostgreSQL, Redis, MailHog, App)
docker-compose -f docker-compose.dev.yml up -d

# Check services are running
docker-compose -f docker-compose.dev.yml ps
```

### 4. Setup Database

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run migrate:up

# Seed test data
docker-compose -f docker-compose.dev.yml exec app npm run seed:run
```

### 5. Verify Setup

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Check email interface
open http://localhost:8025
```

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google+ API
3. Create OAuth 2.0 credentials:
   - **Authorized JavaScript Origins**: `http://localhost:3000`
   - **Authorized Redirect URIs**: `http://localhost:3000/auth/google/callback`
4. Copy Client ID and Secret to `.env`

## 📚 API Documentation

### Authentication Flow

#### **Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### **Registration Flow (5 Steps)**

**Step 1: Start Registration**
```http
POST /api/v1/registration/start
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

**Step 1b: Google OAuth (Alternative)**
```http
POST /api/v1/registration/google-auth
Content-Type: application/json

{
  "token": "google_id_token_here"
}
```

**Step 2: Personal Information**
```http
POST /api/v1/registration/personal-info
Content-Type: application/json

{
  "sessionToken": "session_token_from_step_1",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securePassword123"
}
```

**Step 3: Business Type**
```http
POST /api/v1/registration/business-type
Content-Type: application/json

{
  "sessionToken": "session_token",
  "businessType": "both"
}
```

**Step 4: Shop Details**
```http
POST /api/v1/registration/shop-details
Content-Type: application/json

{
  "sessionToken": "session_token",
  "businessName": "My Awesome Business",
  "businessDescription": "We provide amazing services"
}
```

**Step 5: Location (Completes Registration)**
```http
POST /api/v1/registration/location
Content-Type: application/json

{
  "sessionToken": "session_token",
  "country": "Nigeria",
  "state": "Lagos",
  "localGovernment": "Ikeja",
  "address": "123 Business Street"
}
```

### Other Endpoints

```http
POST /api/v1/auth/logout              # Logout user
POST /api/v1/auth/refresh-token       # Refresh access token
POST /api/v1/auth/forgot-password     # Request password reset
POST /api/v1/auth/reset-password      # Reset password with token
GET  /api/v1/auth/check               # Check auth status
GET  /api/v1/health                   # Health check
```

## 🗄️ Database Schema

### Users Table
```sql
id              UUID PRIMARY KEY
email           VARCHAR UNIQUE NOT NULL
first_name      VARCHAR NOT NULL
last_name       VARCHAR NOT NULL
password        VARCHAR (nullable for OAuth users)
email_verified  BOOLEAN DEFAULT false
shop_url        VARCHAR UNIQUE (auto-generated: businessname.celm.com)
business_name   VARCHAR
business_description TEXT
business_type   VARCHAR (services/products/both)
location        JSON (country, state, localGovernment, address)
oauth_provider  VARCHAR (google)
oauth_id        VARCHAR
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Registration Sessions Table
```sql
id                  UUID PRIMARY KEY
email               VARCHAR NOT NULL
session_token       VARCHAR UNIQUE NOT NULL
step_data           JSON DEFAULT '{}'
current_step        INTEGER DEFAULT 1
total_steps         INTEGER DEFAULT 5
email_verified      BOOLEAN DEFAULT false
verification_token  VARCHAR
oauth_provider      VARCHAR
oauth_data          JSON
expires_at          TIMESTAMP NOT NULL
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## 🧪 Testing with Postman

### Test Data (Seeded Users)
```json
{
  "john@example.com": "password123",
  "sarah@example.com": "password123",
  "mike@example.com": "password123",
  "testuser@celm.com": "password123"
}
```

### Registration Flow Test
1. **Start**: `POST /api/v1/registration/start` with email
2. **Verify Email**: Check MailHog at http://localhost:8025
3. **Continue Steps**: Use session token from each response
4. **Complete**: Receive welcome email and JWT tokens

### Email Testing
- **MailHog Interface**: http://localhost:8025
- **SMTP**: localhost:1025 (configured automatically)
- All emails appear in MailHog during development

## 🐳 Docker Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down

# Reset database (nuclear option)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml exec app npm run migrate:up
docker-compose -f docker-compose.dev.yml exec app npm run seed:run

# Access database directly
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d celm_db
```

## 🏗️ Project Structure

```
src/
├── auth/                      # Authentication module
│   ├── controllers/           # Auth & registration controllers
│   ├── middleware/            # Auth middleware
│   ├── models/               # User & session models
│   ├── routes/               # Auth routes
│   ├── services/             # Auth, email, OAuth services
│   ├── templates/            # Email templates
│   └── types/                # Auth type definitions
├── config/                   # App configuration
├── database/                 # DB setup, migrations, seeds
├── middleware/               # Global middleware
├── routes/                   # Health routes
├── types/                    # Global types
├── utils/                    # Utilities (logger, errors)
└── server.ts                 # App entry point
```

## 🔧 Key Features Implemented

### ✅ Multi-Step Registration
- Email verification with professional templates
- Personal information collection
- Business type selection (services/products/both)
- Shop details with auto-generated URLs
- Location selection (country/state/local/address)

### ✅ Google OAuth Integration
- Token verification with Google API
- Seamless account creation
- Existing account linking

### ✅ Security Features
- JWT with refresh tokens
- Password hashing with bcrypt
- Rate limiting and CORS
- Input validation with Joi
- Session management

### ✅ Email System
- Professional HTML templates
- Verification emails
- Welcome emails
- Password reset emails
- MailHog for development testing

### ✅ Database Management
- TypeScript migrations
- Seed data for testing
- Foreign key relationships
- Proper indexing

## 🚀 What's Next?

This backend is ready for:
- ✅ Frontend integration
- ✅ Postman testing
- ✅ Google OAuth testing
- ✅ Email flow testing

### Planned Features
- Business profile management
- Product/service listings
- Search and discovery
- Reviews and ratings
- Payment integration
- Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'feat: add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## 📞 Support

- **Email**: support@celm.com
- **Issues**: Create GitHub issue
- **Documentation**: Check API endpoints above

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Ready to test!** Start with the health endpoint: `GET http://localhost:3000/api/v1/health`