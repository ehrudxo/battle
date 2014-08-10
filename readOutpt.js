var fs = require('fs');
fs.readFile('./output.txt', function (err, data) {
  if (err) throw err;
  var re = new RegExp("/([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))","g");
  console.log(data.toString().match( re ));
  //var urls = data.match( re );
  //console.log(urls);
});
