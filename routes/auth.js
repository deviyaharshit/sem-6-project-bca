const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'JaiShreeKrishna';

// Route 1 : Create a user using : POST "/api/auth/createuser".  No Login required

router.post('/createuser', [
  body('name', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {

  let success = false;
  // if there are errors return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  // Check weather the user with this email exists already
  try {
    console.log(req.body.name,req.body.email,req.body.password)
    //let user = await User.findOne({ email: req.body.email });
    
    // if (user) {
    //   return res.status(400).json({ success ,error: "Sorry a user with this email already exists" })
    // }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    // create a new user
   let user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass
    })

    const data = {
      user: {
        id: user.id
      }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    success = true;
    res.json({ success,authToken });

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }

})

// Route 2 : Authenticate a user using : POST "api/auth/login". No login required

router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists(),
], async (req, res) => {

  let success = false;
  // if there are errors return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success,error: "Please try to login with correct credentials" });
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({ success,error: "Please try to login with correct credentials" });
    }

    const data = {
      user: {
        id: user.id
      }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    success = true;
    res.json({ success , authToken });

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }

})

// Route 3 : Get loggedin user details using : POST "api/auth/getuser". login required

router.post('/getuser', fetchuser , async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})

// Route 4 : Fetch All Users using : GET "/api/auth/fetchalluser".  No login required

router.get('/fetchalluser', async (req, res) => {
    const users = await User.find();
    res.json(users);
  })
  
// Route 5 : Delete an existing User using : DELETE "api/auth/deleteuser". No Login Required

router.delete('/deleteuser/:id', async (req, res) => {

  try {

      // Find the comment to be deleted and delete it
      let user = await User.findById(req.params.id);
      if (!user) {
          return res.status(404).send("Not Found");
      }

      user = await User.findByIdAndDelete(req.params.id);

      res.json({ Success: "User has been Deleted" });
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
})

module.exports = router