var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var request = require("request");

var mongoUrl = process.env["MONGODB_URI"];

module.exports.putUser = putUser;
module.exports.putUsers = putUsers;
module.exports.getUser = getUser;
module.exports.addViewer = addViewer;
module.exports.getAllUsers = getAllUsers;

var gDb = null;

function mongoConnect(cb) {
  if (gDb) {
    cb(gDb);
    return;
  }
  MongoClient.connect(mongoUrl,function(err,db){
    if (err){
      return ;
    }
    gDb = db;

    db.on('close', function(){
      gDb = null;
    });
    cb(gDb);

  });
}

function putUsers(data, cb) {
  var docs = []
  for (mlh_id in data) {
    docs.push({
      updateOne:{
        filter: {mlh_id: mlh_id},
        update: {$set: data[mlh_id]},
        upsert: true
      }
    })
  }
  mongoConnect(function(db) {
    db.collection("users").bulkWrite(docs,null,function(err, r) {
      if (err) {
        console.log(err);
        cb(null);
        return;
      }

      cb(r)
    })
  });
}

function putUser(id, data, cb) {
  data.mlh_id = id;
  mongoConnect(function (db) {
    db.collection("users").update({mlh_id: id}, data, {upsert:true}, function(err, res) {
      console.log("Finished "+id)
      if (cb) {
        cb(err);
      }
    });
  });
}

function getUser(id, cb) {
  mongoConnect(function (db) {
    db.collection("users").findOne({mlh_id: id}, function(err, res) {
      if (err) {
        console.log(err)
        cb(null);
        return;
      }
      cb(res);
    });
  });
}

function getAllUsers(token, checked_in, cb) {
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

    var query = {};
    if (checked_in) {
      query.checked_in = true;
    }
    console.log(query,checked_in);

    mongoConnect(function(db) {

      db.collection("users").find(query, filter, function (err, res) {
        res.toArray(function(err, val) {
          cb(val);
        });
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