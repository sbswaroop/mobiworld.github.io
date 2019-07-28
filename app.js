const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-Parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const passport = require('passport');


//Authantication Part
////const mongoose=require('mongoose');
const bcrypt = require('bcryptjs');



//load Customer Model
require('./models/Customers');
const customer = mongoose.model('Customer');


require('./models/User');
const user = mongoose.model('users');


//load Ordertodeliver

require('./models/Ordertodeliver');
const Ordertodeliver = mongoose.model('Ordertodeliver');


//load the idea models
require('./models/Idea');
const Idea = mongoose.model('ideas');




//Load Routes
const ideas = require('./routes/ideas');
const users = require('./routes/users');


//passport configuration seller
//require('./config/passport')(passport);

//passport configuration for customer 1
require('./config1/passport1')(passport);






//map globale promiser tpo get rid of the mongoDB
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://127.0.0.1:27017/mobile',{useNewUrlParser:true}).then(() => console.log("mongoDB Connected"));
//.catch(err => console.log(err));


//handlebars middlewares
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));

//BodyParser MiddleWare
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//Static Folder
app.use(express.static(path.join(__dirname, 'public')))
  ;


//method override middleware
app.use(methodOverride('_method'));

app.set('view engine', 'handlebars');

//express session middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());


app.use(flash());


//global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.errors = req.flash('error');
  res.locals.user = req.user || null;
  //res.locals.customer=req.customer||null;
  next();
});


//index route
app.get('/', (req, res) => {
  res.render('index');
});


//About page route
app.get('/about', (req, res) => {
  res.render('about');
});

//Customer Register Route
app.get('/customers/register', (req, res) => {
  res.render('customers/register');
});

//Customer Register Form
app.post('/customer/register', (req, res) => {
  let errors = [];
  if (req.body.password.length < 4) {
    errors.push({ text: 'password do nat Match' });
  }

  if (req.body.password.length < 8) {
    errors.push({ text: 'Password is Too Short Enter Atleast 8 Digit Password' });
  }

  if (errors.length > 0) {
    res.render('users/register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      add:req.body.add,
      password: req.body.password,
      password2: req.body.password2
    });
  } else {
    const newCustomer = new customer({
      name: req.body.name,
      email: req.body.email,
      add:req.body.add,
      password: req.body.password
    });
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newCustomer.password, salt, (err, hash) => {
        if (err) throw err;
        newCustomer.password = hash;
        newCustomer.save()
          .then(customer => {
            req.flash('success_msg', 'Customer is Registered...!!! Now You Can Login');
            res.redirect('/customers/login');
          })
          .catch(err => {
            console.log(err);
            return;
          });
      });
    });
  }
});





//Customer Login Route
app.get('/customers/login', (req, res) => {
  res.render('customers/login');
});

//Customers login from Post
app.post('/customers/login', (req, res, next) => {

  console.log(req.body);

  passport.authenticate('local', {
    successRedirect: '/mobiles',
    failureRedirect: '/customers/login',
    failureFlash: true
  })(req, res, next);
});

//logout for Customer
app.get('/customers/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You Are Logged Out');
  res.redirect('/customers/login');
});



//fetching Mobiles For User
app.get('/mobiles', (req, res) => {
  console.log(req);

  Idea.find()
    .sort({ date: 'desc' })
    .then(ideas => {
      res.render('customers/mobiles', {
        ideas: ideas
      });
    });
});



//Order now route main logic
app.get('/customers/Order', (req, res) => {

  console.log('===>  ', req.query);

  const _id = req.query.ideaId;
  Idea.findOne({ _id }).then(idea => {
    console.log(idea);

    new Ordertodeliver({
      customerid: req.user._id,
      address:req.user.add,
      cname:req.user.name,
      title:req.user.title,
      ideasid: idea._id,
      usersid: idea.user,

      _id: new mongoose.Types.ObjectId()
    }).save()
      .then(doc => console.log('saved ... ', doc))
      .catch(err => console.log('err ...', err));
  }).catch(err => console.log('err idea get ...', err));

  console.log('--> ', req.user);



  res.render('customers/Order');
});



//use routes
app.use('/ideas', ideas);
app.use('/users', users);


const port = process.env.PORT||5000;

app.listen(port, () => {
  console.log('Server Started');
});