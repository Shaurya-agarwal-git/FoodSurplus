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

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLAUDE_API_KEY=your_claude_api_key
GOOGLE_PLACES_API_KEY=your_google_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_GOOGLE_PLACES_API_KEY=your_google_api_key
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
