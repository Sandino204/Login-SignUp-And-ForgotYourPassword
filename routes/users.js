var express = require('express');
const bodyParser = require('body-parser')
var User = require('../models/user')
var passport = require('passport')
var authenticate = require('../authenticate')
var session = require('express-session')
var async = require('async')

var crypto = require('crypto')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey('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')

var router = express.Router();

var router = express.Router()
router.use(bodyParser.json())
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', function(req, res, next){
  User.register(new User({username: req.body.username, email: req.body.email}), 
    req.body.password, (err, user) =>{
    if(err){
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.json({err: err})
    }else{
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.json({success: true, status: 'Registration Successful!'})
      })
    }  
  })
})

router.post('/login', passport.authenticate('local'),(req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.json({success: true, status: 'You are successfully logged in'})
})

router.get('/logout', (req, res, next) => {
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id')
    res.redirect('/')
  }

  var err = new Error('You are not logged in!')
  err.status = 403
  next(err)
  
})

router.post('/forgot', function(req, res, next){
  async.waterfall([
    function(done){
      crypto.randomBytes(20, function(err, buf){
        const token = buf.toString('hex')
        done(err, token)
      })
    }, 
    function(token, done){
      User.findOne({ email: req.body.email}, function(err, user){
        if(!user){
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.json({err: 'Email Not Found'})

          return 
        }

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000 

        user.save(function(err){
          done(err, token, user)
        })
      })
    }, 
    function(token, user, done){
      const msg = {
        to: user.email, 
        from: 'khauscorpgames@gmail.com',
        subject: 'Password Reset from ManaWars', 
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + 'localhost/3001' + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      }

      sgMail.send(msg)
      .then(() => {
        res.statusCode = 200, 
        res.setHeader('Content-Type', 'application/json')
        res.json({success: true, status: 'An Email is send to your email to change your Password'})
      })
      .catch((error) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.json({err: error})
      })
    }
  ], 
   function(err){
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.json({err: error})
   })
})

router.put('/reset/:token', function(req, res){
  
  async.waterfall([
    function(done){
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
      function(err, user){
      if(!user){
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.json({err: error})
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      user.save(function(err){
        done(err, user)
      }) 
    })
    }, 
    function(user, done){
      const msg = {
        to: user.email, 
        from: 'khauscorpgames@gmail.com',
        subject: 'Password Reset from ManaWars', 
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      }

      sgMail.send(msg)
      .then(() => {
        res.statusCode = 200, 
        res.setHeader('Content-Type', 'application/json')
        res.json({success: true, status: 'Your password is changed'})
      })
      .catch((error) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.json({err: error})
      })

    }
  ], function(err){
    res.json({err: err})
  })
})


module.exports = router;