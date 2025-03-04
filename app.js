var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport')

var session = require('express-session')
var fileStore = require('session-file-store')(session)

// var passport = require('passport')
// var authenticate = require('./authenticate')
var config = require('./config')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require('express-flash');

const url = config.mongoUrl

const connect = mongoose.connect(url)

connect.then((db) => {
  console.log('Connected correctly to server')
}, (err) => {console.log(err)})

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser('12345-67890-09876-54321'));  
app.use(session({
  name: 'session-id', 
  secret: '12345-67890-09876-54321', 
  saveUninitialized: false, 
  resave: false, 
  store: new fileStore()
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use('/', indexRouter);
app.use('/users', usersRouter);

function auth(req, res, next){

  if(!req.user){

    var err = new Error('You Are not autenticated!')
    err.status = 403
    return next(err)

  }else{

    next()

  }

}
app.use(auth)

app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
