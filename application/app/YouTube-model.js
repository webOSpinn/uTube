enyo.kind({
	name: "utube.YouTubeModel",
	kind: enyo.Component,
	components: [{
		name: "db",
		kind: "onecrayon.Database",
		database: "ext:" + (enyo.g11n.getPlatform() === "device" ? enyo.fetchAppId() : "com.spinn.utube"),
		version: "",
		debug: (enyo.exists(enyo.fetchFrameworkConfig().debuggingEnabled) ? enyo.fetchFrameworkConfig().debuggingEnabled : false)
	}],
	constructor: function () {
		this.inherited(arguments);
		this.currentYouTubeEntity = null;
		this.currentVideos = null;
		this.currentYouTubeEntities = null;
		this.runningQuery = false;
		this.refreshBoth = false;
		this.videosUpdatedCallback = null;
		this.youTubeEntitiesUpdatedCallback = null;
		this.youTubeEntitiesColumns = ["youTubeEntities.entityID", "youTubeEntities.uTubeId", "youTubeEntities.name", "youTubeEntities.entityType"];
		this.videoColumns = ["videos.rowID", "videos.entityID", "videos.videoId", "videos.title", "videos.description"];
		this.bound = {
			finishFirstRun: enyo.bind(this, this.finishFirstRun),
			refreshItems: enyo.bind(this, this.refreshItems),
			refreshVideos: enyo.bind(this, this.refreshVideos),
			refreshYouTubeEntities: enyo.bind(this, this.refreshYouTubeEntities),
			onVideoQuerySuccess: enyo.bind(this, this.onVideoQuerySuccess),
			onYouTubeEntityQuerySuccess: enyo.bind(this, this.onYouTubeEntityQuerySuccess),
			databaseError: enyo.bind(this, this.databaseError)
		}
	},
	create: function () {
		this.inherited(arguments);
		this.currentVersion = "1.0";
		if (!localStorage["utube.firstRun"] && !this.runningQuery) {
			this.populateDatabase()
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
		this.$.db.changeVersion(this.currentVersion);
		this.runningQuery = false;
		this.refreshItems()
	},
	databaseError: function (er) {
		this.refreshBoth = false;
		this.runningQuery = false;
		if (er.code === 1) {
			this.error("Database error (" + er.code + "): " + er.message);
			this.populateDatabase()
		} else {
			this.error("Database error (" + er.code + "): " + er.message)
		}
	},
	refreshItems: function () {
		//Only refresh both if there is a YouTubeEntity selected
		if(enyo.exists(this.currentYouTubeEntity)) {
			this.refreshBoth = true;
		}
		this.refreshYouTubeEntities();
	},
	/*Start Videos code*/
	getAllVideos: function (callback) {
		if (enyo.exists(callback) && !this.runningQuery) {
			try {
				var query = this.getBaseVideoSelect();
				this.runningQuery = true;
				this.$.db.query(query, {
					onSuccess: enyo.bind(this, this.getAllVideosSuccess, callback)
				})
			} catch (ex) {
				this.warn("Exception: " + ex)
			}
		}
	},
	getAllVideosSuccess: function(callback, data) {
		this.runningQuery = false;
		if (enyo.exists(callback)) {
			callback(data);
		}
	},
	refreshVideos: function () {
		if (enyo.exists(this.videosUpdatedCallback) && !this.runningQuery) {
			try {
				var query = this.getVideosSelect();
				this.runningQuery = true;
				this.$.db.query(query, {
					onSuccess: this.bound.onVideoQuerySuccess,
					onError: this.bound.databaseError
				})
			} catch (ex) {
				this.warn("Exception: " + ex)
			}
		}
	},
	getVideosSelect: function () {
		var command = this.getBaseVideoSelect();
		if (this.currentYouTubeEntity !== null) {
			command.sql += "WHERE entityID = '" + this.currentYouTubeEntity.entityID + "' and recDel<>'Y'"
		}
		command.sql += "ORDER BY rowID DESC";
		return command
	},
	getBaseVideoSelect: function () {
		var command = {
			sql: "SELECT " + this.videoColumns.join(", ") + " FROM videos ",
			values: []
		};
		return command;
	},
	onVideoQuerySuccess: function (result) {
		this.currentVideos = result;
		this.runningQuery = false;
		this.refreshBoth = false;
		//Call the callback if it exists
		if (this.videosUpdatedCallback !== null) {
			this.videosUpdatedCallback(this.currentVideos)
		}
	},
	setVideosUpdatedCallback: function (a) {
		this.videosUpdatedCallback = a
	},
	clearVideosUpdatedCallback: function () {
		this.videosUpdatedCallback = null
	},
	insertVideo: function (data, callback) {
		var b = this.$.db.getInsert("videos", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._updateVideoFinished, null, callback)
		})
	},
	getVideo: function (id, callback) {
		var selectCommand = this.$.db.getSelect("videos", this.videoColumns, {
			rowID: id
		});
		this.$.db.query(selectCommand, {
			onSuccess: enyo.bind(this, this.getVideoFinish, callback)
		})
	},
	getVideoFinish: function (callback, a) {
		if (enyo.isArray(a)) {
			a = a[0]
		}
		callback(a)
	},
	updateVideo: function (rowID, value, callback) {
		var sqlCommand = this.$.db.getUpdate("videos", value, {
				rowID: rowID
			})
		this.$.db.query(sqlCommand, {
			onSuccess: enyo.bind(this, this._updateVideoFinished, rowID, callback)
		})
	},
	_updateVideoFinished: function (id, callback) {
		this.refreshItems();
		if (id === null) {
			id = this.$.db.lastInsertID()
		}
		if (enyo.exists(callback)) {
			callback(id)
		}
	},
	deleteVideo: function (id, callBack) {
		//Soft delete video so when it is redownloaded it won't be readded 
		var deleteCommand = {
			sql: "UPDATE videos SET recDel='Y' WHERE rowID=" + id,
			values: []
		};
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteVideoFinish, callBack)
		})
	},
	_deleteVideoFinish: function (callBack) {
		this.refreshItems();
		if (enyo.exists(callBack)) {
			callBack()
		}
	},
	/*End Videos code*/
	
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
				this.warn("Exception: " + ex)
			}
		}
	},
	getYouTubeEntitiesSelect: function (){
		var command = {
			sql: "SELECT " + this.youTubeEntitiesColumns.join(", ") + ", Count(videos.rowID) VidCount FROM youTubeEntities left join videos on youTubeEntities.entityID = videos.entityID GROUP BY " + this.youTubeEntitiesColumns.join(", ") + " ORDER BY youTubeEntities.name",
			values: []
		};
		return command;
	},
	onYouTubeEntityQuerySuccess: function(result) {
		this.currentYouTubeEntities = result;
		this.runningQuery = false;
		//Call the callback if it exists
		if (this.youTubeEntitiesUpdatedCallback !== null) {
			this.youTubeEntitiesUpdatedCallback(this.currentYouTubeEntities)
		}
		if(this.refreshBoth == true) {
			this.refreshVideos();
		}
	},
	setYouTubeEntitiesUpdatedCallback: function (a) {
		this.youTubeEntitiesUpdatedCallback = a
	},
	clearYouTubeEntitiesUpdatedCallback: function () {
		this.youTubeEntitiesUpdatedCallback = null
	},
	insertYouTubeEntity: function (data, callback) {
		var b = this.$.db.getInsert("youTubeEntities", data);
		this.$.db.query(b, {
			onSuccess: enyo.bind(this, this._updateYouTubeEntityFinished, null, callback)
		})
	},
	getYouTubeEntity: function (id, callback) {
		var selectCommand = this.$.db.getSelect("youTubeEntities", this.youTubeEntitiesColumns, {
			entityID: id
		});
		this.$.db.query(selectCommand, {
			onSuccess: enyo.bind(this, this.getYouTubeEntityFinish, callback)
		})
	},
	getYouTubeEntityFinish: function (callback, a) {
		if (enyo.isArray(a)) {
			a = a[0]
		}
		callback(a)
	},
	updateYouTubeEntity: function (entityID, value, callback) {
		var sqlCommand = this.$.db.getUpdate("youTubeEntities", value, {
				entityID: entityID
			})
		this.$.db.query(sqlCommand, {
			onSuccess: enyo.bind(this, this._updateYouTubeEntityFinished, entityID, callback)
		})
	},
	_updateYouTubeEntityFinished: function (id, callback) {
		this.refreshItems();
		if (id === null) {
			id = this.$.db.lastInsertID()
		}
		if (enyo.exists(callback)) {
			callback(id)
		}
	},
	deleteYouTubeEntity: function (id, callBack) {
		var deleteCommand = this.$.db.getDelete("youTubeEntities", {
			entityID: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteChildVideos, id, callBack)
		})
	},
	_deleteChildVideos: function (id, callBack) {
		var deleteCommand = this.$.db.getDelete("videos", {
			entityID: id
		});
		this.$.db.query(deleteCommand, {
			onSuccess: enyo.bind(this, this._deleteYouTubeEntityFinish, callBack)
		})
	},
	_deleteYouTubeEntityFinish: function (callBack) {
		this.refreshItems();
		if (enyo.exists(callBack)) {
			callBack()
		}
	}
	/*End YouTubeEntities code*/
});