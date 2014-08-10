var pg = require('pg')
, async = require('async')
, pool,client
, connString = 'tcp://nodeMap:asdf@localhost/cpgoods';

var connect = exports.connect = function connect( callback ){
	if(client instanceof pg.Client){
		if( typeof callback === "function" ) callback();
	}else{
		client = new pg.Client(process.env.DATABASE_URL||connString);
		client.on('error', function(error) {
		      console.log(error);
		});
		client.connect( function(){
			if( typeof callback === "function" ) callback();
		});
	}
}

var getFilesById = exports.getFilesById = function( id, callback ){
	var query = "select * from decision where id=" + id;
	client.query(query, function(err, result) {
		if(err){
			console.log( "error occurred"+err );
			//end();
		}else if(typeof result == "object"){
			callback( result.rows[0] );
		}else{
			console.log("unexpected!",err);
		}
	});
}
var selectArticles = exports.selectArticles = function(callback){
	var query = "select * from article a, article_file_iot b, filestorage c where a.id=b.article_id and b.file_id=c.id";
	client.query(query, function(err, result) {
		if(err){
			console.log( "error occurred"+err );
			//end();
		}else if(typeof result == "object"){
			callback( result.rows );
		}else{
			console.log("unexpected!",err);
		}
	});
}
var updateDecision = exports.updateDecision = function( id, which, callback){
	var query = "UPDATE decision SET vote"+which+"=(select vote"+which+"+1 from decision where id="+id+") WHERE id="+id+";"
	client.query(query, function(err, result) {
		if(err){
			console.log( "error occurred"+err );
			//end();
		}else if(typeof result == "object"){
			getFilesById(id, function(decision){
				callback( decision );
			});


		}else{
			console.log("unexpected!",err);
		}
	});
}
var insertFileInfo = exports.insertFileInfo = function(filename,filetype,filetoken, callback ) {
	var query = "insert into filestorage (filename,filetype,filetoken) values($1,$2,$3) RETURNING id";
	client.query(query, [filename,filetype,filetoken],function(err, result) {
		if(err){
			console.log( "error occurred"+err );
			//end();
		}else if(typeof result == "object"){
			callback( result.rows[0].id );
		}else{
			console.log("unexpected!",err);
		}
	});
}
/*
* deprecated
*/
var getFileFromToken = exports.getFileTypeFromToken = function( filetoken, callback ){
	var query = "select filetype from filestorage where filetoken=$1";
	client.query(query,[filetoken],function(err, result) {
		if(err){
			console.log( "error occurred"+err );
			//end();
		}else if(typeof result == "object"){
			callback( result.rows[0]["filetype"] );
		}else{
			console.log("unexpected!",err);
		}
	});
}
var insertArticle = exports.insertArticle = function(mbody, callback ) {
	//url:selectedUrl, imgs:selectedImgs, content:fCon, tags: fTag
	console.log(mbody);


	var articleJob = function( callback ){
		var query = "insert into article (comment,tags) values($1,$2)  RETURNING id";
		client.query(query, [mbody.content,mbody.tags], function(err, result) {
			if(err){
				console.log( "error occurred #1:"+err );
			}else if(typeof result == "object"){
				callback( result.rows[0].id );
			}else{
				console.log("unexpected!",err);
			}
		});
	}
	var fileJob = function(imgs,insertedId){
		var len = imgs.length;
		async.eachSeries( imgs , function(item,cb){
			var query = "insert into article_file_iot ( article_id, file_id ) values ($1,$2)";
			client.query(query, [insertedId,item.fileid],function(err, result) {
				if(err){
					console.log( "error occurred #2"+err );
					callback(false);
				}else if(typeof result == "object"){
					// do nothing
				}else{
					console.log("unexpected!",err);
					callback(false);
				}
				cb( null );
			});
		},
		function(err,result){
			callback( true );
		});
	}

	if(mbody){
		articleJob(function( insertedId ){
			fileJob( mbody.imgs, insertedId );
		});
	}

}

var end = exports.end = function(){
	client.end();
	pg.end();
};
