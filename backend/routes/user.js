const express = require('express')
const { User,Account } = require('../db')
const jwt = require("jsonwebtoken")
const zod = require('zod')
const { authMiddleware } = require('../middlleware')
// const JWT_SECRET = require('../config')

const JWT_SECRET = require('../config')
const userRouter = express.Router()

async function userExists(username){
    const response = await User.findOne({'username' : username})
    if(response == null){
        return false
    }
    else{
        return true
    }
}


async function validateUser(username,password){
    const responseUser = await User.findOne({username : username})
    console.log(responseUser)
    if(responseUser){
        const pwd = responseUser.password

        if(pwd == password){
            return {
                'user': responseUser,
                'username' : true,
                'password' : true,

            }
        }

        else{
            return {
                'user': null,
                'username' : true,
                'password' : false,

            }
        }
    }

    else{
        return {
            'user': null,
            'username' : false,
            'password' : false,

        }
    }
   
}
// router.use(express.json())
const UserZodSchema = zod.object({
    username : zod.string(),
    firstName : zod.string(),
    lastName : zod.string(),
    password : zod.string(),
})

userRouter.post('/signup',async (req,res) => {
    const username =  req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;

    const userJSON = {username : username , firstName : firstName, lastName: lastName, password: password}
    const zodRes  = UserZodSchema.safeParse(userJSON)
    
    if(!zodRes.success){
        res.status(403).json({
            'msg' : 'invalid-data'
        })
    }
    // console.log(zodRes)
    // console.log(userExists(username))
    const userExistsResponse =  await userExists(username)
    
    if(!userExistsResponse){
        const newUser = new User(userJSON)
        await newUser.save()

        const userId = newUser._id
        await Account.create({
            userId: userId,
            balance : 1000
        })
        console.log("user created!!")
        console.log(JWT_SECRET)
        const token = jwt.sign({'userId': userId} ,JWT_SECRET)
        return res.json({
            'token' : token,
        })
    }

    else{
        res.status(403).json({
            'msg' : 'user already exists'
        })
    }
    
})


userRouter.post('/signin', async (req,res) => {
    const username =  req.body.username;
    const password = req.body.password;
    const validateUserResponse = await validateUser(username,password)
    console.log(validateUserResponse)

    if(validateUserResponse.username == false) {
        return res.status(403).json({
            'msg' : "incorrect username",   
        })
    }
    else if(validateUserResponse.password == false) {
        return res.status(403).json({
            'msg' : "incorrect password"
        })
    }

    else if(validateUserResponse){
        const user = validateUserResponse.user
        const token = jwt.sign({'userId': user._id} ,JWT_SECRET)
        return res.json({
            'token' : token,
        })
    }
})

userRouter.get('/users',authMiddleware,async (req,res) => {
    const filter = req.body.filter
    console.log(filter)
    console.log("In get users")
    const users = await User.find({ $or:
        [
            { firstName: { $regex : '.*' + filter + '.*' }},
            { lastName: { $regex : '.*' + filter + '.*' }}
        ]})

    console.log("Users found: ", users)
    
    return res.json({'users' : users})
    

    
})

const UpdateUserZodSchema = zod.object({
    firstName : zod.string().optional(),
    lastName : zod.string().optional(),
    username : zod.string().optional(),
})

userRouter.patch('/update_user',authMiddleware, async (req,res) => {
    const body = req.body
    const zodRes = UpdateUserZodSchema.safeParse(body)
    if(!zodRes.success){
        return res.status(403).json({
            'msg' : 'invalid request schema'
        })
    }

    const response = await User.findOneAndUpdate({_id: req.userId},body)
    console.log(response)
    res.status(200).json({
        'msg' : 'user updated!!',
    })
})


module.exports = userRouter