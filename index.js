var express = require('express');
var request = require("request");
var path = require("path");
var tokenHelper = require('./token-helper.js');
var userHelper = require('./user-helper.js');
var app = express();

var bodyParser = require('body-parser');
var cors = require("cors");
var corsOptions = {
    origin : "*"
};

app.use( bodyParser.json() );
app.use(cors(corsOptions));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
    response.render("index",{
        APP_ID: process.env['APP_ID'],
        SECRET: process.env['SECRET']
    });
});

app.get('/js/functions.js', function(request, response) {
    response.sendFile(path.join(__dirname+"/js/functions.js"));
});

app.get(    '/token',   tokenHelper.tokenList);
app.post(   '/token',   tokenHelper.addToken);

//app.get('/merge', userHelper.merge);
app.post(   '/user/:id/in', userHelper.checkIn);
app.post(   '/user',        userHelper.signup);
app.get(    '/user',        userHelper.userList);

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
