const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Route Imports
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const habitRoutes = require('./modules/habits/habit.routes');
const goalRoutes = require('./modules/goals/goal.routes');
const noteRoutes = require('./modules/notes/note.routes');
const journalRoutes = require('./modules/journal/journal.routes');
const calendarRoutes = require('./modules/calendar/calendar.routes');
const expenseRoutes = require('./modules/expenses/expense.routes');
const pomodoroRoutes = require('./modules/pomodoro/pomodoro.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const searchRoutes = require('./modules/search/search.routes');

const app = express();

// Body parser & Cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security middlewares
app.use(helmet()); 
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(mongoSanitize()); 
app.use(hpp());
app.use('/api', apiLimiter); 

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const API_PREFIX = '/api/v1';

// Swagger documentation route
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/habits`, habitRoutes);
app.use(`${API_PREFIX}/goals`, goalRoutes);
app.use(`${API_PREFIX}/notes`, noteRoutes);
app.use(`${API_PREFIX}/journal`, journalRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/pomodoro`, pomodoroRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Optional features we are adding next
try {
  app.use(`${API_PREFIX}/ai`, aiRoutes);
} catch (e) {
  // Silent catch until AI routes are fully implemented
}

try {
  app.use(`${API_PREFIX}/search`, searchRoutes);
} catch (e) {
  // Silent catch until search routes are fully implemented
}

const syncRoutes = require('./modules/sync/sync.routes');
app.use(`${API_PREFIX}/sync`, syncRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'LifeOS API is running' });
});

// Handle unhandled routes
app.use((req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
