var express = require('express');
var request = require("request");
var path = require("path");
var userService = require('./user-service.js');
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

app.get('/token', function(req,response) {
    userService.getViewer(function(err, val) {
        response.json({data:val, error: err});
    });
});

app.post('/token', function(req,response) {
    var token = req.query.token;
    var permission = req.query.permission;

    userService.addViewer(token, permission);
    response.json({data: "success"});
});

app.get('/user', function(req, response) {
    var token = req.query.token;
    var checked_in = req.query.checked_in || false;

    userService.getAllUsers(token, checked_in, function(users) {
        response.json({data: users});
        return;
    });
});

app.get('/merge', function(req, response) {
    request.get("<MLH_URL>",function(err,body,res){
        var parsed = JSON.parse(body.body).data;
        var members = {};
        for (var i=0; i<parsed.length; i++) {
            var cur = parsed[i];
            cur.checked_in = false;
            cur.github = "";
            cur.resume = "";
            cur.mlh_id = cur.id.toString();
            members[cur.mlh_id] = cur;
            delete cur.id;
        }
        request.get({
            url: "<MAILCHIMP_URL>",
            headers:{
                "Authorization":"apikey <MAILCHIMP_API_KEY>",
                "content-type": "application/json",
            },
            json:true
        }, function(err, res, body) {
            var rawMembers = body.members;
            for (var i=0; i<rawMembers.length; i++) {
                var cur = rawMembers[i];
                var id = cur.merge_fields.MLH_ID;

                if (typeof id === 'number'){
                    id = id.toString();
                }
                if (members[id]) {
                    members[id]["github"] = cur.merge_fields.GITHUB;
                    members[id]["resume"] = cur.merge_fields.RESUME;
                }
            }
            userService.putUsers(members, function(r) {
                console.log(r);
            });

            response.json({data:members});
            return;
        });
    });
});

app.post('/user/:id/in', function(req, response) {
    var id = req.query.id;
    var checked_in = req.body.checked_in;

    userService.getUser(id, function(res) {
        if (!res) {
            response.json("NOT AVAILABLE");
            return;
        }
        res.checked_in = checked_in;
        res.mlh_id = id;
        userService.putUser(id, res, function(err) {
            if (err){
                response.json(err);
                return;
            }
            response.json(res);
        });
    });
});

app.post('/signup', function(req, response) {
    var token = req.body.token;
    var resume = req.body.resume;
    var github = req.body.github;

    request({
        url:"https://my.mlh.io/api/v1/user?access_token="+token,
        method: 'GET',
        rejectUnauthorized: false
    },function(err,res,body){
        if (err){
            console.log('ERROR getting tacocat from mlh');
            response.json({data:err});
            return;
        }
        var user = JSON.parse(body).data;
        user.github = github;
        user.resume = resume;
        user.checked_in = false;
        user.mlh_id = user.id.toString();
        delete user.id;
        userService.getUser(user.mlh_id,function(res) {
            if (res) {
                user.checked_in = res.checked_in;
            }
            userService.putUser(user.mlh_id, user);
        });
        request.post({
            url: "https://us10.api.mailchimp.com/3.0/lists/<LIST_ID>/members",
            headers:{
                "Authorization":"apikey <MAILCHIMP_API_KEY>",
                "content-type": "application/json",
            },
            json:true,
            body:{
                email_address:user.email,
                status: "pending",
                merge_fields:{
                    FNAME:user.first_name,
                    LNAME:user.last_name,
                    MLH_ID:user.mlh_id,
                    SCHOOL:user.school.name,
                    RESUME:resume,
		    GITHUB:github
                }
            }
        },function(error,mail_response,body){
	        if (error){
		        console.log("ERROR subbing "+user.email);
                response.json({error:error});
                return;
            }
	        console.log('SUCCESS subbing '+user.email);
            response.json({data:"success"});
        });
    });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
