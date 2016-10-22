/* Token Helper */
const mongo = require('./mongo-helper.js');

/* Returns a list of all tokens and their permissions string.
   The permission string is a comma separated list of attribute
   names which should be returned when retrieving users given
*/
module.exports.tokenList = (req, response) => {
	mongo.getViewer((err, val) => {
		response.json({data: val, error: err});
	});
};

/* Adds a new token and permission pair to the database
   which can be used to filter response data in /user */
module.exports.addToken = (req, response) => {
	const token = req.body.token;
	const permission = req.body.permission;

	if (!token || !permission) {
		response.json({
			message: 'ERROR: token and permission list are required'
		});
		return;
	}

	mongo.addViewer(token, permission, err => {
		response.json({token, permissions: permission.split(','), error: err});
	});
};
