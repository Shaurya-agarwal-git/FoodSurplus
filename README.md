# Food Surplus - Real-Time Food Redistribution Platform

A full-stack web application connecting food donors with receivers to reduce food waste and address food insecurity in India.

## Features

- 🤖 AI-powered food detection using Claude API
- 🗺️ Real-time geolocation mapping with Mapbox
- ⚡ Live notifications via Socket.io
- 👥 Three user roles: Donor, Receiver, Admin
- 💬 Real-time chat for pickup coordination
- 📊 Impact tracking (meals saved, CO₂ avoided)
- 📱 Responsive dark-themed UI

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark theme)
- Socket.io Client
- Mapbox GL JS
- React Router
- Axios

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- Socket.io
- JWT Authentication
- Node-cron

### Third-Party Services
- Claude API (Anthropic) - AI food analysis
- Google Places API - Address autocomplete
- Cloudinary - Image storage
- Nodemailer - Email notifications
- Twilio - SMS notifications

## Project Structure

```
food-surplus/
├── backend/
│   ├── config/          # Database and service configs
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── server.js        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── services/    # API services
│   │   ├── utils/       # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── .kiro/specs/food-surplus/  # Project specifications
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- API keys for: Claude, Google Places, Mapbox, Cloudinary, Twilio

### Installation

1. **Clone the repository**
```bash
cd Surplus
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys and MongoDB URI
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

e_api_key
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Listings
- `POST /api/listings` - Create listing
- `GET /api/listings` - Get listings (with geospatial query)
- `POST /api/listings/:id/claim` - Claim listing
- `POST /api/listings/analyze-image` - AI food analysis

### Admin
- `GET /api/analytics/impact` - Get impact statistics
- `GET /api/users/ngos` - Get NGO verification queue

## Development Roadmap

See `.kiro/specs/food-surplus/tasks.md` for detailed implementation tasks.

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
