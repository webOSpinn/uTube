enyo.kind({
	name: "YouTubeApi",
	kind: enyo.Component,
	events: {
	  onGetVideoSuccess: "",
	  onGetVideoCountSuccess: "",
	  onGetVideoDetailsSuccess: "",
	  onFailure: ""
	},
	components: [
		{kind: "Spinn.Utils" name: "Utils"},
		{
			kind: "WebService",
			name: "GetVideosWebService",
			onSuccess: "_GetVideosAnswer",
			onFailure: "_GetVideosFail"
		},
		{
			kind: "WebService",
			name: "GetVideoCountWebService",
			onSuccess: "_GetVideoCountAnswer",
			onFailure: "_GetVideoCountFail"
		},
		{
			kind: "WebService",
			name: "GetVideoDetailsWebService",
			onSuccess: "_GetVideoDetailsAnswer",
			onFailure: "_GetVideoDetailsFail"
		}
	],
	constructor: function () {
		this.inherited(arguments);
		this._getVideosRunning = false;
	},
	getVideosRunning: function() {
		return this._getVideosRunning;
	},
	getVideos: function(userOrChannelOrPlaylistId, entityType, startIndex) {
		this._getVideosRunning = true;
		var url = "";
		
		if(this.$.Utils.exists(startIndex) && this.$.Utils.isInt(startIndex) && startIndex >= 1) {
			this._GetVideos_StartIndex = startIndex;
		} else {
			this._GetVideos_StartIndex = 1;
		}
				
		this._GetVideos_EntityType = entityType;
		this._GetVideos_UserOrChannelOrPlaylistId = userOrChannelOrPlaylistId;
		
		switch(entityType)
		{
			case "User":
			case "Channel":
				url = "http://gdata.youtube.com/feeds/api/users/" + userOrChannelOrPlaylistId + "/uploads?max-results=50&alt=json&start-index=" + startIndex;
				break;
			case "Playlist":
				url = "http://gdata.youtube.com/feeds/api/playlists/" + userOrChannelOrPlaylistId + "?v=2&alt=json&max-results=50&start-index=" + startIndex;
				break;
			default:
		}
		console.log("getVideos: " + url);
		this.$.GetVideosWebService.setUrl(url);
        this.$.GetVideosWebService.call();
	},
	_GetVideosAnswer: function (inSender, inResponse) {
		//Initialize the processed array on the first pass through
		if(this.$.Utils.exists(this._processedVideos) == false) {
			this._processedVideos = new Array();
		}
		
		var tempResults = new Array();
		
		//Get the count of videos
		if(this.$.Utils.exists(inResponse)
			&& this.$.Utils.exists(inResponse.feed)
			&& this.$.Utils.exists(inResponse.feed.openSearch$totalResults)
			&& this.$.Utils.exists(inResponse.feed.openSearch$totalResults.$t)) {
			
			this._GetVideos_VideoCount = inResponse.feed.openSearch$totalResults.$t;
		}
		//If the start index is out of bounds no entries will be returned
		if(this.$.Utils.exists(inResponse)
			&& this.$.Utils.exists(inResponse.feed)
			&& this.$.Utils.exists(inResponse.feed.entry)) {
			//Process the results
			for (var i=0;i<inResponse.feed.entry.length;i++)
			{
				var tempTitle = "ERROR:No Video Title!";
				var tempVideoId = null;
				
				//Extract the video title
				if(this.$.Utils.exists(inResponse.feed.entry[i].title)
					&& this.$.Utils.exists(inResponse.feed.entry[i].title.$t)) {
					tempTitle = inResponse.feed.entry[i].title.$t;
				}
				//Extract the videoId out of the array of links
				for (var j=0;j<inResponse.feed.entry[j].link.length;j++) {
					if(inResponse.feed.entry[i].link[j].rel == "alternate") {
						tempVideoId = inResponse.feed.entry[i].link[j].href.replace('http://www.youtube.com/watch?v=','');
						tempVideoId = tempVideoId.replace('&feature=youtube_gdata','');
						break;
					}
				}
				//Add the processed video to the temp array
				if(this.$.Utils.exists(tempVideoId)) {
					var tempItem = {
						title:tempTitle,
						videoId:tempVideoId
					};
				
					tempResults.push(tempItem);
				}
			}
			//Move the processed videos to the final array
			this._processedVideos = this._processedVideos.concat(tempResults);
			
			//If I have retrieved less than 50 videos I know that I am at the end, otherwise request the next 50 videos
			//if(tempResults.length < 50) {
				try {
					this.doGetVideoSuccess({Videos: this._processedVideos, entity:{uTubeId: this._GetVideos_UserOrChannelOrPlaylistId, numVideos: this._GetVideos_VideoCount}});
				} finally {
					this._CleanupGetVideosVars();
				}
			//} else {
			//	this.getVideos(this._GetVideos_UserOrChannelOrPlaylistId, this._GetVideos_EntityType, (this._GetVideos_StartIndex + 50));
			//}
		} else { //Return empty array
			try {
				this.doGetVideoSuccess({Videos: this._processedVideos, entity: {uTubeId: this._GetVideos_UserOrChannelOrPlaylistId, numVideos: 0}});
			} finally {
				this._CleanupGetVideosVars();
			}
		}
    },
	_GetVideosFail: function (inSender, inResponse) {
		try {
			this.doFailure({response: inResponse, source: "GetVideoFail"});
		} finally {
			this._CleanupGetVideosVars();
		}
	},
	_CleanupGetVideosVars: function() {
		this._processedVideos = null;
		this._GetVideos_EntityType = null;
		this._GetVideos_StartIndex = null;
		this._GetVideos_UserOrChannelOrPlaylistId = null;
		this._GetVideos_VideoCount = null;
		this._getVideosRunning = false;
	},
	getVideoCount: function (userOrChannelOrPlaylistId, entityType) {
		var url = "";
		
		this._GetVideoCount_UserOrChannelOrPlaylistId = userOrChannelOrPlaylistId;
		
		switch(entityType)
		{
			case "User":
			case "Channel":
				url = "http://gdata.youtube.com/feeds/api/users/" + userOrChannelOrPlaylistId + "/uploads?max-results=0&alt=json";
				break;
			case "Playlist":
				url = "http://gdata.youtube.com/feeds/api/playlists/" + userOrChannelOrPlaylistId + "?v=2&alt=json&max-results=0&";
				break;
			default:
		}
		console.log("getVideoCount: " + url);
		this.$.GetVideoCountWebService.setUrl(url);
        this.$.GetVideoCountWebService.call();
	},
	_GetVideoCountAnswer: function (inSender, inResponse) {
		try {
			if(this.$.Utils.exists(inResponse)
				&& this.$.Utils.exists(inResponse.feed)
				&& this.$.Utils.exists(inResponse.feed.openSearch$totalResults)
				&& this.$.Utils.exists(inResponse.feed.openSearch$totalResults.$t)) {
				
				this.doGetVideoCountSuccess({uTubeId: this._GetVideoCount_UserOrChannelOrPlaylistId, numVideos: inResponse.feed.openSearch$totalResults.$t});
			} else {
				this.doGetVideoCountSuccess({uTubeId: this._GetVideoCount_UserOrChannelOrPlaylistId, numVideos: -1});
			}
		} finally {
			this._CleanupGetVideoCountVars();
		}
	},
	_GetVideoCountFail: function (inSender, inResponse) {
		try {
			this.doFailure({response: inResponse, source: "GetVideoCountFail"});
		} finally {
			this._CleanupGetVideoCountVars();
		}		
	},
	_CleanupGetVideoCountVars: function() {
		this._GetVideoCount_UserOrChannelOrPlaylistId = null;
	},
	getVideoDetails: function (userOrChannelOrPlaylistId) {
		var url = "https://gdata.youtube.com/feeds/api/videos/" + userOrChannelOrPlaylistId + "?v=2&alt=json";
		
		this._GetVideoDetails_UserOrChannelOrPlaylistId = userOrChannelOrPlaylistId;
		
		console.log("getVideoDetails: " + url);
		this.$.GetVideoDetailsWebService.setUrl(url);
        this.$.GetVideoDetailsWebService.call();
	},
	_GetVideoDetailsAnswer: function (inSender, inResponse) {
		try {
			//If the start index is out of bounds no entries will be returned
			if(this.$.Utils.exists(inResponse)
				&& this.$.Utils.exists(inResponse.entry)) {
				
				var videoDetails = new Object();
				
				//Extract the video title
				if(this.$.Utils.exists(inResponse.entry.title)
					&& this.$.Utils.exists(inResponse.entry.title.$t)) {
					videoDetails.Title = inResponse.entry.title.$t;
				}
				
				if(this.$.Utils.exists(inResponse.entry.media$group)) {
					//Extract the description
					if(this.$.Utils.exists(inResponse.entry.media$group.media$description)
						&& this.$.Utils.exists(inResponse.entry.media$group.media$description.$t)) {
						videoDetails.Description = inResponse.entry.media$group.media$description.$t;
					}
					
					//Extract the duration (in seconds)
					if(this.$.Utils.exists(inResponse.entry.media$group.yt$duration)
						&& this.$.Utils.exists(inResponse.entry.media$group.yt$duration.seconds)) {
						videoDetails.Duration = inResponse.entry.media$group.yt$duration.seconds;
					}
					
					//Extract the date uploaded
					if(this.$.Utils.exists(inResponse.entry.media$group.yt$uploaded)
						&& this.$.Utils.exists(inResponse.entry.media$group.yt$uploaded.$t)) {
						videoDetails.DateUploaded = inResponse.entry.media$group.yt$uploaded.$t;
					}
				}
				
				//Extract number of views
				if(this.$.Utils.exists(inResponse.entry.yt$statistics)
					&& this.$.Utils.exists(inResponse.entry.yt$statistics.viewCount)) {
					videoDetails.NumViews = inResponse.entry.yt$statistics.viewCount;
				}
				
				if(this.$.Utils.exists(inResponse.entry.yt$rating)) {
					//Extract num likes
					if(this.$.Utils.exists(inResponse.entry.yt$rating.numLikes)) {
						videoDetails.NumLikes = inResponse.entry.yt$rating.numLikes;
					}
					
					//Extract num dislikes
					if(this.$.Utils.exists(inResponse.entry.yt$rating.numDislikes)) {
						videoDetails.NumDislikes = inResponse.entry.yt$rating.numDislikes;
					}
				}

				this.doGetVideoDetailsSuccess({videoDetails: videoDetails, uTubeId: this._GetVideoDetails_UserOrChannelOrPlaylistId});
			}else{ //Return empty results
				this.doGetVideoDetailsSuccess({videoDetails: null, uTubeId: this._GetVideoDetails_UserOrChannelOrPlaylistId});
			}
		} finally {
			this._CleanupGetVideoDetailsVars();
		}
	},
	_GetVideoDetailsFail: function (inSender, inResponse) {
		try {
			this.doFailure({response: inResponse, source: "GetVideoDetailsFail"});
		} finally {
			this._CleanupGetVideoDetailsVars();
		}
	},
	_CleanupGetVideoDetailsVars: function() {
		this._GetVideoDetails_UserOrChannelOrPlaylistId = null;
	},
});