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
		this.currentYouTubeEntity = null;
		this.currentYouTubeEntities = null;
		this.runningQuery = false;
		this.youTubeEntitiesUpdatedCallback = null;
		this.favoritesUpdatedCallback = null;
		this.youTubeEntitiesColumns = ["uTubeId", "name", "entityType", "numVideos"];
		this.favoritesColumns = ["videoId", "title"];
		this.bound = {
			finishFirstRun: enyo.bind(this, this.finishFirstRun),
			refreshYouTubeEntities: enyo.bind(this, this.refreshYouTubeEntities),
			onYouTubeEntityQuerySuccess: enyo.bind(this, this.onYouTubeEntityQuerySuccess),
			databaseError: enyo.bind(this, this.databaseError),
			onFavoriteQuerySuccess: enyo.bind(this, this.onFavoriteQuerySuccess)
		}
	},
	create: function () {
		this.inherited(arguments);
		if (!localStorage["utube.firstRun"] && !this.runningQuery) {
			this.populateDatabase();
		} else {
			this.updateDatabase();
		}
	},
	populateDatabase: function () {
		this.runningQuery = true;
		this.$.db.setSchemaFromURL("schemas/schema.json", {
			onSuccess: this.bound.finishFirstRun
		})
	},
	finishFirstRun: function () {
		localStorage["utube.firstRun"] = "true";
		this.$.db.changeVersion("1.0");
		this.runningQuery = false;
		this.updateDatabase();
	},
	updateDatabase: function () {
		var currentDbVersion = this.$.db.getVersion();
		this.runningQuery = true;
		
		if(currentDbVersion == "1.0") {
			currentDbVersion = "1.1";
			this.$.db.changeVersionWithSchemaFromUrl(currentDbVersion, "schemas/updateSchemaV1.1.json");
		}
		
		this.runningQuery = false;
		this.refreshYouTubeEntities();
	},
	databaseError: function (er) {
		this.runningQuery = false;
		if (er.code === 1) {
			this.error("Database error (" + er.code + "): " + er.message);
			this.populateDatabase();
		} else {
			this.error("Database error (" + er.code + "): " + er.message);
		}
	},
	
	/*Start YouTubeEntities code*/
	refreshYouTubeEntities: function () {
		if(this.youTubeEntitiesUpdatedCallback !== null && !this.runningQuery) {
			try{
				var query = this.getYouTubeEntitiesSelect();
				this.runningQuery = true;
				this.$.db.query(query, {
					onSuccess: this.bound.onYouTubeEntityQuerySuccess,
					onError: this.bound.databaseError
				})
			} catch (ex) {
				this.warn("Exception: " + ex);
			}
		}
	},
	getYouTubeEntitiesSelect: function (){
		var command = {
			sql: "SELECT " + this.youTubeEntitiesColumns.join(", ") + " FROM youTubeEntities ORDER BY name",
			values: []
		};
		return command;
	},
	onYouTubeEntityQuerySuccess: function(result) {
		this.runningQuery = false;
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
	},
	setYouTubeEntitiesUpdatedCallback: function (a) {
		this.youTubeEntitiesUpdatedCallback = a;
	},
	clearYouTubeEntitiesUpdatedCallback: function () {
		this.youTubeEntitiesUpdatedCallback = null;
	},
	insertYouTubeEntity: function (data, callback) {
		var b = this.$.db.getInsert("youTubeEntities", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertYouTubeEntityFinished, data, callback)
		})
	},
	_insertYouTubeEntityFinished: function (data, callback) {
		this.refreshYouTubeEntities();
		if (Spinn.Utils.exists(callback)) {
			callback(data);
		}
	},
	getYouTubeEntity: function (id, callback) {
		var selectCommand = this.$.db.getSelect("youTubeEntities", this.youTubeEntitiesColumns, {
			uTubeId: id
		});
		this.$.db.query(selectCommand, {
			onSuccess: enyo.bind(this, this._getYouTubeEntityFinish, callback)
		})
	},
	_getYouTubeEntityFinish: function (callback, a) {
		if (enyo.isArray(a)) {
			a = a[0];
		}
		callback(a);
	},
	updateYouTubeEntity: function (id, value, callback) {
		var sqlCommand = this.$.db.getUpdate("youTubeEntities", value, {
				uTubeId: id
			})
		this.$.db.query(sqlCommand, {
			onSuccess: enyo.bind(this, this._updateYouTubeEntityFinished, id, callback)
		})
	},
	_updateYouTubeEntityFinished: function (id, callback) {
		this.refreshYouTubeEntities();
		if (id === null) {
			id = this.$.db.lastInsertID();
		}
		if (Spinn.Utils.exists(callback)) {
			callback(id);
		}
	},
	deleteYouTubeEntity: function (id, callBack) {
		var deleteCommand = this.$.db.getDelete("youTubeEntities", {
			uTubeId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteYouTubeEntityFinish, id, callBack)
		})
	},
	_deleteYouTubeEntityFinish: function (id, callBack) {
		this.refreshYouTubeEntities();
		if (Spinn.Utils.exists(callBack)) {
			callBack();
		}
	},
	/*End YouTubeEntities code*/
	
	/*Start Favorites code*/
	refreshFavorites: function () {
		if(this.favoritesUpdatedCallback !== null && !this.runningQuery) {
			try{
				var query = this.getFavoritesSelect();
				this.runningQuery = true;
				this.$.db.query(query, {
					onSuccess: this.bound.onFavoriteQuerySuccess,
					onError: this.bound.databaseError
				})
			} catch (ex) {
				this.warn("Exception: " + ex);
			}
		}
	},
	getFavoritesSelect: function (){
		var command = {
			sql: "SELECT " + this.favoritesColumns.join(", ") + " FROM favorites",
			values: []
		};
		return command;
	},
	onFavoriteQuerySuccess: function(result) {
		this.runningQuery = false;
		//Call the callback if it exists
		if (this.favoritesUpdatedCallback !== null) {
			this.favoritesUpdatedCallback(result);
		}
	},
	setFavoritesUpdatedCallback: function (a) {
		this.favoritesUpdatedCallback = a;
	},
	clearFavoritesUpdatedCallback: function () {
		this.favoritesUpdatedCallback = null;
	},
	insertFavorite: function (data, callback) {
		var b = this.$.db.getInsert("favorites", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._insertFavoriteFinished, data, callback)
		})
	},
	_insertFavoriteFinished: function (data, callback) {
		this.refreshFavorites();
		if (Spinn.Utils.exists(callback)) {
			callback(data);
		}
	},
	deleteFavorite: function (id, callBack) {
		var deleteCommand = this.$.db.getDelete("favorites", {
			videoId: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteFavoriteFinish, id, callBack)
		})
	},
	_deleteFavoriteFinish: function (id, callBack) {
		this.refreshFavorites();
		if (Spinn.Utils.exists(callBack)) {
			callBack();
		}
	}
	/*End Favorites code*/
});