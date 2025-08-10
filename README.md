# Celm Backend Platform

A robust, scalable Node.js + TypeScript backend for the Celm business registration platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, email verification, password reset
- **Business Management**: Complete CRUD operations for business profiles, services, and locations  
- **Email Service**: Nodemailer integration with professional HTML templates
- **Database**: PostgreSQL with Knex.js ORM and migrations
- **Caching**: Redis for session management and caching
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston with different levels and file rotation
- **Error Handling**: Centralized error handling with custom error classes
- **Validation**: Joi schemas for request validation
- **File Upload**: Multer with image processing capabilities
- **Docker**: Complete containerization setup for development and production
- **Testing**: Jest test framework setup
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (recommended for development)

## 🛠️ Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd celm-backend

# Run the setup script (handles everything)
./setup.sh
```

### Option 2: Manual Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Option A: Using Docker (Recommended)
   docker-compose -f docker-compose.dev.yml up -d postgres redis mailhog
   
   # Option B: Using local installations
   # Ensure PostgreSQL and Redis are running locally
   ```

4. **Database Migration & Seeding**
   ```bash
   npm run migrate:up
   npm run seed:run
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🐳 Docker Development

Start all services with Docker:

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose up -d
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register              - User registration
POST   /api/v1/auth/login                 - User login
POST   /api/v1/auth/logout                - User logout
POST   /api/v1/auth/refresh-token         - Refresh access token
GET    /api/v1/auth/verify-email/:token   - Verify email address
POST   /api/v1/auth/resend-verification   - Resend verification email
POST   /api/v1/auth/forgot-password       - Request password reset
POST   /api/v1/auth/reset-password        - Reset password
POST   /api/v1/auth/change-password       - Change password (authenticated)
GET    /api/v1/auth/profile               - Get user profile
GET    /api/v1/auth/check                 - Check authentication status
```

### Business Endpoints

```
POST   /api/v1/business                   - Create business (authenticated)
GET    /api/v1/business                   - Get all businesses (public)
GET    /api/v1/business/:id               - Get business by ID (public)
PUT    /api/v1/business/:id               - Update business (owner only)
DELETE /api/v1/business/:id               - Delete business (owner only)
GET    /api/v1/business/owner/me          - Get current user's businesses
GET    /api/v1/business/owner/:ownerId    - Get businesses by owner
POST   /api/v1/business/:id/upload-logo   - Upload business logo
POST   /api/v1/business/:id/upload-images - Upload business images
```

### User Management

```
GET    /api/v1/users                      - Get all users (admin only)
GET    /api/v1/users/profile              - Get current user profile
GET    /api/v1/users/:id                  - Get user by ID
PUT    /api/v1/users/profile              - Update current user profile
PUT    /api/v1/users/:id                  - Update user (admin only)
PATCH  /api/v1/users/:id/status           - Update user status (admin only)
PATCH  /api/v1/users/:id/role             - Update user role (admin only)
DELETE /api/v1/users/:id                  - Delete user (admin only)
```

### Health Check

```
GET    /health                            - Application health
GET    /health/db                         - Database health
GET    /health/redis                      - Redis health
GET    /health/all                        - All services health
```

## 🗄️ Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- phoneNumber (String)
- profileImage (String)
- role (Enum: user, admin, super_admin)
- status (Enum: active, inactive, suspended, pending)
- emailVerified (Boolean)
- emailVerificationToken (String)
- passwordResetToken (String) 
- passwordResetExpires (Timestamp)
- lastLogin (Timestamp)
- createdAt, updatedAt (Timestamps)
```

### Businesses Table
```sql
- id (UUID, PK)
- ownerId (UUID, FK -> users.id)
- name (String)
- description (Text)
- type (Enum: services, products, both)
- services (JSON Array)
- categories (JSON Array)
- logo (String)
- images (JSON Array)
- website (String)
- location (JSON Object)
- contact (JSON Object)
- status (Enum: draft, active, inactive, suspended, verified)
- settings (JSON Object)
- metadata (JSON Object)
- createdAt, updatedAt (Timestamps)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Security**: bcrypt hashing with configurable rounds
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Comprehensive security headers
- **Input Validation**: Joi schema validation for all endpoints
- **SQL Injection Prevention**: Parameterized queries via Knex.js
- **XSS Protection**: Input sanitization and output encoding

## 📊 Development Tools

- **Email Testing**: MailHog web interface at http://localhost:8025
- **Database**: PostgreSQL at localhost:5432
- **Redis**: Redis at localhost:6379
- **Logging**: Winston with file rotation and console output
- **Hot Reload**: tsx for development with watch mode

## 🏗️ Project Structure

```
src/
├── config/              # Configuration management
├── controllers/         # Route controllers
├── database/           # DB connection, migrations, seeds
│   ├── migrations/     # Database migrations
│   └── seeds/          # Database seed files
├── middleware/         # Express middleware
├── models/             # Data models with business logic
├── routes/             # Express routes
├── services/           # Business logic services
├── templates/          # Email templates
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `JWT_SECRET` | JWT secret key | required |
| `REDIS_HOST` | Redis host | localhost |
| `SMTP_HOST` | Email SMTP host | localhost (MailHog) |

See `.env.example` for complete list of environment variables.

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Monitoring setup (logs, health checks)
- [ ] Error tracking configured
- [ ] Rate limiting configured for production
- [ ] CORS configured for production domains
- [ ] Email service configured (SMTP/SendGrid)

### Docker Production Deployment

```bash
# Build and start production containers
docker-compose up -d

# Scale the application
docker-compose up -d --scale app=3

# View logs
docker-compose logs -f app
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript best practices and coding standards
4. Ensure all tests pass (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Code Standards

- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📞 Support

For support, email support@celm.com or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License.