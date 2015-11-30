var express = require('express');
var request = require("request");
var app = express();

app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
  response.json({message:"success"})
});

app.post('/signup', function(request, response) {
  response.json({message:"success"})
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});