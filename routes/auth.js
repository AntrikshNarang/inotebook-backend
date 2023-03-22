const express = require('express');
const router = express.Router();
const User = require('../models/User')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fetchuser = require('../middleware/fetchuser')
const JWT_SECRET='AsecretString$$$'

//ROUTE 1: Create a User using: POST "/api/auth/createuser". Doesn't require login
router.post('/createuser', [
    body('name', 'Enter a Valid Name').isLength({ min: 3 }),
    body('email', 'Enter a valid E-mail').isEmail(),
    body('password', 'Password must be atleast 5 Characters').isLength({ min: 5 })

], async (req, res) => {
    //If an Error is Found, return bad Request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //Check whether email exists already
    try {
        let success = false;
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({success, error: 'User Exists Already' })
        }
  
        const salt = await bcrypt.genSalt(10)
        secPass = await bcrypt.hash(req.body.password,salt)
        
        //Create a new User
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass
        })
        const data = {
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data,JWT_SECRET);
        success=true;
        res.status(200).json({success,authToken});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
})

//ROUTE 2: Authenticate a User with login credentials using: POST "/api/auth/login". Doesn't require login
router.post('/login', [
    body('email', 'Enter a valid E-mail').isEmail(),
    body('password', 'Password can not be blank').exists()
], async (req, res) => {
    let success = false;
    //If an Error is Found, return bad Request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array() });
    }
    const {email,password} = req.body;
    try{
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({success,error:'Please try to login with correct credentials'})
        }

        const passwordCompare = await bcrypt.compare(password,user.password);
        if(!passwordCompare){
            return res.status(400).json({success,error:'Please try to login with correct credentials'})
        }

        const data = {
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data,JWT_SECRET);
        success = true;
        res.status(200).json({success, authToken});
          
    } catch(error){
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
})

//ROUTE 3: Get loggedin user Details using: POST "/api/auth/getuser". Requires Login
router.post('/getuser',fetchuser ,async (req, res) => {
try{
    userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    res.send(user)

}catch(error){
    console.log(error.message);
    res.status(500).send('Internal Server Error');
}
})

module.exports = router