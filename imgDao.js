var cheerio = require('cheerio')
	, request = require('request')
	, async = require('async')
	, gm = require('gm')
	, fs = require('fs')
	, path = require('path')
	, phantom = require('phantom')
  , imageMagick = gm.subClass({ imageMagick: true })
	, standardSize = 320;
var re = new RegExp("/([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))","g");

var getImgUrlsFromUrl = exports.getImgUrlsFromUrl = function( option ){
	var url, callback, inDetail=false;
	if(option){
		if(option.inDetail) inDetail = option.inDetail;
		if(option.url) 	url = option.url;
		if(option.standardSize) standardSize = option.standardSize;
		callback = option.callback;
		if(!url) callback(JSON.stringify({}));
	}else{
		return callback(JSON.stringify({}));
	}
	var netType="http";
	if(url && url.indexOf("http")>-1){
		if(url.indexOf("https")!=-1){
			netType="https"
		}
	}else{
		url = netType +"://"+url;
	}
	if(inDetail){
		usePhantom(url, netType, callback );
	}else{
		request( url, function(error, response, body){
			if (!error && response.statusCode == 200) {
					simpleParsing(body, netType,function(jsons){
						callback(JSON.stringify(jsons));
					});
			}
		});
	}
}
var usePhantom = function( url, netType, callback ){
	phantom.create(function (ph) {
		ph.createPage(function (page) {
			page.open(url, function (status) {
				if (status !== 'success') {
						console.log('Unable to access network');
						return {};
				} else {
					page.getContent( function(body){
						parsingRawContent(body, netType,function(jsons){
							ph.exit();
							callback(JSON.stringify(jsons));
						})
					});
			}
			});
		});
	});

}
/**
** Just Simple Parser
**/
var simpleParsing = function(body, netType, callback){
	var $ = cheerio.load(body);
	var urls = $('img');
	parsingSimpleContent( urls, netType, false, callback );
}
/**
**	parser for html
**/
var parsingDomContent = function( body, netType, callback ){
	var $ = cheerio.load(body);
	var imgTag = $('img');
	parsingContent( urls, netType, false, callback );

}
/**
**	it parse not for html just text
**/
var parsingRawContent = function( body, netType, callback ){
	var urls = body.match( re );
	parsingContent( urls, netType, true, callback );
}
/**
** does not use ImageMagick
**/
var parsingSimpleContent = function( urls, netType, isRaw, callback ){
	var jsons=[];
	var fetch = function(item,cb){
		var img_url;
		if(isRaw) img_url = item;
		else img_url = item.attribs.src;
		if (/^https?:\/\//.test(img_url)) {
		}else{
			img_url = netType +":"+img_url;
		}
		width = item.attribs.width;
		height = item.attribs.height;
		if( width && height && width>standardSize && height>standardSize &&
				(width*height) > (standardSize*standardSize) ){
				jsons.push(img_url);
		}
		cb( null );
	}
	async.eachSeries( urls, fetch, function(err,result){
		if ( err){
			// either file1, file2 or file3 has raised an error, so you should not use results and handle the error
		} else {
			console.log("everything done");
			callback(jsons);
		}
	});
}
/**
** use ImageMagick
**/
var parsingContent = function( urls, netType, isRaw, callback ){
	var jsons=[];
	var fetch = function(item,cb){
		var img_url;
		if(isRaw) img_url = item;
		else img_url = item.attribs.src;
		if (/^https?:\/\//.test(img_url)) {
		}else{
			img_url = netType +":"+img_url;
		}
		var imgFile = __dirname + '/tmp/'+path.basename(img_url);
		var picStream = fs.createWriteStream( imgFile );

		picStream.on('finish', function() {
		  useImageMagick( imgFile , function( sizeMatches ){
				if(sizeMatches) jsons.push(img_url);
				cb( null );
			});
		});

		picStream.on('error', function(error){
			console.log("[error on pipe] : "+error);
			cb(null);
		});
		request(img_url, function(error){
			if(error){
				console.log("[error on request] : "+error);
				cb(null);
			}
		}).pipe(picStream);

	}
	async.eachSeries( urls, fetch, function(err,result){
		 if ( err){
       // either file1, file2 or file3 has raised an error, so you should not use results and handle the error
    } else {
			console.log("everything done");
			callback(jsons);
    }
	});
}
var useImageMagick = function( filepath, callback ){
	imageMagick(filepath).size(function(err, size){
		var sizeMatches = false;
		if(!err){
			width = size.width;
			height = size.height;
			if( width>standardSize && height>standardSize &&
					(width*height) > (standardSize*standardSize) )
						sizeMatches = true;
		}else{
			console.log(err);
		}

		try{
			if(fs.existsSync(this.source))
				fs.unlink(this.source);
		}catch(e){
			console.log(e);
		}
		callback( sizeMatches );
	});  
}
var crawlImgs = exports.crawlImgs = function( reqBody, callback ){
	var img_url=reqBody.url;
	var filename = path.basename(img_url);
	var filetoken = filePathMake(filename);
	var imgFile = __dirname + '/uploads/' + filetoken;
	var picStream = fs.createWriteStream( imgFile );

	picStream.on('finish', function() {
		var files = {path : imgFile,name:filename,type:"unknown",size:"unknown"};
		callback( files );
	});
	picStream.on('error', function(error){
		console.log("[error on pipe] : "+error);
		callback(null);
	});
	request(img_url, function(error){
		if(error){
			console.log("[error on request] : "+error);
			callback(null);
		}
	}).pipe(picStream);
}

var filePathMake = function(filename) {
	var name = '';
	for (var i = 0; i < 32; i++) {
		name += Math.floor(Math.random() * 16).toString(16);
	}
	var ext = path.extname(filename);
	ext     = ext.replace(/(\.[a-z0-9]+).*/, '$1');
	name += ext;
	return name;
};
