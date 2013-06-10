enyo.kind({
	name: "YouTubeViewer",
	kind: enyo.Control,
	published: {
		https: false,
		privacyEnhancedMode: false,
		showSuggestedVideos: true,
		videoId: "",
		startTimeInSeconds: 0
	},
	components:[
		{
			kind: "WebView",
			name: "WV",
			style: "width: 100%; height: 100%;"
		}
	],
	create: function() {
		this.inherited(arguments);
	},
	httpsChanged: function() {
		this.renderVideo();
	},
	privacyEnhancedModeChanged: function() {
		this.renderVideo();
	},
	showSuggestedVideosChanged: function() {
		this.renderVideo();
	},
	videoIdChanged: function() {
		this.startTimeInSeconds = 0; //Reset the start time for a new video
		this.renderVideo();
	},
	startTimeInSecondsChanged: function() {
		this.renderVideo();
		//This reload must be here to get the time to take
		//If this is added in renderVideo() switching videos no longer works
		try { this.$.WV.reloadPage(); } catch (err) { }
	},
	renderVideo: function() {
		var vidUrl = ''
		//Make sure that there is a video ID supplied
		if(Spinn.Utils.exists(this.videoId) 
			&& (enyo.string.trim(this.videoId) != "")) {
			
			vidUrl = 'http';
			if(this.https == true){
				vidUrl = vidUrl + 's';
			}
			vidUrl = vidUrl + '://www.youtube';
			if(this.privacyEnhancedMode == true){
				vidUrl = vidUrl + '-nocookie';
			}
			vidUrl = vidUrl + '.com/embed/' + this.getVideoId()
			if(this.showSuggestedVideos == false){
				vidUrl = vidUrl + '?rel=0'
			}
			if(Spinn.Utils.exists(this.startTimeInSeconds) 
				&& Spinn.Utils.isInt(this.startTimeInSeconds)
				&& this.startTimeInSeconds > 0) {
				vidUrl = vidUrl + '#t=' + this.startTimeInSeconds + 's'
			}
		}
		console.log("YouTubeViewer URL: " + vidUrl);
		this.$.WV.setUrl(vidUrl);
	}
})