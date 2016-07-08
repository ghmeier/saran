var express = require('express');
var request = require("request");
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

app.post('/signup', function(req, response) {
    var token = req.body.token;
    var resume = req.body.resume;
    var github = req.body.github;
    console.log(req.body);

    request.get("https://my.mlh.io/api/v1/user?access_token="+token,function(err,res,body){
        console.log(body);
        var user = JSON.parse(body).data;


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
                    MLH_ID:user.id,
                    SCHOOL:user.school.name,
                    RESUME:resume,
		    GITHUB:github
                }
            }
        },function(error,mail_response,body){
            if (error){
                response.json({error:error});

		return;
            }

            response.json({data:body, user:user});
        });
    });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
