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
		}
	],
	constructor: function () {
		this.inherited(arguments);
		this._workQueue = [];
		this.currentYouTubeEntity = null;
		this.currentYouTubeEntities = null;
		this._runningQuery = false;
		this.youTubeEntitiesColumns = ["uTubeId", "name", "entityType", "numVideos"];
		this.favoritesColumns = ["videoId", "title"];
		this.bound = {
			_processWorkQueue: enyo.bind(this, this._processWorkQueue),
			_databaseError: enyo.bind(this, this._databaseError),
			_lookForMoreWork: enyo.bind(this, this._lookForMoreWork)
		}
	},
	create: function () {
		this.inherited(arguments);
		if (!localStorage["utube.firstRun"]) {
			this._createWorkItemAtStart(enyo.bind(this, this._populateDatabase_worker));
		} else {
			this._createWorkItemAtStart(enyo.bind(this, this._updateDatabase_worker));
		}
	},
	_createWorkItem: function(workItem) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			workItem();
		} else {
			this._workQueue.push(workItem);
		}
	},
	_createWorkItemAtStart: function(workItem) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			workItem();
		} else {
			this._workQueue.splice(0,0,workItem);
		}
	},
	_processWorkQueue: function() {
		//If we have any work to do
		if(this._workQueue.length > 0) {
			//Grab the next item from the list
			var workItem = this._workQueue.splice(0,1)[0];
			workItem();
		}
	},
	_lookForMoreWork: function () {
		this._runningQuery = false;
		//Process next item in the queue
		if(this._workQueue.length > 0) {
			this.bound._processWorkQueue();
		}
	},
	_databaseError: function (er) {
		try {
			if (er.code === 1) {
				this.error("Database error (" + er.code + "): " + er.message);
				this.populateDatabase();
			} else {
				this.error("Database error (" + er.code + "): " + er.message);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	_populateDatabase_worker: function () {
		this._runningQuery = true;
		this.$.db.setSchemaFromURL("schemas/schema.json", {
			onSuccess: enyo.bind(this, this._finishFirstRun),
			onError: this.bound._databaseError
		})
	},
	_finishFirstRun: function () {
		try {
			localStorage["utube.firstRun"] = "true";
			this.$.db.changeVersion("1.0");
			this._createWorkItemAtStart(enyo.bind(this, this._updateDatabase_worker));
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	//This function is recursive - after each update it will fire again and look for anymore updates
	_updateDatabase_worker: function () {
		try {
			var currentDbVersion = this.$.db.getVersion();
			var updated = false;
			this._runningQuery = true;
			
			//Only do one update per loop
			if(currentDbVersion == "1.0" && updated != true) {
				updated = true;
				currentDbVersion = "1.1";
				//NOTE: had to fix glitch with changeVersionWithSchemaFromUrl in onecrayon.Database so the options 
				//are passed and the success and failure callbacks can be executed
				this.$.db.changeVersionWithSchemaFromUrl(currentDbVersion, "schemas/updateSchemaV1.1.json", {
					onSuccess: enyo.bind(this, this._createWorkItemAtStart, enyo.bind(this, this._updateDatabase_worker)),
					onError: this.bound._databaseError
				})
			}

		} finally {
			this.bound._lookForMoreWork();
		}
	},
	
	/*Start YouTubeEntities code*/
	refreshYouTubeEntities: function () {
		this._createWorkItem(enyo.bind(this, this._refreshYouTubeEntities_worker));
	},
	_refreshYouTubeEntities_worker: function () {
		if(this.youTubeEntitiesUpdatedCallback !== null) {
			try{
				this._runningQuery = true;
				var query = {
						sql: "SELECT " + this.youTubeEntitiesColumns.join(", ") + " FROM youTubeEntities ORDER BY name",
						values: []
					}
				this.$.db.query(query, {
					onSuccess: enyo.bind(this, this._onYouTubeEntityQuerySuccess),
					onError: this.bound._databaseError
				})
			} catch (ex) {
				this.warn("Exception: " + ex);
			}
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
			this.bound._lookForMoreWork();
		}
	},
	insertYouTubeEntity: function (data, callback) {
		this._createWorkItem(enyo.bind(this, this._insertYouTubeEntity_worker, data, callback));
	},
	_insertYouTubeEntity_worker: function (data, callback) {
		this._runningQuery = true;
		var b = this.$.db.getInsert("youTubeEntities", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertYouTubeEntityFinished, data, callback),
			onError: this.bound._databaseError
		})
	},
	_insertYouTubeEntityFinished: function (data, callback) {
		try {
			this._createWorkItemAtStart(enyo.bind(this, this._refreshYouTubeEntities_worker));
			if (Spinn.Utils.exists(callback)) {
				callback(data);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	getYouTubeEntity: function (id, callback) {
		this._createWorkItem(enyo.bind(this, this._getYouTubeEntity_worker, id, callback));
	},
	_getYouTubeEntity_worker: function (id, callback) {
		this._runningQuery = true;
		var selectCommand = this.$.db.getSelect("youTubeEntities", this.youTubeEntitiesColumns, {
			uTubeId: id
		});
		this.$.db.query(selectCommand, {
			onSuccess: enyo.bind(this, this._getYouTubeEntityFinish, callback),
			onError: this.bound._databaseError
		})
	},
	_getYouTubeEntityFinish: function (callback, a) {
		try {
			if (enyo.isArray(a)) {
				a = a[0];
			}
			callback(a);
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	updateYouTubeEntity: function (id, value, callback) {
		this._createWorkItem(enyo.bind(this, this._updateYouTubeEntity_worker, id, value, callback));
	},
	_updateYouTubeEntity_worker: function (id, value, callback) {
		this._runningQuery = true;
		var sqlCommand = this.$.db.getUpdate("youTubeEntities", value, {
				uTubeId: id
			})
		this.$.db.query(sqlCommand, {
			onSuccess: enyo.bind(this, this._updateYouTubeEntityFinished, id, callback),
			onError: this.bound._databaseError
		})
	},
	_updateYouTubeEntityFinished: function (id, callback) {
		try {
			this._createWorkItemAtStart(enyo.bind(this, this._refreshYouTubeEntities_worker));
			if (id === null) {
				id = this.$.db.lastInsertID();
			}
			if (Spinn.Utils.exists(callback)) {
				callback(id);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	deleteYouTubeEntity: function (id, callback) {
		this._createWorkItem(enyo.bind(this, this._deleteYouTubeEntity_worker, id, callback));
	},
	_deleteYouTubeEntity_worker: function (id, callback) {
		this._runningQuery = true;
		var deleteCommand = this.$.db.getDelete("youTubeEntities", {
			uTubeId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteYouTubeEntityFinish, id, callback),
			onError: this.bound._databaseError
		})
	},
	_deleteYouTubeEntityFinish: function (id, callback) {
		try {
			this._createWorkItemAtStart(enyo.bind(this, this._refreshYouTubeEntities_worker));
			if (Spinn.Utils.exists(callback)) {
				callback();
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	/*End YouTubeEntities code*/
	
	/*Start Favorites code*/
	refreshFavorites: function () {
		this._createWorkItem(enyo.bind(this, this._refreshFavorites_worker));
	},
	_refreshFavorites_worker: function () {
		if(this.favoritesUpdatedCallback !== null) {
			try{
				this._runningQuery = true;
				var query = {
						sql: "SELECT " + this.favoritesColumns.join(", ") + " FROM favorites",
						values: []
					};
				this.$.db.query(query, {
					onSuccess: enyo.bind(this, this._onFavoriteQuerySuccess),
					onError: this.bound._databaseError
				})
			} catch (ex) {
				this.warn("Exception: " + ex);
			}
		}
	},
	_onFavoriteQuerySuccess: function(result) {
		try {
			//Call the callback if it exists
			if (this.favoritesUpdatedCallback !== null) {
				this.favoritesUpdatedCallback(result);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	insertFavorite: function (data, callback) {
		this._createWorkItem(enyo.bind(this, this._insertFavorite_worker, data, callback));
	},
	_insertFavorite_worker: function (data, callback) {
		this._runningQuery = true;
		var b = this.$.db.getInsert("favorites", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertFavoriteFinished, data, callback),
			onError: this.bound._databaseError
		})
	},
	_insertFavoriteFinished: function (data, callback) {
		try {
			this._createWorkItemAtStart(enyo.bind(this, this._refreshFavorites_worker));
			if (Spinn.Utils.exists(callback)) {
				callback(data);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	deleteFavorite: function (id, callback) {
		this._createWorkItem(enyo.bind(this, this._deleteFavorite_worker, id, callback));
	},
	_deleteFavorite_worker: function (id, callback) {
		this._runningQuery = true;
		var deleteCommand = this.$.db.getDelete("favorites", {
			videoId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteFavoriteFinish, id, callback),
			onError: this.bound._databaseError
		})
	},
	_deleteFavoriteFinish: function (id, callback) {
		try {
			this._createWorkItemAtStart(enyo.bind(this, this._refreshFavorites_worker));
			if (Spinn.Utils.exists(callback)) {
				callback();
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	}
	/*End Favorites code*/
});
