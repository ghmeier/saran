var express = require('express');
var request = require("request");
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

app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
  response.json({message:"success"})
});

app.get('/addViewer', function(req,response) {
    var token = req.query.token;
    var permission = req.query.permission;

    userService.addViewer(token, permission);
    response.json({data: "success"});
});

app.get('/getAllUsers', function(req, response) {
    var token = req.query.token;

    userService.getAllUsers(token, function(users) {
        for (var i=0; i<users.length;i++) {

            // if (typeof users[i].mlh_id === 'number'){
            //     var num = users[i].mlh_id.toString();
            //     //console.log(users[i].mlh_id,typeof users[i].mlh_id, typeof num);
            //     userService.putUserByID(users[i]._id, {mlh_id: num}, function(err){
            //         if (err) {
            //             console.log(err);
            //         }
            //     })
            // }
            //break;
        }
        response.json({data: users});
        return;
    });
});

app.get('/merge', function(req, response) {
    request.get("https://my.mlh.io/api/v1/users?client_id=79020d89d525fb39d0d5c704e013f45a4ea3d85a732a5b3eba18617b95250cfe&secret=d500f122f2111b0c2797834b75e006885f8cd73d7f6e41fa2438e068a815df80",function(err,body,res){
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
            url: "https://us10.api.mailchimp.com/3.0/lists/3e68b09893/members?count=1000&fields=members.email_address,members.merge_fields",
            headers:{
                "Authorization":"apikey 53e48c48bc0cc6a35ab62c0c95eee883-us10",
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

app.post('/check_in', function(req, response) {
    var id = req.body.id;
    var checked_in = req.body.checked_in;

    userService.getUser(id, function(res) {
        res.checked_in = checked_in;
        res.mlh_id = id;
        console.log(res);
        userService.putUser(id, res, function(err) {
            if (err){
                console.log("PRINT");
                response.json(err);
                return;
            }
            console.log("SDAS");
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
            console.log('ERROR getting user from mlh');
            response.json({data:err});
            return;
        }
        var user = JSON.parse(body).data;
        user.checked_in = false;
        user.github = github;
        user.resume = resume;
        user.mlh_id = user.id.toString();
        delete user.id;
        userService.putUser(user.mlh_id, user);
        request.post({
            url: "https://us10.api.mailchimp.com/3.0/lists/3e68b09893/members",
            headers:{
                "Authorization":"apikey 53e48c48bc0cc6a35ab62c0c95eee883-us10",
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
