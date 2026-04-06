# 🌿 EcoSpark Hub Backend

### REST API for Sustainability Community Platform

This is the backend server for the EcoSpark Hub platform — a sustainability community platform with idea sharing, voting, comments, payments, and role-based access control.

Built with **Node.js, Express, TypeScript, Prisma, PostgreSQL, and Stripe**.

## 👨‍💻 Author

**Md. Nazmul Hossen**

## 🚀 Live Links

[![Live Frontend](https://img.shields.io/badge/Live_Frontend-SkillBridge-blue?style=for-the-badge&logo=vercel)](https://ecospark-hub.vercel.app/)

[![Live Backend API](https://img.shields.io/badge/Live_API-SkillBridge_Server-blueviolet?style=for-the-badge&logo=vercel)](https://ecosoark-hub.vercel.app/)

[![Frontend Repo](https://img.shields.io/badge/Frontend_Repo-GitHub-000?style=for-the-badge&logo=github)](https://github.com/nazmulxdev/EcoSpark-Hub-Frontend-)

[![Backend Repo](https://img.shields.io/badge/Backend_Repo-GitHub-333?style=for-the-badge&logo=github)](https://github.com/nazmulxdev/EcoSpark-Hub)

---

## 📌 Project Overview

EcoSpark Hub Backend provides a complete REST API for:

- 👥 **User authentication & role-based access** (USER, MEMBER, ADMIN)
- 💡 **Idea management** (CRUD, approval workflow, access control)
- 💬 **Comment system** (nested replies)
- 👍 **Voting system** (upvote/downvote)
- 🔖 **Watchlist functionality**
- 📝 **Blog management**
- 💳 **Payment integration** (Stripe)
- 📊 **Dashboard analytics**

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Stripe** (Payments)
- **Cloudinary** (Image upload)
- **Zod** (Validation)
- **Better Auth**

## 📂 Project Structure

```text
src/
 ├── modules/
 │   ├── auth/          # Authentication
 │   ├── user/          # User management
 │   ├── idea/          # Ideas CRUD
 │   ├── vote/          # Voting system
 │   ├── comment/       # Comments & replies
 │   ├── watchlist/     # Save ideas
 │   ├── category/      # Categories
 │   ├── blog/          # Blog posts
 │   ├── admin/         # Admin features
 │   ├── member/        # Member features
 │   └── ideaPurchase/  # Stripe integration
 ├── middleware/        # Auth & validation
 ├── utils/             # Helpers
 ├── config/            # Configuration
 ├── shared/           # Shared utilities
 └── lib/              # Prisma client
```

## 🔐 Authentication & Authorization

- **Better Auth** for authentication
- **Role-based access control**:
  - `USER` - Basic access
  - `MEMBER` - Premium features
  - `ADMIN` - Full control

## 💰 Payment System

- Stripe integration
- Idea purchase (one-time)
- Membership subscription
- Pay Later option
- Webhook handling
- Payment status tracking (`UNPAID` → `PENDING` → `PAID`)

## 📡 API Endpoints

### 🔐 Auth Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/session` | Get session |
| POST | `/api/auth/logout` | User logout |

### 💡 Idea Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/ideas/public` | Get all approved ideas |
| GET | `/api/v1/ideas/:slug` | Get idea by slug |
| GET | `/api/v1/ideas/:slug/purchase-status` | Check purchase status |
| POST | `/api/v1/ideas` | Create idea (Member) |
| PATCH | `/api/v1/ideas/:slug` | Update idea (Member) |
| DELETE | `/api/v1/ideas/:slug` | Delete idea (Member) |
| PATCH | `/api/v1/ideas/:slug/submit` | Submit for review (Member) |
| GET | `/api/v1/ideas/my-ideas` | Get my ideas (Member) |
| GET | `/api/v1/ideas/my-draft-ideas` | Get draft ideas (Member) |
| GET | `/api/v1/ideas/my-purchased-ideas` | Get purchased ideas |
| GET | `/api/v1/ideas` | Get all ideas (Admin) |

### 👍 Vote Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/v1/votes` | Cast vote |
| GET | `/api/v1/votes/status/:ideaId` | Get vote status |

### 💬 Comment Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/v1/comments` | Create comment |
| GET | `/api/v1/comments/:ideaId` | Get comments |
| PATCH | `/api/v1/comments/:commentId` | Update comment |
| DELETE | `/api/v1/comments/:commentId` | Delete comment |

### 🔖 Watchlist Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/v1/watchlist/add` | Add to watchlist |
| DELETE | `/api/v1/watchlist/remove/:ideaId` | Remove from watchlist |
| GET | `/api/v1/watchlist` | Get my watchlist |
| GET | `/api/v1/watchlist/check/:ideaId` | Check if in watchlist |

### 💳 Payment Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/v1/idea-purchase/purchase/:ideaId` | Direct purchase |
| POST | `/api/v1/idea-purchase/purchase-with-pay-later/:ideaId` | Pay later |
| POST | `/api/v1/idea-purchase/initiate-payment/:ideaId` | Resume payment |
| POST | `/api/v1/webhook/stripe` | Stripe webhook |

### 📝 Blog Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/blog` | Get all blogs |
| GET | `/api/v1/blog/:slug` | Get blog by slug |
| POST | `/api/v1/blog` | Create blog (Admin) |
| PATCH | `/api/v1/blog/:slug` | Update blog (Admin) |
| DELETE | `/api/v1/blog/:slug` | Delete blog (Admin) |

### 🏷️ Category Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/category` | Get categories |
| POST | `/api/v1/category/create` | Create category (Admin) |
| PATCH | `/api/v1/category/:slug` | Update category (Admin) |
| DELETE | `/api/v1/category/:slug` | Delete category (Admin) |

### 👥 Member Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/member/dashboard` | Member dashboard data |
| POST | `/api/v1/member/apply` | Apply for membership |

### 🛡️ Admin Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/v1/admin/dashboard` | Admin dashboard data |
| GET | `/api/v1/admin/users` | Get all users |
| PATCH | `/api/v1/admin/users/:userId/role` | Update user role |
| GET | `/api/v1/admin/membership-requests` | Get membership requests |
| PATCH | `/api/v1/admin/membership-requests/:requestId` | Approve/reject request |

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecospark"

# Auth
BETTER_AUTH_SECRET=your_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🗄️ Database Schema

### Core Models

| Model | Description |
| :--- | :--- |
| **User** | User accounts & roles (USER, MEMBER, ADMIN) |
| **Idea** | Sustainability ideas with status (DRAFT, UNDER_REVIEW, APPROVED, REJECTED) |
| **Category** | Idea categories |
| **Vote** | User votes on ideas (UPVOTE/DOWNVOTE) |
| **Comment** | Comments & nested replies |
| **Watchlist** | Saved ideas by users |
| **Blog** | Blog posts with cover images |
| **IdeaPayment** | Payment records for ideas |
| **IdeaPurchase** | Purchased ideas record |
| **MembershipPayment** | Membership payment records |
| **Member** | Member-specific data |

## 📊 Idea Status Flow

```text
DRAFT → UNDER_REVIEW → APPROVED
                    ↘ REJECTED
```

## 💳 Payment Flow

1. User clicks "Purchase"
2. Create Payment Record (`UNPAID`)
3. Create Stripe Session (`PENDING`)
4. User pays on Stripe
5. Webhook updates status (`PAID`)
6. User gets access

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone <your-repository-url>
cd ecospark-hub-backend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create `.env` file (see above).

### 4️⃣ Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 5️⃣ Run Development Server

```bash
npm run dev
```

Server will run at: `http://localhost:5000`

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
npm run test
```

## 📦 API Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

## 🔄 Webhook Endpoints

| Endpoint | Description |
| :--- | :--- |
| POST `/api/v1/webhook/stripe` | Stripe payment webhook |

## 📊 Features Summary

| Feature | Status |
| :--- | :--- |
| Authentication | ✅ |
| Role-based Access | ✅ |
| Idea CRUD | ✅ |
| Idea Approval Workflow | ✅ |
| Voting System | ✅ |
| Comments (Nested) | ✅ |
| Watchlist | ✅ |
| Blog Management | ✅ |
| Category Management | ✅ |
| Stripe Payments | ✅ |
| Pay Later Option | ✅ |
| Admin Dashboard API | ✅ |
| Member Dashboard API | ✅ |
| Image Upload (Cloudinary) | ✅ |
| Pagination & Filtering | ✅ |
| Search Functionality | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **ISC License**.

---

### 🙏 Acknowledgements

- **Stripe** for payment processing
- **Cloudinary** for image hosting
- **Better Auth** for authentication
- **Prisma** for ORM
**Made with ❤️ for a sustainable future 🌱**
