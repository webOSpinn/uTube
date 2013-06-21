enyo.kind({
	name: "utube.YouTubeModel",
	kind: enyo.Component,
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
		this.youTubeEntitiesUpdatedCallback = null;
		this.favoritesUpdatedCallback = null;
		this.youTubeEntitiesColumns = ["uTubeId", "name", "entityType", "numVideos"];
		this.favoritesColumns = ["videoId", "title"];
		this.bound = {
			_processWorkQueue: enyo.bind(this, this._processWorkQueue),
			_databaseError: enyo.bind(this, this._databaseError),
			_finishFirstRun: enyo.bind(this, this._finishFirstRun),
			_updateDatabase: enyo.bind(this, this._updateDatabase),
			_lookForMoreWork: enyo.bind(this, this._lookForMoreWork)
		}
	},
	create: function () {
		this.inherited(arguments);
		if (!localStorage["utube.firstRun"]) {
			this._populateDatabase();
		} else {
			this._updateDatabase();
		}
	},
	_processWorkQueue: function() {
		//If we have any work to do
		if(this._workQueue.length > 0) {
			//Grab the next item from the list
			var item = this._workQueue.splice(0,1)[0];
			//http://odetocode.com/Blogs/scott/archive/2007/07/05/function-apply-and-function-call-in-javascript.aspx
			//http://viralpatel.net/blogs/calling-javascript-function-from-string/
			//http://stackoverflow.com/questions/2856059/passing-an-array-as-a-function-parameter-in-javascript
			item.func.apply(this, item.args);
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
	_populateDatabase: function () {
		this._runningQuery = true;
		this.$.db.setSchemaFromURL("schemas/schema.json", {
			onSuccess: this.bound._finishFirstRun,
			onError: this.bound._databaseError
		})
	},
	_finishFirstRun: function () {
		localStorage["utube.firstRun"] = "true";
		this.$.db.changeVersion("1.0");
		this._runningQuery = false;
		this._updateDatabase();
	},
	//This function is recursive - after each update it will fire again and look for anymore updates
	_updateDatabase: function () {
		var currentDbVersion = this.$.db.getVersion();
		var updated = false;
		this._runningQuery = true;
		
		if(currentDbVersion == "1.0") {
			updated = true;
			currentDbVersion = "1.1";
			//NOTE: had to fix glitch with changeVersionWithSchemaFromUrl in onecrayon.Database so the options 
			//are passed and the success and failure callbacks can be executed
			this.$.db.changeVersionWithSchemaFromUrl(currentDbVersion, "schemas/updateSchemaV1.1.json", {
				onSuccess: this.bound._updateDatabase,
				onError: this.bound._databaseError
			})
		}
		
		//When update is false we know that we have hit the end of the recursion - database upgrade is complete
		if(updated == false) {
			this._runningQuery = false;
			this.refreshYouTubeEntities();
		}
	},
	
	/*Start YouTubeEntities code*/
	refreshYouTubeEntities: function () {
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._refreshYouTubeEntities_worker();
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._refreshYouTubeEntities_worker), args: args});
		}
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
	setYouTubeEntitiesUpdatedCallback: function (a) {
		this.youTubeEntitiesUpdatedCallback = a;
	},
	clearYouTubeEntitiesUpdatedCallback: function () {
		this.youTubeEntitiesUpdatedCallback = null;
	},
	insertYouTubeEntity: function (data, callback) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._insertYouTubeEntity_worker(data, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._insertYouTubeEntity_worker), args: args});
		}
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
			this.refreshYouTubeEntities();
			if (Spinn.Utils.exists(callback)) {
				callback(data);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	getYouTubeEntity: function (id, callback) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._getYouTubeEntity_worker(id, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._getYouTubeEntity_worker), args: args});
		}
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
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._updateYouTubeEntity_worker(id, value, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._updateYouTubeEntity_worker), args: args});
		}
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
			this.refreshYouTubeEntities();
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
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._deleteYouTubeEntity_worker(id, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._deleteYouTubeEntity_worker), args: args});
		}
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
			this.refreshYouTubeEntities();
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
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._refreshFavorites_worker();
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._refreshFavorites_worker), args: args});
		}
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
	setFavoritesUpdatedCallback: function (a) {
		this.favoritesUpdatedCallback = a;
	},
	clearFavoritesUpdatedCallback: function () {
		this.favoritesUpdatedCallback = null;
	},
	insertFavorite: function (data, callback) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._insertFavorite_worker(data, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._insertFavorite_worker), args: args});
		}
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
			this.refreshFavorites();
			if (Spinn.Utils.exists(callback)) {
				callback(data);
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	},
	deleteFavorite: function (id, callback) {
		if(!this._runningQuery && this._workQueue.length == 0) {
			this._deleteFavorite_worker(id, callback);
		} else {
			//Convert arguments to a Real Array - http://www.sitepoint.com/arguments-a-javascript-oddity/
			var args = Array.prototype.slice.call(arguments);
			
			this._workQueue.push({func: enyo.bind(this, this._deleteFavorite_worker), args: args});
		}
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
			this.refreshFavorites();
			if (Spinn.Utils.exists(callback)) {
				callback();
			}
		} finally {
			this.bound._lookForMoreWork();
		}
	}
	/*End Favorites code*/
});
