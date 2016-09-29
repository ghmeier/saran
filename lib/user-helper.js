/* User Helpers */

var mongo = require('./mongo-helper.js');
var MAILCHIMP_LIST = process.env["MAIPCHIMP_LIST"];
var MAILCHIMP_API_KEY = process.env["MAILCHIMP_API_KEY"];

/* Sends a response containing a list of all users with data filtered
   by the token preferences (see token-helper) */
module.exports.userList = (req, response) => {
    // you can view available tokens at /token
    var token = req.query.token;
    var checked_in = req.query.checked_in || false;

    mongo.getAllUsers(token, checked_in, (users) => {
        response.json({
            data: users
        });
        return;
    });
};

/* Sets the user's checked_in status to the value passed in
   req.body.checked_in */
module.exports.checkIn = (req, response) => {
    var id = req.params.id;
    var checked_in = req.body.checked_in;

    mongo.getUser(id, (res) => {
        if (!res) {
            response.json({
                data: null,
                error: "NOT AVAILABLE"
            });
            return;
        }
        res.checked_in = checked_in;
        res.mlh_id = id;
        mongo.putUser(id, res, (err) => {
            if (err) {
                response.json({
                    data: null,
                    error: err
                });
                return;
            }
            response.json({
                data: res,
                error: null
            });
        });
    });
};

/* Given a MyMLH token, and some extra data parameters, it
   adds a new record to Saran's database and does any additional
   data management needed.*/
module.exports.signup = function(req, response) {
    var token = req.body.token;
    var resume = req.body.resume;
    var github = req.body.github;

    request({
        url: "https://my.mlh.io/api/v2/user.json?access_token=" + token,
        method: 'GET',
        rejectUnauthorized: false
    }, function(err, res, body) {
        if (err) {
            console.log('ERROR getting ' + token + ' from mlh');
            response.json({
                data: null,
                error: err
            });
            return;
        }
        var user = JSON.parse(body).data;
        user.github = github;
        user.resume = resume;
        user.checked_in = false;
        user.mlh_id = user.id.toString();
        delete user.id;
        mongo.getUser(user.mlh_id, function(res) {
            if (res) {
                user.checked_in = res.checked_in;
            }
            mongo.putUser(user.mlh_id, user);

            /* As an example, you can register a user
               for your mailchimp list here, or whatever
               else you need
            mailchimp(user, (error, mail) => {
                response.json({
                    data: mail,
                    error: error
                });
            }); */

        });

    });
};

var mailchimp = (cb) => {
    request.post({
        url: "https://us10.api.mailchimp.com/3.0/lists/" + MAILCHIMP_LIST + "/members",
        headers: {
            "Authorization": "apikey " + MAILCHIMP_API_KEY,
            "content-type": "application/json",
        },
        json: true,
        body: {
            email_address: user.email,
            status: "pending",
            merge_fields: {
                FNAME: user.first_name,
                LNAME: user.last_name,
                MLH_ID: user.mlh_id,
                SCHOOL: user.school.name,
                RESUME: user.resume,
                GITHUB: github
            }
        }
    }, (error, mail_response, body) => {
        if (error) {
            console.log("ERROR subbing " + user.email);
            response.json({
                data: null,
                error: error
            });
            return;
        }
        console.log('SUCCESS subbing ' + user.email);
        if (cb && typeof cb === 'function') {
            cb(error, mail_response);
        }
    });
}