
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const jwtPassword =  '123456'
const connectionString = "mongodb+srv://admin:1234567890@cluster0.vczm7zk.mongodb.net/"

mongoose.connect(connectionString)
  .then(() => console.log('Connected mongoose!'));

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
})

const User =  mongoose.model('User',UserSchema)

const accountSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        require: true,
    },
    balance : {
        type: Number,
        required: true
    }

})

const Account = mongoose.model('Account', accountSchema)
module.exports = {
    User,
    Account
}


