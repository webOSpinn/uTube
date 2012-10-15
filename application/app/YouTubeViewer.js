enyo.kind({
	name: "YouTubeViewer",
	kind: enyo.Control,
	published: {
		https: false,
		privacyEnhancedMode: false,
		showSuggestedVideos: true,
		videoHeight: 315,
		videoName: "",
		videoWidth: 560
	},
	components: [
		{name: "videoContent", kind: "HtmlContent", allowHtml: true, content: "", onLinkClick: "htmlContentLinkClick", flex:1}
	],
	rendered: function() {
		this.checkHeight();
		this.checkWidth();
		this.renderVideo();
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
	videoHeightChanged: function() {
		this.checkHeight();
		this.renderVideo();
	},
	videoNameChanged: function() {
		this.renderVideo();
	},
	videoWidthChanged: function() {
		this.checkWidth();
		this.renderVideo();
	},
	checkHeight: function() {
		var defaultVal = 315;
		if (enyo.isInt(this.videoHeight)) {
			if(this.videoHeight < 0){
				this.videoHeight = defaultVal;
			}
		}else{
			this.videoHeight = defaultVal;
		}
	},
	checkWidth: function(){
		var defaultVal = 560;
		if (enyo.isInt(this.videoWidth)) {
			if(this.videoWidth < 0){
				this.videoWidth = defaultVal;
			}
		}else{
			this.videoWidth = defaultVal;
		}
	},
	renderVideo: function() {
		var content = ''
		
		//Make sure that there is a video name supplied
		if(enyo.exists(this.videoName)) {
			var temp = enyo.string.trim(this.videoName);
			if(temp != "") {
				content = '<iframe width="' + this.videoWidth + '" height="' + this.videoHeight + '" src="http';
				if(this.https == true){
					content = content + 's';
				}
				content = content + '://www.youtube';
				if(this.privacyEnhancedMode == true){
					content = content + '-nocookie';
				}
				content = content + '.com/embed/' + this.getVideoName()
				if(this.showSuggestedVideos == false){
					content = content + '?rel=0'
				}
				content = content + '" frameborder="0" allowfullscreen></iframe>';
			}
		}
		this.$.videoContent.setContent(content);
	},
	htmlContentLinkClick: function(inSender, inUrl) { /* do nothing when the link is clicked. */ }
});