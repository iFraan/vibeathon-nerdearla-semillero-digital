# AGENTS.md
## Semillero Digital - Google Classroom Dashboard

### 🎯 Project Overview
A complementary web application for Google Classroom that helps Semillero Digital (non-profit) track student progress, improve communication, and generate metrics for their digital skills training program for low-income youth.

### 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + ShadCN/UI
- **Authentication**: Better-Auth with Google OAuth
- **Database**: DrizzleORM + PostgreSQL
- **API Integration**: Google Classroom API
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### 👥 User Roles
- **Students**: View personal progress, assignments, notifications
- **Teachers**: Manage classes, track student progress, grade assignments
- **Coordinators**: Multi-class analytics, reports, system administration

### 🎯 Core Problems to Solve
1. **Student Progress Tracking** - Consolidated view of advancement per student/class
2. **Clear Communication** - Prevent missed notifications and important updates
3. **Easy Metrics Access** - Quick administrative data for coordinators

### 🚀 Development Phases

#### Phase 1: Foundation
- [ ] Next.js 15 project setup with TypeScript
- [ ] Install dependencies (DrizzleORM, Better-Auth, ShadCN)
- [ ] Configure Google OAuth with Classroom API scopes
- [ ] Project structure and environment setup

#### Phase 2: Authentication & Database
- [ ] Better-Auth configuration with Google provider
- [ ] Drizzle database schema design
- [ ] User role management system
- [ ] Authentication middleware and route protection

#### Phase 3: Core Dashboard
- [ ] Role-based dashboard layouts
- [ ] Google Classroom API integration services
- [ ] Progress tracking components
- [ ] Notification system
- [ ] Data visualization with Recharts

#### Phase 4: Advanced Features (Optional)
- [ ] Automated notifications (Email/WhatsApp/Telegram)
- [ ] Advanced reporting and analytics
- [ ] Attendance tracking integration
- [ ] Export functionality

### 📋 Key Features Checklist

#### Student Features
- [ ] Personal progress dashboard
- [ ] Assignment timeline view
- [ ] Grade and feedback display
- [ ] Notification center
- [ ] Upcoming deadlines tracker

#### Teacher Features
- [ ] Class roster management
- [ ] Student progress overview
- [ ] Assignment status tracking
- [ ] Quick communication tools
- [ ] Performance analytics per class

#### Coordinator Features
- [ ] Multi-class dashboard
- [ ] Cohort performance metrics
- [ ] Teacher activity overview
- [ ] Data export capabilities
- [ ] System administration panel

### 🔌 API Integrations
- **Google Classroom API**: Course data, assignments, submissions, rosters
- **Google OAuth 2.0**: User authentication and authorization
- **Optional**: Email services, WhatsApp Business API, Telegram Bot API

### 📊 Success Metrics
- **Usability**: Clear interface, easy navigation, mobile responsive
- **Impact**: Reduced missed assignments, improved communication
- **Scalability**: Support for multiple cohorts and growing user base
- **Innovation**: Creative features that add extra value

### 🎨 Design Principles
- Clean, accessible interface for users with varying tech literacy
- Mobile-first responsive design
- Consistent component library (ShadCN/UI)
- Clear visual hierarchy and intuitive navigation
- Fast loading times and smooth interactions

### 🔐 Security & Privacy
- Secure OAuth implementation
- Minimal Google API scopes required
- Data encryption and secure storage
- GDPR compliance considerations
- Regular security audits

### 🌱 Database Seeding
- Use `pnpm run db:seed` to populate with simulated data
- Set `SEED=123456` environment variable for reproducible data
- Generates 300 students, 30 teachers, 2 courses with realistic metrics
- Task status distribution: 55% completed, 25% pending, 15% late, 5% missed
- All metrics calculated according to specification requirements

### 📚 Documentation Needs
- API endpoint documentation
- Component library documentation
- User guides for each role type
- Deployment and maintenance guides
- Development setup instructions