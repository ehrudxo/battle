var nano = require('nano')('http://localhost:5984')
  , async = require('async')
  , bases = {'filestorage' : undefined ,'article' : undefined ,'decision' : undefined };



var getFilesById = exports.getFilesById = function( username, callback ){

}
var selectArticlesByUser = exports.selectArticlesByUser = function( username, callback ){
  console.log(username);
  bases['article'].view('user','byUserName', {key:username} , function(err,body){
    if (!err) {
      var dd = [];
      body.rows.forEach(function(doc) {
        dd.push( doc );
      });
      callback( dd );
    }else{
      console.log("err:",err);
      callback( null );
    }
  });
}
var updateDecision = exports.updateDecision = function( id, which, callback){
}
var insertFileInfo = exports.insertFileInfo = function(filename,filetype,filetoken, callback ) {
  bases['filestorage'].insert({filename:filename, filetype:filetype, filetoken:filetoken}, function(err,body){
    if(!err){
      console.log( body );
      callback( body.id);
    }else{
      callback( null );
    }
  });
}
var insertArticle = exports.insertArticle = function(mbody, callback ) {
  bases['article'].insert(mbody, function(err, body){
    if(!err){
      callback(body.id);
    }else{
      callback(null);
    }
  });
}
var end = exports.end = function(){
};

var connect = exports.connect = function connect( callback ){
  async.each( Object.keys(bases) , function(item,cb){
    console.log( 'base: ' + item );
    nano.db.get( item, function(err,res){
      if(err){
        nano.db.create(item, function(err,res){
            if(!err){
              console.log('[init] '+ item +' has created');
              bases[ item ] = nano.db.use( item );
              cb( null );
            }else{
              console.log("something wrong happend about [" + item +"]");
              cb( null );
            }
        });
      }else{
        console.log('[init] '+ item +' is ready!');
        bases[ item ] = nano.db.use( item );
        cb( null );
      }
    });
  },
  function(err,result){
    if(err)console.log(err);
  });
}
