const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const globalErrorHandler = require('./controllers/errorController.js');
const cookiesParser = require('cookie-parser');
const userRouter = require('./routers/userRouter.js');
const taskRouter = require('./routers/taskRouter.js');
const projectRouter = require('./routers/projectRouter.js');
const viewsRouter = require('./routers/viewsRouter.js');

// App
const app = express();

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './public/views'));

// MiddleWares
app.use(helmet());

app.use(cookiesParser());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// app.use('/', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Handlers
app.use('/api/v1/users', userRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/', viewsRouter);

app.all('/api/v1/*', (req, res) => {
  res.status(400).json({
    status: 'fail',
    message: 'This route is not defined on this API',
  });
});

// Serving static files
app.use(express.static(path.join(__dirname, '/public')));

app.use(globalErrorHandler);

module.exports = app;
