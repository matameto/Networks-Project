
var express = require('express');
var path = require('path');
var mongoClient = require('mongodb').MongoClient;
var session = require('express-session');
var bcrypt = require('bcryptjs');
const {ObjectId} = require('mongodb');

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


// signup function
app.post('/register', async (req, res) => {
  try {
      const user = req.body.username;
      const password = req.body.password;
      
      if (!user || !password) {
          return res.render('registration', { error: 'Username and password are required' ,success: null});
      }

      // check if username already exists
      const existingUser = await db.collection('myCollection').findOne({
          username: user
      });
      
      if (existingUser) {
          return res.render('registration', { error: 'Username already exists' , success: null});
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.collection('myCollection').insertOne({
          username: user,
          password: hashedPassword,
          wantToGo: []
      });

      return res.render('registration', {
        error: null,
        success: 'Registration successful! Redirecting to login...',
        redirect: `
            <script>
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            </script>
        `
    });
      
  } catch (err) {
      console.error('Registration error:', err);
      res.render('registration', { error: 'Failed to register' , success: null});
  }
});

// login function 
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


const isAuthenticated = (req, res, next) => {
  if (req.session.userId) next();
  else res.status(401).send('Not authenticated');
};


// i added this for testing
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy();
    res.send(`
        <div style="text-align: center; margin-top: 50px;">
            Logged out successfully. Redirecting to login...
            <script>
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            </script>
        </div>
    `);
});



// want to go function

app.post('/addToWantToGo', isAuthenticated, async (req, res) => {
  try {
      const destination = req.body.destination;
      
      // Convert string ID to ObjectId
      const userId = new ObjectId(req.session.userId);

      const user = await db.collection('myCollection').findOne({ _id: userId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

      // Check if destination already exists in wantToGo array
      if (user.wantToGo.includes(destination)) {
        return res.status(400).json({
            success: false,
            message: 'Destination already in your Want to Go list'
        });
    }
     
      

      // Now add the destination
      const result = await db.collection('myCollection').updateOne(
          { _id: userId },
          { $addToSet: { wantToGo: destination } }
      );


      if (result.matchedCount === 0) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      res.json({
          success: true,
          message: 'Destination added successfully',
          modifiedCount: result.modifiedCount
      });

  } catch (error) {
      console.error('Error details:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to add destination',
          error: error.message
      });
  }
});
// Add route to get user's Want to Go list


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


// Add this route before your other routes
app.get('/wanttogo', isAuthenticated, async function(req, res) {
  try {
      const userId = new ObjectId(req.session.userId);
      const user = await db.collection('myCollection').findOne({ _id: userId });
      
      if (!user) {
          return res.render('wanttogo', { 
              destinations: [],
              error: 'User not found'
          });
      }

      res.render('wanttogo', { 
          destinations: user.wantToGo,
          error: null
      });
  } catch (error) {
      console.error('Error fetching want-to-go list:', error);
      res.render('wanttogo', { 
          destinations: [],
          error: 'Failed to fetch destinations'
      });
  }
});


app.post('/removeFromWantToGo', isAuthenticated, async (req, res) => {
  try {
      const destination = req.body.destination;
      const userId = new ObjectId(req.session.userId);

      const result = await db.collection('myCollection').updateOne(
          { _id: userId },
          { $pull: { wantToGo: destination } }
      );

      if (result.modifiedCount === 0) {
          return res.status(400).json({
              success: false,
              message: 'Failed to remove destination'
          });
      }

      res.json({
          success: true,
          message: 'Destination removed successfully'
      });

  } catch (error) {
      console.error('Error removing destination:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to remove destination'
      });
  }
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




app.post('/search', isAuthenticated, function(req, res) {
    const searchTerm = req.body.Search.toLowerCase();
    
    // Define all destinations
    const destinations = [
        { name: 'Paris', path: '/paris' },
        { name: 'Rome', path: '/rome' },
        { name: 'Bali Island', path: '/bali' },
        { name: 'Santorini Island', path: '/santorini' },
        { name: 'Inca Trail to Machu Picchu', path: '/inca' },
        { name: 'Annapurna Circuit', path: '/annapurna' }
    ];
    
    // Filter destinations based on search term
    const results = destinations.filter(dest => 
        dest.name.toLowerCase().includes(searchTerm)
    );

    res.render('searchresults', { 
        results: results,
        searchTerm: req.body.Search
    });
});












startServerAndConnectToDB();


