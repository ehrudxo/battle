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
	var img1 = getImageFromFoler(file1);
	var iW = img1.width;
	var iH = img1.height;
	var img2 = getImageFromFoler(file2);
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

var getImageFromFoler = function( filename ){
	var img = new Image; 
	img.src = fs.readFileSync(__dirname + '/upload/'+ filename);
  	return img;
}
