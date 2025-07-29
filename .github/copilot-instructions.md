# Copilot Instructions for Computer Lab Reservation System

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Computer Lab Reservation System for schools built with Next.js, TypeScript, and integrated Software Quality Assurance practices.

## Key Architecture Guidelines
- Use Next.js App Router with TypeScript
- Follow component-based architecture
- Implement proper error handling and validation
- Use Tailwind CSS for styling
- Follow accessibility best practices (WCAG guidelines)
- Implement proper SEO optimization

## Code Quality Standards
- Use TypeScript strict mode
- Follow ESLint configuration
- Write comprehensive unit tests with Jest and React Testing Library
- Maintain minimum 80% code coverage
- Use semantic commit messages
- Implement proper error boundaries
- Follow React best practices and hooks rules

## Database and API Design
- Use SQLite for development, PostgreSQL for production
- Implement proper database migrations
- Use Prisma ORM for type-safe database operations
- Follow REST API conventions
- Implement proper authentication and authorization
- Use validation middleware for all API endpoints

## Testing Strategy
- Write unit tests for all components and utilities
- Implement integration tests for API routes
- Create end-to-end tests for critical user flows
- Use React Testing Library for component testing
- Mock external dependencies appropriately
- Test error scenarios and edge cases

## Security Considerations
- Implement proper authentication (JWT tokens)
- Use HTTPS in production
- Sanitize all user inputs
- Implement rate limiting
- Follow OWASP security guidelines
- Use environment variables for sensitive data

## Features to Implement
1. User Authentication (Login/Register/Logout)
2. Computer Lab Management (CRUD operations)
3. Booking System (Create/View/Cancel reservations)
4. Admin Dashboard (User management, lab monitoring)
5. Reporting System (Usage analytics, export data)
6. Email Notifications (Booking confirmations, reminders)

## SQA Integration
- Configure GitHub Actions for CI/CD
- Set up automated testing pipeline
- Implement code quality gates
- Use SonarQube for static code analysis
- Generate test coverage reports
- Maintain comprehensive documentation
