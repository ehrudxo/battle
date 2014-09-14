var Canvas = require('canvas')
	, Image = Canvas.Image
  	, canvas
  	, ctx
	, fs = require('fs')
	, dao = require('./decisionDao');

var setCanvas = exports.setCanvas= function( width, height ){
	canvas = new Canvas( width, height );
	ctx = canvas.getContext('2d');
}
var getPngByFiles = exports.getPngByFiles = function( file1, file2, id, which, callback ){
	canvas.width = canvas.width;
	var img1 = getImageFromFodler(file1);
	var iW = img1.width;
	var iH = img1.height;
	var img2 = getImageFromFodler(file2);
	var gap = 50;
	var startTop =70;
	var startLeft =20;
	var versusTxt = "vs";

	ctx.font = '30px Impact';
	ctx.save();
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.rotate(.1);
	var te = ctx.measureText(versusTxt);

	ctx.fillText(versusTxt, iW + gap , 100);
	ctx.beginPath();
	ctx.lineTo(iW +gap , 102);
	ctx.lineTo(iW +gap + te.width, 102);
	ctx.stroke();
	ctx.restore();

	ctx.fillText("A", startLeft , startTop -30);
	ctx.fillText("B", startLeft  + iW + gap*2 + te.width, startTop-30);
	ctx.drawImage(img1, startLeft, startTop, img1.width, img1.height);
	ctx.drawImage(img2, iW+ gap + te.width+startLeft, startTop, img2.width, img2.height);

	if(parseInt(which) >0 ){
		dao.updateDecision( id, which, function( decision ){
			drawCount( decision["vote1"]||0, decision["vote2"]||0 );
			callback(canvas.toBuffer());
		})
	}else{
		console.log(which);
		dao.getFilesById( id, function( decision ){
			drawCount( decision["vote1"]||0, decision["vote2"]||0 );
			callback(canvas.toBuffer());
		} );
	}
	var drawCount = function( countA, countB ){
		ctx.font ='70px Impact';
		ctx.strokeStyle = 'rgba(0,128,255,0.5)';
		ctx.fillText( countA +" likes",  50 + startLeft , startTop + 400 );
		ctx.fillText( countB +" likes",  50 + iW+ gap + te.width+startLeft , startTop + 400 );
	}

}
var getPngByFilesTwo = exports.getPngByFilesTwo = function( file1, file2, callback ){
	canvas.width = canvas.width;
	var img1 = getImageFromFodler(file1);
	var iW = img1.width;
	var iH = img1.height;
	var img2 = getImageFromFodler(file2);
	var gap = 50;
	var startTop =70;
	var startLeft =20;
	var versusTxt = "vs";

	ctx.font = '30px Impact';
	ctx.save();
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.rotate(.1);
	var te = ctx.measureText(versusTxt);

	ctx.fillText(versusTxt, iW + gap , 100);
	ctx.beginPath();
	ctx.lineTo(iW +gap , 102);
	ctx.lineTo(iW +gap + te.width, 102);
	ctx.stroke();
	ctx.restore();

	ctx.fillText("A", startLeft , startTop -30);
	ctx.fillText("B", startLeft  + iW + gap*2 + te.width, startTop-30);
	ctx.drawImage(img1, startLeft, startTop, img1.width, img1.height);
	ctx.drawImage(img2, iW+ gap + te.width+startLeft, startTop, img2.width, img2.height);
	callback();
}
var comparegoodies = exports.comparegoodies =function( goodies, callback ){
	//path extract from goodies
	var goodies_arr = goodies.split(",");
	//by path make Img
	if(goodies_arr.length == 2){
		getPngByFilesTwo(goodies_arr[0],goodies_arr[1], function(){
			callback(canvas.toBuffer());
		});
	}else if(goodies_arr.length >2){
		callback(canvas.toBuffer());
	}else{
		callback(canvas.toBuffer());
	}
}
var savegoodies = exports.savegoodies = function( goodies, callback ){
	//path extract from goodies
	var goodies_arr = goodies.split(",");
	var out = fs.createWriteStream(__dirname + '/uploads/'+ goodies+'.png'), stream;
	//by path make Img
	if(goodies_arr.length == 2){
		getPngByFilesTwo(goodies_arr[0],goodies_arr[1], function(){
			stream = canvas.pngStream();
			stream.on('data', function(chunk){
			  out.write(chunk);
			});
			stream.on('end', function(){
			  console.log('saved png');
			});
			callback();
		});
	}else if(goodies_arr.length >2){
		callback(canvas.toBuffer());
	}else{
		callback(canvas.toBuffer());
	}
}
var getImageFromFodler = function( filename ){
	var img = new Image;
	img.src = fs.readFileSync(__dirname + '/uploads/'+ filename);
  	return img;
}
