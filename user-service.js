var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var request = require("request");

var mongoUrl = process.env["MONGODB_URI"] || "mongodb://heroku_53t10wmx:fj9e864otn66tk8l9iicr0b2e6@ds029705.mlab.com:29705/heroku_53t10wmx";

module.exports.putUser = putUser;
module.exports.getUser = getUser;
module.exports.addViewer = addViewer;
module.exports.getAllUsers = getAllUsers;

function mongoConnect(cb) {
  MongoClient.connect(mongoUrl,function(err,db){
    if (err){
      return ;
    }
    cb(db);
  });
}

function putUser(id, data) {
  data.mlh_id = id;
  mongoConnect(function (db) {
    db.collection("users").update({mlh_id: id}, data, {upsert:true}, function(err, res) {
      if (err) {
        console.log(err);
      }
    });
  });
}

function getUser(id) {
  mongoConnect(function (db) {
    db.collection("users").findOne({mlh_id: id}, function(err, res) {
      if (err) {
        console.log(err)
        return null;
      }
      return res;
    });
  });
}

function getAllUsers(token, cb) {
  checkToken(token, function(res) {
    if (!res) {
      cb(null);
      return;
    }
    var permission = res.permission.split(",");
    var filter = {"_id":0};
    for (var i=0; i<permission.length; i++) {
      filter[permission[i]] = 1;
    }

    mongoConnect(function(db) {

      db.collection("users").find({}, filter, function (err, res) {
        res.toArray(function(err, val) {
          cb(val);
        });
        db.close();
      });
    });
  });
}

function addViewer(token, permission) {
  mongoConnect(function(db) {
    db.collection("viewers").update({token: token}, {
      token: token,
      permission: permission
    }, {upsert: true}, function(err, res) {
      if (err) {
        console.log(err);
      }
    })
  });
}


function checkToken(token, cb) {
  mongoConnect(function(db) {
    db.collection("viewers").findOne({token:token}, function(err, res) {
      if (err) {
        console.log(err);
        cb(null);
        return;
      }

      cb(res);
    });
  });
}