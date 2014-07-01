var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

var store = new express.session.MemoryStore;

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({secret: 'test', store: store}));
});

var auth = function(req){
  return !req.session.username ? undefined : req.session.username;
};

app.get('/', function(req, res) {
  if(auth(req)){
    res.render('index');
  } else {
    res.render('login');
  }
});

app.get('/create', function(req, res) {
  if(auth(req)){
    res.render('index');
  } else {
    res.render('login');
  }
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/signup', function(req, res){
  res.render('signup');
});

app.get('/logout', function(req, res){
  req.session.destroy();
  res.render('login');
});


app.get('/links', function(req, res) {
  if(auth(req)){
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.send(404, 'unauthorized!');
  }
});

app.post('/login', function(req, res){
  var usr = req.body;
  new User({username: usr.username}).fetch().then(function(user){
    if(user){
      if(user.checkPassword(usr.password)){
        req.session.username = user.get('username');
        res.render('index');
      } else {
        res.render('login');
      }
    } else {
      res.render('signup');
    }
  });
});

app.post('/signup', function(req, res){
  var usr = req.body;
  var user = new User({
    username: usr.username,
    password: usr.password
  });
  // CHECK TO SEE IF USER EXISTS
  user.save().then(function(newUser) {
    Users.add(newUser);
    // res.send(200, newUser);
    res.render('index');
  });
});


app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
