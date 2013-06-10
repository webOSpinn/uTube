enyo.kind({
	name: "YouTubeApiV2",
	kind: enyo.Component,
	events: {
	  onGetVideoSuccess: "",
	  onGetVideoCountSuccess: "",
	  onGetVideoDetailsSuccess: "",
	  onFailure: ""
	},
	components: [
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
		try {
			var tempResults = new Array();
			var videosCount = 0;
			
			//Get the count of videos
			if(Spinn.Utils.exists(inResponse)
				&& Spinn.Utils.exists(inResponse.feed)
				&& Spinn.Utils.exists(inResponse.feed.openSearch$totalResults)
				&& Spinn.Utils.exists(inResponse.feed.openSearch$totalResults.$t)) {
				
				videosCount = inResponse.feed.openSearch$totalResults.$t;
			}
			//If the start index is out of bounds no entries will be returned
			if(Spinn.Utils.exists(inResponse)
				&& Spinn.Utils.exists(inResponse.feed)
				&& Spinn.Utils.exists(inResponse.feed.entry)) {
				//Process the results
				for (var i=0;i<inResponse.feed.entry.length;i++)
				{
					var tempTitle = "ERROR:No Video Title!";
					var tempVideoId = null;
					
					//Extract the video title
					if(Spinn.Utils.exists(inResponse.feed.entry[i].title)
						&& Spinn.Utils.exists(inResponse.feed.entry[i].title.$t)) {
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
					if(Spinn.Utils.exists(tempVideoId)) {
						var tempItem = {
							title:tempTitle,
							videoId:tempVideoId
						};
					
						tempResults.push(tempItem);
					}
				}
				
				this.doGetVideoSuccess({Videos: tempResults, entity:{uTubeId: this._GetVideos_UserOrChannelOrPlaylistId, numVideos: videosCount}});
			} else { //Return empty array
				this.doGetVideoSuccess({Videos: tempResults, entity: {uTubeId: this._GetVideos_UserOrChannelOrPlaylistId, numVideos: 0}});
			}
		} finally {
			this._CleanupGetVideosVars();
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
		this._GetVideos_UserOrChannelOrPlaylistId = null;
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
			if(Spinn.Utils.exists(inResponse)
				&& Spinn.Utils.exists(inResponse.feed)
				&& Spinn.Utils.exists(inResponse.feed.openSearch$totalResults)
				&& Spinn.Utils.exists(inResponse.feed.openSearch$totalResults.$t)) {
				
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
			if(Spinn.Utils.exists(inResponse)
				&& Spinn.Utils.exists(inResponse.entry)) {
				
				var videoDetails = new Object();
				
				//Extract the video title
				if(Spinn.Utils.exists(inResponse.entry.title)
					&& Spinn.Utils.exists(inResponse.entry.title.$t)) {
					videoDetails.Title = inResponse.entry.title.$t;
				}
				
				if(Spinn.Utils.exists(inResponse.entry.media$group)) {
					//Extract the description
					if(Spinn.Utils.exists(inResponse.entry.media$group.media$description)
						&& Spinn.Utils.exists(inResponse.entry.media$group.media$description.$t)) {
						videoDetails.Description = inResponse.entry.media$group.media$description.$t;
					}
					
					//Extract the duration (in seconds)
					if(Spinn.Utils.exists(inResponse.entry.media$group.yt$duration)
						&& Spinn.Utils.exists(inResponse.entry.media$group.yt$duration.seconds)) {
						videoDetails.Duration = inResponse.entry.media$group.yt$duration.seconds;
					}
					
					//Extract the date uploaded
					if(Spinn.Utils.exists(inResponse.entry.media$group.yt$uploaded)
						&& Spinn.Utils.exists(inResponse.entry.media$group.yt$uploaded.$t)) {
						videoDetails.DateUploaded = inResponse.entry.media$group.yt$uploaded.$t;
					}
				}
				
				//Extract number of views
				if(Spinn.Utils.exists(inResponse.entry.yt$statistics)
					&& Spinn.Utils.exists(inResponse.entry.yt$statistics.viewCount)) {
					videoDetails.NumViews = inResponse.entry.yt$statistics.viewCount;
				}
				
				if(Spinn.Utils.exists(inResponse.entry.yt$rating)) {
					//Extract num likes
					if(Spinn.Utils.exists(inResponse.entry.yt$rating.numLikes)) {
						videoDetails.NumLikes = inResponse.entry.yt$rating.numLikes;
					}
					
					//Extract num dislikes
					if(Spinn.Utils.exists(inResponse.entry.yt$rating.numDislikes)) {
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