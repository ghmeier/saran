const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const tokenHelper = require('./lib/token-helper.js');
const userHelper = require('./lib/user-helper.js');

const app = express();
const corsOptions = {
	origin: '*'
};

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
	next();
});

app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 5000));

app.get('/', (request, response) => {
	response.render('index', {
		APP_ID: process.env.APP_ID,
		SECRET: process.env.SECRET
	});
});

app.get('/signup', (request, response) => {
	response.render('signup', {
		APP_ID: process.env.APP_ID,
		REDIRECT: process.env.REDIRECT
	});
});

app.get('/callback', (request, response) => {
	response.render('callback', {
		APP_ID: process.env.APP_ID,
		REDIRECT: process.env.REDIRECT
	});
});

app.get('/js/functions.js', (request, response) => {
	response.sendFile(path.join(__dirname, '/js/functions.js'));
});

app.get('/token', tokenHelper.tokenList);
app.post('/token', tokenHelper.addToken);

// user access
app.post('/user/:id/in', userHelper.checkIn);
app.post('/user', userHelper.signup);
app.get('/user', userHelper.userList);
app.post('/import', userHelper.importUsers);

app.listen(app.get('port'), () => {
	console.log('Node app is running on port', app.get('port'));
});
