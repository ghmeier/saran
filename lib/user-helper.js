/* User Helpers */
const request = require('request');
const mongo = require('./mongo-helper.js');

const MAILCHIMP_LIST = process.env.MAIPCHIMP_LIST;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;

/* Sends a response containing a list of all users with data filtered
   by the token preferences (see token-helper) */
module.exports.userList = (req, response) => {
    // you can view available tokens at /token
    const token = req.query.token;
    const checkedIn = req.query.checked_in || false;

    mongo.getAllUsers(token, checkedIn, users => {
        response.json({
            data: users
        });
        return;
    });
};

/* Sets the user's checked_in status to the value passed in
   req.body.checked_in */
module.exports.checkIn = (req, response) => {
    const id = req.params.id;
    const checkedIn = req.body.checked_in;

    mongo.getUser(id, res => {
        if (!res) {
            response.json({
                data: null,
                error: 'NOT AVAILABLE'
            });
            return;
        }
        /* eslint-disable camelcase */
        res.checked_in = checkedIn;
        res.mlh_id = id;
        /* eslint-enable camelcase */
        mongo.putUser(id, res, err => {
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
   data management needed. */
module.exports.signup = (req, response) => {
	const token = req.body.token;
	const resume = req.body.resume;
	const github = req.body.github;

	request({
		url: 'https://my.mlh.io/api/v2/user.json?access_token=' + token,
		method: 'GET',
		rejectUnauthorized: false
	}, (err, res, body) => {
		if (err) {
			console.log('ERROR getting ' + token + ' from mlh');
			response.json({
				data: null,
				error: err
			});
			return;
		}
		const user = JSON.parse(body).data;
		if (!user) {
			response.json({data: null, err: "ERROR"})
			return;
		}
		putUser(user, github, resume, (data, err) => {
			response.json({data: user, error: err});
		});
	});
};

/* With APP_ID and SECRET tokens set, attempt to import
   all registered users into mongo */
module.exports.importUsers = (req, response) => {
    const appId = process.env.APP_ID;
    const secret = process.env.SECRET;

    const url = 'https://my.mlh.io/api/v2/users.json?client_id=' + appId + '&secret=' + secret + '&per_page=1000';
    request({
        url: url,
        method: 'GET',
        rejectUnauthorized: false
    }, (err, res, body) => {
        if (err) {
            console.log('ERROR getting users from mlh');
            response.json({
                data: null,
                error: err
            });
            return;
        }
        const users = JSON.parse(body).data;
        if (!users) {
            response.json({data: null, err: "ERROR"})
            return;
        }

        let puts = [];
        for (let i = 0; i < users.length; i++) {
            let user = users[i];

            puts.push(new Promise((resolve, reject) => {
                putUser(user, null, null, (data, err) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                        return;
                    }

                    resolve(data);
                });
            }));
        }

        Promise.all(puts).then(values => {
            response.json({data: 'Imported ' + values.length + ' users.'});
        }).catch(reason => {
            response.json({error: reason})
        });
    });
};

const putUser = (user, github, resume, cb) => {
    user.github = github;
    user.resume = resume;
    /* eslint-disable camelcase */
    user.checked_in = false;
    user.mlh_id = user.id.toString();
    delete user.id;

    mongo.getUser(user.mlh_id, res => {
        if (res) {
            user.checked_in = res.checked_in;
        }

        mongo.putUser(user.mlh_id, user, err => {
            if (!cb) {
                return;
            }


            if (err) {
                console.log('something', err);
                cb(null, err);
                return;
            }

            cb(user);
        });
        /* eslint-enable camelcase */


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
};

/* eslint-disable no-unused-vars */
const mailchimp = (user, cb) => {
/* eslint-enable no-unused-vars */
    request.post({
        url: 'https://us10.api.mailchimp.com/3.0/lists/' + MAILCHIMP_LIST + '/members',
        headers: {
            Authorization: 'apikey ' + MAILCHIMP_API_KEY,
            'content-type': 'application/json'
        },
        json: true,
        body: {
            /* eslint-disable camelcase */
            email_address: user.email,
            status: 'pending',
            merge_fields: {
                FNAME: user.first_name,
                LNAME: user.last_name,
                MLH_ID: user.mlh_id,
                SCHOOL: user.school.name,
                RESUME: user.resume,
                GITHUB: user.github
            }
            /* eslint-enable camelcase */
        }
    }, (err, mailResponse) => {
        if (err) {
            console.log('ERROR subbing ' + user.email);
            mailResponse.json({
                data: null,
                error: err
            });
            return;
        }
        console.log('SUCCESS subbing ' + user.email);
        if (cb && typeof cb === 'function') {
            cb(null, mailResponse);
        }
    });
};
