
var express = require('express');
var path = require('path');
var fs = require('fs');
var mongoClient = require('mongodb').MongoClient;
var session = require('express-session');
var bcrypt = require('bcryptjs');
const { error } = require('console');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// session setup
app.use(session({
  secret: '8eeaf9ee3494437931d81b8ca39514ab21ffc941ec4fe14e0957430f8e5d434a',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));



app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

const url = "mongodb://localhost:27017";
const dbName = 'myDB';
let db;

async function startServerAndConnectToDB() {
  try {
      const client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true
      });
      db = client.db(dbName);
      console.log('Connected to MongoDB successfully');
      
      // Start server only after DB connection
      app.listen(3000, () => {
          console.log('Server started on http://localhost:3000');
      });
  } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
  }
}


app.post('/register', async (req, res) => {
  const user = req.body.username;
 // check if username already exists
  const existingUser = await db.collection('myCollection').findOne({
      username: user
  });
  if (existingUser) {
      return res.render('registration', { error: 'Username already exists' });
  }
 
 
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  db.collection('myCollection').insertOne({
      username: user,
      password: hashedPassword,
      wantToGo: []
  }, (err) => {
      if (err) res.render('registration', { error: 'Failed to register' });
      else res.redirect('/');
  });
});

app.post('/', async (req, res) => {
  const user = await db.collection('myCollection').findOne({ 
      username: req.body.username 
  });
  
  if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.userId = user._id;
      res.redirect('/home');
  } else {
      res.render('login', { error: 'Invalid username or password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out successfully');
});

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) next();
  else res.status(401).send('Not authenticated');
};

// catch 404 and forward to error handler

// get requests to render pages
app.get('/', function(req, res) {
  res.render('login', { error: null });
});

app.get('/registration', function(req, res) {
  res.render('registration', { error: null });
});

app.get('/home',isAuthenticated ,function(req, res) {
  res.render('home');
});


app.get('/wanttogo',isAuthenticated ,function(req, res) {
  res.render('wanttogo');
});

app.get('/hiking',isAuthenticated ,function(req, res) {
  res.render('hiking');
});

app.get('/inca', isAuthenticated,function(req, res) {
  res.render('inca');
});

app.get('/annapurna', isAuthenticated,function(req, res) {
  res.render('annapurna');
}); 


app.get('/cities', isAuthenticated,function(req, res) {
  res.render('cities');
});

app.get('/paris', isAuthenticated ,function(req, res) {
  res.render('paris');
});

app.get('/rome', isAuthenticated,function(req, res) {
  res.render('rome');
});

app.get('/islands',isAuthenticated ,function(req, res) {
  res.render('islands');
});

app.get('/bali', isAuthenticated,function(req, res) {
  res.render('bali');
});

app.get('/santorini', isAuthenticated,function(req, res) {
  res.render('santorini');
});




app.post('/search', isAuthenticated,function(req, res) {  // this just makes the button clickable
  res.render('searchresults');
});













startServerAndConnectToDB();


