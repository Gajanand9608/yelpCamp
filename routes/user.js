const express= require('express');
const router = express.Router();
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { storeReturnTo } = require('../middleware');

router.get('/register',  (req, res)=>{
    res.render('users/register');
});

router.post('/register', catchAsync(async(req, res, next)=>{
    try{
        const {email,username,  password} =req.body;
        const user = new User({email, username});
        const registeruser = await  User.register(user, password);
        req.login(registeruser, err=>{
            if(err) return next();
            req.flash('success','Welcome to YelpCamp!');
            res.redirect('/campgrounds');
        });
    }catch(e){
        req.flash('error', e.message);
        res.redirect('register');
    }
}));


router.get('/login', (req, res)=>{
    res.render('users/login');
});

router.post('/login', storeReturnTo, passport.authenticate('local',{failureFlash:true, failureRedirect:'/login'}),  catchAsync(async(req, res)=>{
    req.flash('success', 'Welcome back');
    const redirectedUrl = res.locals.returnTo || '/campgrounds';
    res.redirect(redirectedUrl);
}));

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}); 

module.exports = router;
