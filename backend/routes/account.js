const express = require('express')
const acoountRouter = express.Router()
const { authMiddleware } = require('../middlleware');
const { Account,User } = require('../db');
const { default: mongoose } = require('mongoose');

acoountRouter.get('/balance',authMiddleware,async (req,res) => {
    const userId = req.userId;
    try{
        const response = await Account.findOne({userId : userId})        
        return res.json({
            'balance' : response.balance
        })
    }
    catch(err){
        
        console.log("error in find call")
    }
    
})

acoountRouter.post('/transfer',authMiddleware, async (req,res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    const { amount , to } = req.body
    const account = await Account.findOne({ userId: req.userId}).session(session)
    
    if(!account || account.balance < amount){
        await session.abortTransaction()
        res.status(400).json({
            'msg' : "insufficient balance",
        })
    }
    // const toUser = await User.findOne({username : to }).session(session)
    const toAccount = await Account.findOne({userId : to}).session(session)
    
    if(!toAccount){
        await session.abortTransaction()
        res.status(400).json({
            'msg' : "invalid user",
        })
    }

    await Account.updateOne({userId: req.userId}, {$inc : { balance : -amount}}).session(session);
    await Account.updateOne({userId: to}, {$inc : { balance : amount}}).session(session);

    await session.commitTransaction();
    res.json({
        message : 'Tranfer Sucessful',
    })
})

module.exports =  acoountRouter