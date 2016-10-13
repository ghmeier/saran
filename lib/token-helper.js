/* Token Helper */
var mongo = require('./mongo-helper.js');

/* Returns a list of all tokens and their permissions string.
   The permission string is a comma separated list of attribute
   names which should be returned when retrieving users given
*/
module.exports.tokenList = (req,response) => {
    mongo.getViewer((err, val) => {
        response.json({data:val, error: err});
    });
};

/* Adds a new token and permission pair to the database
   which can be used to filter response data in /user */
module.exports.addToken = (req,response) => {
    var token = req.body.token;
    var permission = req.body.permission;

    if (!token || !permission) {
        response.json({message:"token and permission list are required"});
        return;
    }

    mongo.addViewer(token, permission, (err) => {
        response.json({token:token,permissions:permission.split(","),error:err});
    });
};
