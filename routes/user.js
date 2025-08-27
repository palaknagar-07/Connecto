const { Router } = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const router = Router();

router.get('/signin', (req, res) => {
    return res.render('signin');
});

router.get('/signup', (req, res) => {
    return res.render('signup');
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    try{
        // Input validation
        if (!email || !password) {
            return res.render("signin", {
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({email: email.toLowerCase().trim()});
        if(!user){
            return res.render("signin", {
                error: "Incorrect Email or Password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.render("signin", {
                error: "Incorrect Email or Password"
            });
        }

        // Store user session
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        };

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                return res.render("signin", {
                    error: "Something went wrong. Please try again."
                });
            }
            return res.redirect('/');
        });
    } catch(error){
        return res.render("signin", {
            error: "Something went wrong. Please try again."
        });
    }
});

router.get("/logout", (req,res) => {
    req.session.destroy((err) => {
        res.redirect("/signin");
    });
});

router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    
    try {
        // Input validation
        if (!fullName || !email || !password) {
            return res.render('signup', {
                error: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.render('signup', {
                error: 'Password must be at least 6 characters long'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.render('signup', {
                error: 'Please enter a valid email address'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.render('signup', {
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });
        
        await user.save();

        // Auto login after signup
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        };

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                return res.render('signup', {
                    error: 'Something went wrong. Please try again.'
                });
            }
            return res.redirect('/');
        });
    } catch (error) {
        return res.render('signup', {
            error: 'Something went wrong. Please try again.'
        });
    }
});



module.exports = router;