# Computer Lab Reservation System

A comprehensive web-based booking system for school computer labs with integrated Software Quality Assurance (SQA) practices.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**: Role-based access control (Student, Teacher, Admin)
- **Computer Lab Management**: CRUD operations for managing computer labs and equipment
- **Booking System**: Create, view, modify, and cancel lab reservations
- **Admin Dashboard**: Comprehensive management interface for administrators
- **Real-time Availability**: Check lab availability and prevent double bookings

### Quality Assurance Integration
- **Comprehensive Testing**: Unit, integration, and end-to-end tests
- **Static Code Analysis**: ESLint and TypeScript strict mode
- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
- **Code Coverage**: Minimum 80% test coverage requirement
- **Security**: JWT authentication, input validation, and SQL injection prevention

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling and validation
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Testing & Quality
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Cypress** - End-to-end testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd computer-lab-reservation-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-here"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma db push

# Seed with sample data
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 👥 Demo Accounts

After seeding the database, you can use these demo accounts:

- **Admin**: admin@school.edu / admin123
- **Teacher**: teacher@school.edu / teacher123
- **Student**: student@school.edu / student123

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run End-to-End Tests
```bash
npm run cypress
```

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── register/         # User registration
├── components/            # Reusable React components
│   ├── __tests__/        # Component tests
│   ├── AuthProvider.tsx  # Authentication context
│   └── Navigation.tsx    # Navigation component
├── lib/                   # Utility functions
│   ├── __tests__/        # Utility tests
│   ├── auth.ts           # Authentication utilities
│   └── db.ts             # Database connection
└── styles/               # Global styles

docs/                      # Documentation
├── SQA-Plan.md           # Software Quality Assurance Plan
├── Test-Plan.md          # Comprehensive Test Plan
└── README.md             # This file

prisma/                    # Database schema and migrations
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding script
```

## 📊 Quality Metrics

The project maintains high quality standards with:

- **Test Coverage**: Minimum 80% line coverage
- **TypeScript**: Strict mode enabled
- **ESLint**: Zero errors policy
- **Code Reviews**: All changes reviewed
- **CI/CD**: Automated quality gates

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection
- CORS configuration
- Rate limiting (planned)

## 📈 Performance

- Server-side rendering with Next.js
- Optimized database queries
- Image optimization
- Code splitting
- Lazy loading

## 🤝 Development Workflow

### 1. Feature Development
1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure all tests pass
4. Submit pull request

### 2. Quality Gates
- All tests must pass
- Code coverage ≥ 80%
- ESLint checks pass
- TypeScript compilation succeeds
- Manual testing completed

### 3. Deployment
- Staging deployment on `develop` branch
- Production deployment on `main` branch
- Automated deployment with GitHub Actions

## 📚 SQA Documentation

Comprehensive SQA documentation is available in the `docs/` directory:

- **[SQA Plan](docs/SQA-Plan.md)**: Complete Software Quality Assurance plan
- **[Test Plan](docs/Test-Plan.md)**: Detailed testing strategy and test cases

## 🐛 Bug Reporting

To report bugs or request features:

1. Check existing issues first
2. Create detailed bug report with steps to reproduce
3. Include system information and screenshots
4. Label appropriately (bug, feature, enhancement)

## 📝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes with conventional commit messages
4. Push to the branch
5. Create a pull request

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): add password reset functionality
fix(booking): resolve double booking issue
test(api): add integration tests for lab endpoints
docs(readme): update installation instructions
```

## 📄 License

This project is developed for educational purposes as part of a Software Quality Assurance course.

## 🏆 Project Objectives

This project demonstrates:

1. **Full-stack Web Development**: Modern React/Next.js application
2. **Quality Assurance Integration**: Comprehensive testing and QA practices
3. **Software Engineering Principles**: Clean architecture, SOLID principles
4. **DevOps Practices**: CI/CD, automated testing, deployment
5. **Documentation**: Thorough documentation and code comments

## 🔧 Maintenance

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

### Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

## 📞 Support

For questions or support:
- Create an issue in the repository
- Check the documentation in `docs/`
- Review the test cases for usage examples

---

**Built with ❤️ for Software Quality Assurance practices**
