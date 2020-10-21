var mongoose = require('mongoose')
const passport = require('passport')
var Schema = mongoose.Schema
var passportLocalMongoose = require('passport-local-mongoose')

var User = new Schema ({
    email: {
        type: String, 
        required: true,
    }, 
    goldenCoins: {
        type: Number, 
        required: true, 
        default: 0
    }, 
    KhausCoins: {
        type: Number, 
        required: true, 
        default: 0
    }
})

User.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', User)