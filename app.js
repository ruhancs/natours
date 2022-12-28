const path = require('path');
const express = require('express');
const morgan = require('morgan');
//para limitar o numero de acessos de um ip e evitar ataques de brute force
const rateLimit = require('express-rate-limit');
// para proteger os header da pagina
const helmet = require('helmet');
// para proteger contra SQL injection
const mongoSanitize = require('express-mongo-sanitize');
// para proteger contra XSS ataque
const xss = require('xss-clean');
// para previnir parameter poluiçao
const hpp = require('hpp')
// para pegar os cookies da pagina
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// informar o renderizador de template
app.set('view engine', 'pug');
// informar a pasta que se encontra as templates
app.set('views', path.join(__dirname, 'views'))

// Statics files
app.use(express.static(path.join(__dirname, 'public')))

// 1) MIDDLEWARES
// proteger os headers utilizar sempre no inicio da aplicaçao
app.use(helmet())

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// define 100 requisiçoes por hora para cada ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in 1 hour'
})
app.use('/api',limiter)// limita os acessos de todas url marcadas com /api

// ler dados do body into req.body
app.use(express.json({ limit: '10kb' }));//limitar dados de post no body para 10kb

// ler dados do formulario com metodo post
app.use(express.urlencoded({ extended:true, limit:'10kb' }))

// pegar os cookies da pagina
app.use(cookieParser())

// limpar os dados recebidos para evitar codigos malignos
// Data sanatization contra NoSQL injection
app.use(mongoSanitize());

// Data sanatization contra cros strip ataque (XSS)
app.use(xss())

// previnir parameter poluition
app.use(hpp({
  whitelist: [//parametros que podem ser repetidos nos parametros
    'duration',
    'ratingsAverage',
    'ratingsQuantity',
    'price',
    'createdAt',
    'startDates',
    'maxGroupSize',
    'difficulty'
  ]
}))

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies)
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
