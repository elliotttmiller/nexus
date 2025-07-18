# Nexus - Financial Intelligence Platform

Nexus is a comprehensive financial intelligence platform that combines AI-powered card ranking, interest optimization, and financial management tools.

## 🏗️ Architecture

The Nexus platform consists of three main components:

### 1. **Nexus Backend** (`nexus-backend/`)
- **Technology**: Node.js with Express.js
- **Database**: SQLite with comprehensive schema
- **Features**:
  - User authentication and authorization
  - Plaid integration for financial data
  - Card ranking algorithms
  - Interest optimization calculations
  - Transaction management
  - User event tracking

### 2. **Nexus AI** (`nexus-ai/`)
- **Technology**: Python
- **Features**:
  - AI-powered card ranking (`cardrank.py`)
  - Interest optimization algorithms (`interestkiller.py`)
  - Smart move recommendations (`nextsmartmove.py`)
  - Sentry integration for error tracking
  - Comprehensive logging system

### 3. **Nexus Mobile** (`nexus-mobile/`)
- **Technology**: React Native
- **Features**:
  - Cross-platform mobile application
  - User onboarding and authentication
  - Dashboard with financial insights
  - Card ranking interface
  - Interest optimization tools
  - Account and transaction management
  - Settings and profile management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- React Native development environment
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/elliotttmiller/nexus.git
   cd nexus
   ```

2. **Backend Setup**
   ```bash
   cd nexus-backend
   npm install
   npm start
   ```

3. **AI Service Setup**
   ```bash
   cd nexus-ai
   pip install -r requirements.txt
   python app.py
   ```

4. **Mobile App Setup**
   ```bash
   cd nexus-mobile
   npm install
   npx react-native run-android  # or run-ios
   ```

### Docker Deployment
```bash
docker-compose up -d
```

## 📁 Project Structure

```
nexus/
├── nexus-backend/          # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Authentication & validation
│   │   └── utils/          # Utility functions
│   └── schema.sql          # Database schema
├── nexus-ai/               # Python AI services
│   ├── cardrank.py         # Card ranking algorithms
│   ├── interestkiller.py   # Interest optimization
│   ├── nextsmartmove.py    # Smart recommendations
│   └── app.py              # AI service entry point
├── nexus-mobile/           # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   └── navigation/     # Navigation configuration
│   └── App.js              # App entry point
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker configuration
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each component directory:

**Backend** (`nexus-backend/.env`):
```
PORT=3000
JWT_SECRET=your_jwt_secret
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
```

**AI Service** (`nexus-ai/.env`):
```
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=INFO
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
python scripts/full_test.py
```

## 📊 Features

### Card Ranking
- AI-powered analysis of credit card benefits
- Personalized recommendations based on spending patterns
- Real-time ranking updates

### Interest Optimization
- Smart debt management strategies
- Interest rate optimization algorithms
- Payment scheduling recommendations

### Financial Management
- Secure Plaid integration for account linking
- Transaction categorization and analysis
- Spending pattern insights

### Mobile Experience
- Intuitive user interface
- Real-time financial data
- Push notifications for important events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔒 Security

- All sensitive data is encrypted
- JWT-based authentication
- Secure API endpoints
- Regular security audits

---

**Nexus** - Empowering smarter financial decisions through AI and intelligent automation. 