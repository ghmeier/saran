var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var request = require("request");

var mongoUrl = process.env["MONGODB_URI"];

/* Keeps a global db connection around so we
   don't have to go searching for a new one every
   time. All mongo calls should be wrapped with
   mongoConnect((db) => {}) */
var gDb = null;
function mongoConnect(cb) {
  if (gDb) {
    cb(gDb);
    return;
  }
  if (!mongoUrl) {
    console.log("ERROR: mongoUrl is undefined");
    return;
  }

  MongoClient.connect(mongoUrl, (err, db) => {
    if (err){
      return ;
    }
    gDb = db;

    db.on('close', () => {
      gDb = null;
    });
    cb(gDb);

  });
}

module.exports.putUsers = (data, cb) => {
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
  mongoConnect((db) => {
    db.collection("users").bulkWrite(docs,null,(err, r) => {
      if (err) {
        console.log(err);
        cb(null);
        return;
      }

      cb(r)
    })
  });
}

module.exports.putUser = (id, data, cb) => {
  data.mlh_id = id;
  mongoConnect((db) => {
    db.collection("users").update({mlh_id: id}, data, {upsert:true}, (err, res) => {
      console.log("Finished "+id)
      if (cb) {
        cb(err);
      }
    });
  });
}

module.exports.getUser = (id, cb) => {
  mongoConnect((db) => {
    db.collection("users").findOne({mlh_id: id}, (err, res) => {
      if (err) {
        console.log(err)
        cb(null);
        return;
      }
      cb(res);
    });
  });
}

module.exports.getAllUsers = (token, checked_in, cb) => {
  checkToken(token, (res) => {
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

    mongoConnect((db) => {
      db.collection("users").find(query, filter, (err, res) => {
        res.toArray((err, val) => {
          cb(val);
        });
      });
    });
  });
}

module.exports.getViewer = (cb) => {
  mongoConnect((db) => {
    db.collection("viewers").find({}, {}, (err, res) => {
      if (err) {
        console.log(err);
        cb(err,null);
        return;
      }
      res.toArray((err, val) => {
        cb(null, val)
      });
    });
  });
}

module.exports.addViewer = (token, permission) => {
  mongoConnect((db) => {
    db.collection("viewers").update({token: token}, {
      token: token,
      permission: permission
    }, {upsert: true}, (err, res) => {
      if (err) {
        console.log(err);
      }
    })
  });
}


module.exports.checkToken = (token, cb) => {
  mongoConnect((db) => {
    db.collection("viewers").findOne({token:token}, (err, res) => {
      if (err) {
        console.log(err);
        cb(null);
        return;
      }

      cb(res);
    });
  });
}