const MongoClient = require('mongodb').MongoClient;

const mongoUrl = process.env.MONGO_URI || "mongodb://heroku_q832cnlv:tn7taqiti148924t3a2t159m8i@ds147377.mlab.com:47377/heroku_q832cnlv";

/*  Keeps a global db connection around so we
	don't have to go searching for a new one every
	time. All mongo calls should be wrapped with
	mongoConnect((db) => {}) */
class MongoHelper {
	constructor() {
		this.gDb = null;
	}

	mongoConnect(cb) {
		if (this.gDb) {
			cb(this.gDb);
			return;
		}
		if (!mongoUrl) {
			console.log('ERROR: mongoUrl is undefined');
			return;
		}

		MongoClient.connect(mongoUrl, (err, db) => {
			if (err) {
				return;
			}
			this.gDb = db;

			db.on('close', () => {
				this.gDb = null;
			});
			cb(this.gDb);
		});
	}

	putUsers(data, cb) {
		const docs = [];
		for (const mlhId of data) {
			if ({}.hasOwnProperty.call(mlhId, data)) {
				docs.push({
					updateOne: {
						/* eslint-disable camelcase */
						filter: {mlh_id: mlhId},
						/* eslint-enable camelcase */
						update: {$set: data[mlhId]},
						upsert: true
					}
				});
			}
		}
		this.mongoConnect(db => {
			db.collection('users').bulkWrite(docs, null, (err, r) => {
				if (err) {
					console.log(err);
					cb(null);
					return;
				}

				cb(r);
			});
		});
	}

	putUser(id, data, cb) {
		/* eslint-disable camelcase */
		data.mlh_id = id;
		this.mongoConnect(db => {
			db.collection('users').update({mlh_id: id}, data, {upsert: true}, err => {
				console.log('Finished ' + id);
				if (cb) {
					cb(err);
				}
			});
		});
		/* eslint-enable camelcase */
	}

	getUser(id, cb) {
		/* eslint-disable camelcase */
		this.mongoConnect(db => {
			db.collection('users').findOne({mlh_id: id}, (err, res) => {
				if (err) {
					console.log(err);
					cb(null);
					return;
				}
				cb(res);
			});
		});
		/* eslint-enable camelcase */
	}

	getAllUsers(token, checkedIn, cb) {
		this.checkToken(token, res => {
			if (!res) {
				cb(null);
				return;
			}

			const permission = res.permission.split(',');
			const filter = {_id: 0};
			for (let i = 0; i < permission.length; i++) {
				filter[permission[i]] = 1;
			}

			const query = {};
			if (checkedIn) {
				/* eslint-disable camelcase */
				query.checked_in = true;
				/* eslint-enable camelcase */
			}

			this.mongoConnect(db => {
				db.collection('users').find(query, filter, (err, res) => {
					if (err) {
						console.log('ERROR: cannot get all users', err);
						if (typeof cb === 'function') {
							cb(null);
						}
						return;
					}
					res.toArray((err, val) => {
						if (err) {
							console.log('ERROR: iterating over all users', err);
							cb(null);
							return;
						}

						cb(val);
					});
				});
			});
		});
	}

	getViewer(cb) {
		this.mongoConnect(db => {
			db.collection('viewers').find({}, {}, (err, res) => {
				if (err) {
					console.log(err);
					cb(err, null);
					return;
				}
				res.toArray((err, val) => {
					if (err) {
						console.log('ERROR: iterating over views', err);
						cb(null, null);
						return;
					}

					cb(null, val);
				});
			});
		});
	}

	addViewer(token, permission, cb) {
		this.mongoConnect(db => {
			db.collection('viewers').update({token}, {token, permission}, {upsert: true}, err => {
				if (err) {
					if (typeof cb === 'function') {
						cb(err);
					} else {
						console.log(err);
					}
				}

				if (typeof cb === 'function') {
					cb(null);
				}
			});
		});
	}

	checkToken(token, cb) {
		this.mongoConnect(db => {
			db.collection('viewers').findOne({token}, (err, res) => {
				if (err) {
					console.log(err);
					cb(null);
					return;
				}

				cb(res);
			});
		});
	}
}

module.exports = new MongoHelper();
