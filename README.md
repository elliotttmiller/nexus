# Nexus – Financial Intelligence Platform

Nexus is a modern, production-grade financial intelligence platform that empowers users with AI-driven card ranking, interest optimization, and real-time financial insights. The system is composed of a robust Node.js backend, advanced Python AI services, and a cross-platform React Native mobile app.

---

## 🚀 Features (2025)

- **AI-Powered Card Ranking**: Personalized, real-time recommendations based on your spending and account data.
- **Interest Optimization**: Smart payment scheduling and debt management, powered by advanced algorithms.
- **Live Financial Dashboard**: Modern, interactive charts and insights using real Plaid transaction data.
- **Secure Plaid Integration**: Link your real accounts and cards, no mock or fallback logic in production.
- **Mobile-First Experience**: Intuitive onboarding, authentication, and account management on iOS/Android.
- **Production-Ready Security**: JWT authentication, encrypted data, and Sentry error tracking.
- **Developer Friendly**: Modular codebase, clear API structure, and comprehensive test suites.

---

## 🏗️ System Directory Tree & File Explanations

```
nexus/
├── app/                         # Expo/React Native app entry (legacy/testing)
│   └── index.tsx                # (Legacy) Entry point for Expo app
├── assets/                      # Shared static assets (icons, splash, etc)
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
├── mnist_model/                 # ML model assets for AI service
│   ├── fingerprint.pb           # Model fingerprint
│   ├── saved_model.pb           # Saved TensorFlow model
│   └── variables/               # Model weights
│       ├── variables.data-00000-of-00001
│       └── variables.index
├── nexus-ai/                    # Python AI microservice
│   ├── app.py                   # FastAPI app entry point
│   ├── cardrank.py              # Card ranking logic
│   ├── interestkiller.py        # Interest optimization logic
│   ├── nextsmartmove.py         # Smart move recommendations
│   ├── list_models.py           # Model listing utility
│   ├── logger.py                # Logging setup
│   ├── sentry_setup.py          # Sentry integration
│   ├── services.py              # Service layer for AI endpoints
│   ├── test_categorize_anomalies.py # AI test script
│   ├── test_gemini_api.py       # Gemini API test
│   ├── requirements.txt         # Python dependencies
│   ├── uvicorn                  # Uvicorn server binary
│   ├── __init__.py
│   ├── __pycache__/
│   └── tests/                   # AI service tests
│       └── test_app.py
├── nexus-backend/               # Node.js/Express backend API
│   ├── aiService.js             # Connects backend to AI microservice
│   ├── config/                  # Environment and config files
│   │   ├── config.js
│   │   └── config.js.new
│   ├── migrations/              # Sequelize DB migrations
│   │   └── *.js                 # Migration scripts
│   ├── scripts/                 # DB and utility scripts
│   │   └── init-db.js
│   ├── src/
│   │   ├── app.js               # Express app entry
│   │   ├── db.js                # DB connection
│   │   ├── middleware/          # Auth, validation
│   │   │   └── authenticateToken.js
│   │   ├── models/              # Sequelize models
│   │   │   ├── account.js
│   │   │   ├── card.js
│   │   │   ├── payment_history.js
│   │   │   ├── recommendation.js
│   │   │   ├── transaction.js
│   │   │   ├── user.js
│   │   │   └── user_event.js
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── cardrank.js
│   │   │   ├── insights.js
│   │   │   ├── interestkiller.js
│   │   │   ├── plaid.js
│   │   │   ├── test.js
│   │   │   └── users.js
│   │   ├── utils/               # Logger, encryption, sentry
│   │   │   ├── encryption.js
│   │   │   ├── logger.js
│   │   │   └── sentry.js
│   ├── tests/                   # Backend integration tests
│   │   ├── ai_integration_test.py
│   │   └── plaid/               # Plaid test scripts
│   ├── schema.sql               # DB schema
│   ├── package.json             # Backend dependencies
│   └── README.md                # Backend docs
├── nexus-mobile/                # React Native mobile app
│   ├── app/                     # App screens and flows
│   │   ├── (app)/               # Main app screens (dashboard, accounts, etc)
│   │   ├── (auth)/              # Auth screens
│   │   ├── AccountDetailModal.tsx
│   │   ├── card-rank.tsx
│   │   ├── DashboardModal.tsx
│   │   ├── index.tsx
│   │   ├── interest-killer.tsx
│   │   ├── login.tsx
│   │   ├── onboarding.tsx
│   │   ├── profile.tsx
│   │   ├── register.tsx
│   │   ├── twofa.tsx
│   │   └── UnifiedSettingsScreen.tsx
│   ├── assets/                  # App-specific images/icons
│   ├── src/                     # Core logic, types, components
│   │   ├── components/          # Reusable UI components
│   │   ├── constants/           # API endpoints, colors, etc
│   │   ├── context/             # React context (Auth, etc)
│   │   ├── hooks/               # Custom hooks
│   │   ├── navigation/          # Navigation config
│   │   ├── screens/             # (empty, screens in app/)
│   │   └── types.ts             # TypeScript types (Account, Transaction, etc)
│   ├── declarations.d.ts        # TypeScript module declarations
│   ├── package.json             # Mobile dependencies
│   └── tsconfig.json            # TypeScript config
├── scripts/                     # Project-level scripts
│   └── full_test.py             # End-to-end test runner
├── docker-compose.yml           # Multi-service orchestration
├── railway.json                 # Railway deployment config
├── tsconfig.json                # Root TypeScript config
├── README.md                    # (This file)
└── ... (see repo for more)
```

---

## �️ Setup & Development

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- React Native CLI & Expo
- Docker (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/elliotttmiller/nexus.git
   cd nexus
   ```
2. **Backend**
   ```bash
   cd nexus-backend
   npm install && npm start
   ```
3. **AI Service**
   ```bash
   cd ../nexus-ai
   pip install -r requirements.txt
   python app.py
   ```
4. **Mobile App**
   ```bash
   cd ../nexus-mobile
   npm install
   npx expo start
   ```
5. **Docker (optional)**
   ```bash
   docker-compose up -d
   ```

---

## 🔒 Security & Production
- All sensitive data is encrypted and never stored in plaintext
- JWT authentication for all API endpoints
- Sentry error tracking in backend and AI service
- No mock or fallback logic in production – all data is real

**Nexus** – Empowering smarter financial decisions through AI and intelligent automation.