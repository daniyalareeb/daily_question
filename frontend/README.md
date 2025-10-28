# Daily Questions Frontend

A modern React frontend for the Daily Self-Reflection Tracking Web App.

## 🚀 Features

- **🔐 Firebase Authentication**: Secure user registration and login
- **📝 Daily Questions**: Answer 6 reflection questions each day
- **📊 Analytics Dashboard**: View insights and trends from your responses
- **🎲 Question Randomization**: Optional random order for questions
- **📱 Responsive Design**: Works on desktop and mobile
- **🎨 Modern UI**: Beautiful Material-UI components
- **📈 Data Visualization**: Charts and graphs for your reflection data

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **Material-UI**: Beautiful component library
- **Firebase**: Authentication and user management
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing
- **Recharts**: Data visualization library

## 📦 Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🚀 Quick Start

1. **Start the Backend**:
   ```bash
   cd ../backend
   ./start.sh
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   ./start.sh
   ```

3. **Open your browser**: http://localhost:3000

## 📱 Pages

### 🔐 Authentication
- **Login**: Sign in with email and password
- **Register**: Create a new account

### 📝 Questions Page
- Answer 6 daily reflection questions
- Optional question randomization
- Submit responses (one per day)
- View submission status

### 📊 Dashboard
- View analytics and insights
- Keyword frequency charts
- Trend analysis over time
- Time period filtering (recent, last week, last month)

### 👤 Profile
- View user information
- Response statistics
- Recent submission history
- Account management

## 🔧 Configuration

### Firebase Setup
Update `src/firebase.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### API Configuration
Update `src/services/api.js` if your backend runs on a different port:

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Change if needed
```

## 🎨 Customization

### Theme Colors
Update the theme in `src/App.js`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5', // Change primary color
    },
    secondary: {
      main: '#10B981', // Change secondary color
    },
  },
});
```

### Questions
Questions are fetched from the backend API. To modify questions, update the backend.

## 📊 Data Flow

1. **User Authentication**: Firebase handles user registration/login
2. **Questions**: Fetched from backend API (`/api/questions/`)
3. **Responses**: Submitted to backend API (`/api/responses/`)
4. **Analytics**: Retrieved from backend API (`/api/dashboard/`)

## 🔒 Security

- **Firebase Authentication**: Secure user management
- **JWT Tokens**: Automatic token handling for API requests
- **Protected Routes**: Authentication required for app features
- **Input Validation**: Client-side validation for forms

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
1. Build the app: `npm run build`
2. Deploy the `build` folder
3. Update API URL for production

### Environment Variables
Create `.env` file for production:

```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure backend is running on http://localhost:8000
   - Check CORS settings in backend

2. **Firebase Authentication Error**:
   - Verify Firebase configuration
   - Enable Email/Password authentication in Firebase Console

3. **API Request Failures**:
   - Check if user is authenticated
   - Verify Firebase token is valid

### Debug Mode
Enable debug logging:

```javascript
// In src/services/api.js
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    // ... rest of interceptor
  }
);
```

## 📚 API Integration

The frontend integrates with these backend endpoints:

- `GET /api/questions/` - Fetch questions
- `POST /api/responses/` - Submit responses
- `GET /api/dashboard/analytics` - Get analytics
- `GET /api/auth/verify` - Verify authentication

## 🎯 Next Steps

1. **Enable Firebase Authentication** in Firebase Console
2. **Test the complete flow**: Register → Login → Answer Questions → View Dashboard
3. **Customize the UI** to match your brand
4. **Deploy to production** when ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Reflecting! 🌟**