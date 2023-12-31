if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}


const express=require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');


const campgroundRoutes = require('./routes/campground');
const reviewRoutes = require('./routes/review');
const userRoutes  = require('./routes/user');



var dbburl = process.env.dbURL;

mongoose.connect(dbburl,{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open",()=>{
    console.log("Database connected");
});

const app = express();


app.engine('ejs', ejsMate);
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret';


app.use(session({
    secret: secret,
    saveUninitialized: false, // don't create session until something stored
    resave: false, //don't save session if unmodified
    store: MongoStore.create({
      mongoUrl: dbburl,
      touchAfter: 24 * 3600 // time period in seconds
    }),
    cookie:{
        httpOnly:true,
        secure:true,
        expires:Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000
    }
  }));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
});

app.use('/', userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);


app.get('/', (req, res)=>{
    res.render('home');
});


app.all('*', (req, res, next)=>{
    next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next)=>{
    const {statusCode=500} = err;
    if(!err.message){
        err.message = 'Oh No, Something went wrong!';
    }
    res.status(statusCode).render('error', {err});
});


app.listen(3000, ()=>{
    console.log('serving on part 3000');
});

