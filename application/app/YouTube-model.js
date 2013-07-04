enyo.kind({
	name: "utube.YouTubeModel",
	kind: enyo.Component,
	published: {
		youTubeEntitiesUpdatedCallback: null,
		favoritesUpdatedCallback: null
	},
	components: [
		{
			name: "db",
			kind: "onecrayon.Database",
			database: "ext:" + (enyo.g11n.getPlatform() === "device" ? enyo.fetchAppId() : "com.spinn.utube"),
			version: "",
			debug: (Spinn.Utils.exists(enyo.fetchFrameworkConfig().debuggingEnabled) ? enyo.fetchFrameworkConfig().debuggingEnabled : false)
		},
		{ name:"workQueue", kind:"Spinn.WorkQueue"}
	],
	constructor: function () {
		this.inherited(arguments);
		this.currentYouTubeEntity = null;
		this.currentYouTubeEntities = null;
		this.youTubeEntitiesColumns = ["uTubeId", "name", "entityType", "numVideos"];
		this.favoritesColumns = ["videoId", "title"];
		this.bound = {
			_databaseError: enyo.bind(this, this._databaseError)
		}
	},
	create: function () {
		this.inherited(arguments);
		if (!localStorage["utube.firstRun"]) {
			this.$.workQueue.createWorkItem(enyo.bind(this, this._populateDatabase_worker));
		} else {
			this.$.workQueue.createWorkItem(enyo.bind(this, this._updateDatabase_worker));
		}
	},
	_databaseError: function (er) {
		try {
			if (er.code === 1) {
				this.error("Database error (" + er.code + "): " + er.message);
				//this.populateDatabase();
			} else {
				this.error("Database error (" + er.code + "): " + er.message);
			}
		} finally {
			this.$.workQueue.lookForMoreWork();
		}
	},
	_populateDatabase_worker: function () {
		this.$.db.setSchemaFromURL("schemas/schema.json", {
			onSuccess: enyo.bind(this, this._finishFirstRun),
			onError: this.bound._databaseError
		});
	},
	_finishFirstRun: function () {
			localStorage["utube.firstRun"] = "true";
			this.$.db.changeVersion("1.0");
			this._updateDatabase_worker();
			//Don't call lookForMoreWork() as that will be handled by _updateDatabase_worker;
	},
	//This function is recursive - after each update it will fire again and look for any more updates
	_updateDatabase_worker: function () {
		var currentDbVersion = this.$.db.getVersion();
		var updated = false;
		
		//Only do one update per loop
		if(currentDbVersion == "1.0" && updated != true) {
			updated = true;
			currentDbVersion = "1.1";
			//NOTE: had to fix glitch with changeVersionWithSchemaFromUrl in onecrayon.Database so the options 
			//are passed and the success and failure callbacks can be executed
			this.$.db.changeVersionWithSchemaFromUrl(currentDbVersion, "schemas/updateSchemaV1.1.json", {
				onSuccess: enyo.bind(this, this._updateDatabase_worker),
				onError: this.bound._databaseError
			});
		}
		
		//If nothing was updated we have made it to the end of the recursion - look for the next item in the queue
		if (updated == false) {
			this.$.workQueue.lookForMoreWork();
		}
	},
	
	/*Start YouTubeEntities code*/
	refreshYouTubeEntities: function () {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._refreshYouTubeEntities_worker));
	},
	_refreshYouTubeEntities_worker: function () {
		if(this.youTubeEntitiesUpdatedCallback !== null) {
			var query = {
					sql: "SELECT " + this.youTubeEntitiesColumns.join(", ") + " FROM youTubeEntities ORDER BY name",
					values: []
				}
			this.$.db.query(query, {
				onSuccess: enyo.bind(this, this._onYouTubeEntityQuerySuccess),
				onError: this.bound._databaseError
			});
		} else {
			this.$.workQueue.lookForMoreWork();
		}
	},
	_onYouTubeEntityQuerySuccess: function(result) {
		try {
			this.currentYouTubeEntities = result;
			for(var i = 0; i < this.currentYouTubeEntities.length; i++) {
				if(this.currentYouTubeEntities[i].uTubeId == "Favorite") {
					//Shift favorite to the beginning
					this.currentYouTubeEntities.unshift(this.currentYouTubeEntities.splice(i,1)[0]);
					break;
				}
			}
			//Call the callback if it exists
			if (this.youTubeEntitiesUpdatedCallback !== null) {
				this.youTubeEntitiesUpdatedCallback(this.currentYouTubeEntities);
			}
		} finally {
			this.$.workQueue.lookForMoreWork();
		}
	},
	insertYouTubeEntity: function (data, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._insertYouTubeEntity_worker, data, callback));
	},
	_insertYouTubeEntity_worker: function (data, callback) {
		var b = this.$.db.getInsert("youTubeEntities", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertYouTubeEntityFinished, data, callback),
			onError: this.bound._databaseError
		});
	},
	_insertYouTubeEntityFinished: function (data, callback) {
		if (Spinn.Utils.exists(callback)) {
			callback(data);
		}
		this._refreshYouTubeEntities_worker();
		//Don't call lookForMoreWork() because that will be handled by the success callback in _refreshYouTubeEntities_worker
	},
	/*getYouTubeEntity: function (id, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._getYouTubeEntity_worker, id, callback));
	},
	_getYouTubeEntity_worker: function (id, callback) {
		var selectCommand = this.$.db.getSelect("youTubeEntities", this.youTubeEntitiesColumns, {
			uTubeId: id
		});
		this.$.db.query(selectCommand, {
			onSuccess: enyo.bind(this, this._getYouTubeEntityFinish, callback),
			onError: this.bound._databaseError
		});
	},
	_getYouTubeEntityFinish: function (callback, a) {
		try {
			if (enyo.isArray(a)) {
				a = a[0];
			}
			callback(a);
		} finally {
			this.$.workQueue.lookForMoreWork();
		}
	},*/
	updateYouTubeEntity: function (id, value, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._updateYouTubeEntity_worker, id, value, callback));
	},
	_updateYouTubeEntity_worker: function (id, value, callback) {
		var sqlCommand = this.$.db.getUpdate("youTubeEntities", value, {
				uTubeId: id
			});
		this.$.db.query(sqlCommand, {
			onSuccess: enyo.bind(this, this._updateYouTubeEntityFinished, id, callback),
			onError: this.bound._databaseError
		});
	},
	_updateYouTubeEntityFinished: function (id, callback) {
		if (id === null) {
			id = this.$.db.lastInsertID();
		}
		if (Spinn.Utils.exists(callback)) {
			callback(id);
		}
		this._refreshYouTubeEntities_worker();
		//Don't call lookForMoreWork() because that will be handled by the success callback in _refreshYouTubeEntities_worker
	},
	deleteYouTubeEntity: function (id, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._deleteYouTubeEntity_worker, id, callback));
	},
	_deleteYouTubeEntity_worker: function (id, callback) {
		var deleteCommand = this.$.db.getDelete("youTubeEntities", {
			uTubeId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteYouTubeEntityFinish, id, callback),
			onError: this.bound._databaseError
		});
	},
	_deleteYouTubeEntityFinish: function (id, callback) {
		if (Spinn.Utils.exists(callback)) {
			callback();
		}
		this._refreshYouTubeEntities_worker();
		//Don't call lookForMoreWork() because that will be handled by the success callback in _refreshYouTubeEntities_worker
	},
	/*End YouTubeEntities code*/
	
	/*Start Favorites code*/
	refreshFavorites: function () {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._refreshFavorites_worker));
	},
	_refreshFavorites_worker: function () {
		if(this.favoritesUpdatedCallback !== null) {
			var query = {
					sql: "SELECT " + this.favoritesColumns.join(", ") + " FROM favorites",
					values: []
				};
			this.$.db.query(query, {
				onSuccess: enyo.bind(this, this._onFavoriteQuerySuccess),
				onError: this.bound._databaseError
			});
		} else {
			this.$.workQueue.lookForMoreWork();
		}
	},
	_onFavoriteQuerySuccess: function(result) {
		try {
			//Call the callback if it exists
			if (this.favoritesUpdatedCallback !== null) {
				this.favoritesUpdatedCallback(result);
			}
		} finally {
			this.$.workQueue.lookForMoreWork();
		}
	},
	insertFavorite: function (data, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._insertFavorite_worker, data, callback));
	},
	_insertFavorite_worker: function (data, callback) {
		var b = this.$.db.getInsert("favorites", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertFavoriteFinished, data, callback),
			onError: this.bound._databaseError
		});
	},
	_insertFavoriteFinished: function (data, callback) {
		if (Spinn.Utils.exists(callback)) {
			callback(data);
		}
		this._refreshFavorites_worker();
		//Don't call lookForMoreWork() because that will be handled by the success callback in _refreshFavorites_worker
	},
	deleteFavorite: function (id, callback) {
		this.$.workQueue.createWorkItem(enyo.bind(this, this._deleteFavorite_worker, id, callback));
	},
	_deleteFavorite_worker: function (id, callback) {
		var deleteCommand = this.$.db.getDelete("favorites", {
			videoId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteFavoriteFinish, id, callback),
			onError: this.bound._databaseError
		});
	},
	_deleteFavoriteFinish: function (id, callback) {
		if (Spinn.Utils.exists(callback)) {
			callback();
		}
		this._refreshFavorites_worker();
		//Don't call lookForMoreWork() because that will be handled by the success callback in _refreshFavorites_worker
	}
	/*End Favorites code*/
});
