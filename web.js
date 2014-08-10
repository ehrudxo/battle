
var express = require('express')
	, flash = require('connect-flash')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy
	, logfmt = require('logfmt')
	, jade = require('jade')
	, app = express()
	, renderImage = require('./renderImage')
	, dao = require('./couchDao')
	, formidable = require('formidable')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, session = require('express-session')
	, logger = require('express-logger')
	, methodOverride = require('method-override')
	, imgDao = require('./imgDao')
	, url = require('url')
	, util = require('util');

app.set('title','which is bertter?');
app.set('view engine','jade');
app.engine('jade',require('jade').__express);
app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(logger({path:__dirname +'/express_log.log'}));
app.use(cookieParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
/**
	passport start
**/
var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));
/**
	passport ends
**/
/**
  passport sample start
**/
app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });

// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
/*
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});
*/

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}
/* sample ends
*/

dao.connect( );
app.use('/list/:username',function( req , res ){
	dao.selectArticlesByUser( req.params.username, function(list){
		console.log("list:",list);
		res.render('list', {list:list} );
	});

});
app.use('/blabla/:id/which/:which', function(req,res){
	var ua = req.headers['user-agent'];
	if( isIE(ua) > 0 ){
		res.set('Content-Type', 'application/x-shockwave-flash');
		res.sendfile('./public/swf/cpgoods.swf');
	}else{
		res.render('blabla', {id:req.params.id,which :req.params.which});
	}

})
app.get('/imgurl/', function(req,res){
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	res.type('application/json');
	imgDao.getImgUrlsFromUrl( {url : query.url, inDetail:false, callback: function(json_r){
		res.send(json_r);
	}})
});
app.get('/imgurl-detail/', function(req,res){
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	res.type('application/json');
	imgDao.getImgUrlsFromUrl( {url : query.url, inDetail:true, callback: function(json_r){
		res.send(json_r);
	}})
});
app.get('/getUploadImg/:filetoken', function(req,res){
	var filetoken = req.params.filetoken;
	if(filetoken){
				res.sendfile(__dirname +'/uploads/'+filetoken);
	}else{
		res.status(404);
		res.type('txt').send('Not found')
	}

});
app.use('/canvas/:id/which/:which', function( req, res ){
		dao.getFilesById( req.params.id, function(decision){
			renderImage.setCanvas(600,600);
			renderImage.getPngByFiles( decision["filepath1"], decision["filepath2"], req.params.id, req.params.which, function( pngFile ){
				res.set('Content-Type', 'image/png');
				res.send( pngFile );
			} );

		});
});

app.post('/save', function(req,res){
	//url:selectedUrl, imgs:selectedImgs, content:fCon, tags: fTag
	dao.insertArticle(req.body, function(isOk){
		if(isOk){
			res.send("success");
		}else{
			res.send("failure");
		}
	});

});
app.post('/crawlImgs', function(req,res){
	imgDao.crawlImgs( req.body, function( files ){
		parseFiles([[{},files]], function( fileDesc ){
				res.send( JSON.stringify( { fields:{}, files: fileDesc } ) );
		});
	});
});
app.post('/uploads',function(req,res){
	var form = new formidable.IncomingForm();
	var path=[],
    files = [],
    fields = [];

  form.uploadDir = process.env.PWD + '/uploads/';
	form.keepExtensions = true;
	form
    .on('field', function(field, value) {
      	console.log(field, value);
      	fields.push([field, value]);
    })
    .on('file', function(field, file) {
      	console.log(field, file);
      	files.push([field, file]);
    })
    .on('end', function() {
	    res.type('application/json');
			parseFiles(files, function( fileDesc ){
					res.send( JSON.stringify( { fields:fields, files: fileDesc } ) );
			});

    });
	form.parse(req, function(err, fields, files) {
      if(err) {
      	console.log(err);
      	res.end('error shown below:\n\n'+ util.inspect(files));
      }
  });
});
var parseFiles = function( files, callback ){

	var fileDescriptions = [];
	var len = files.length;
	files.forEach(function( element, index, array){
		console.log(element);
		var desc = element[1];
		var filetoken = desc.path.substring(desc.path.lastIndexOf('/')+1,desc.path.length);
		dao.insertFileInfo( desc.name,desc.type,filetoken, function( fileid ){
				console.log(index,len);
				fileDescriptions[index] = {
					filetoken : filetoken,
					fileid		: fileid,
					filename 	: desc.name,
					filetype 	: desc.type,
					filesize 	: desc.size,
					url : '/getUploadImg/'+ filetoken
				};
				if(index==len-1) callback( fileDescriptions );
		} );
	});

}

var port = Number(process.env.PORT || 5000);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

var isIE = function( ua ){
	var rv = -1;
  		var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    	if (re.exec(ua) != null){
      		rv = parseFloat( RegExp.$1 );
      		return rv;
      	}else{
  			re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
    		if (re.exec(ua) != null)
      			rv = parseFloat( RegExp.$1 );
      		return rv;
  		}
}
process.on('exit', function() {
	dao.end();
  console.log('shutdown normally');
});
