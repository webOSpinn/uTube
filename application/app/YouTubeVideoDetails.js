enyo.kind({
	name: "YouTubeVideoDetails",
	kind: enyo.VFlexBox,
	published: {
		dateUploaded: "",
		description: "",
		durationInSeconds: "",
		numDislikes: "",
		numLikes: "",
		numViews: "",
		title: "",
		videoId: ""
	},
	components:[
		{kind: "Spinn.Utils" name: "Utils"},
		{name: "title", content: ""},
		{kind: "HFlexBox", align:"center", pack:"center", components: [
			{kind: "YouTubeViewer", name: "vidViewer", showSuggestedVideos: false, style: "width: 640px; height: 360px;"}
		]},
		{kind: "TimeLine", name: "VideoTimeLine", maximum: 0, onChange: "timeLineChange"},
		{name: "numViews", content: ""},
		{name: "numLikes", content: ""},
		{name: "numDislikes", content: ""},
		{name: "duration", content: ""},
		{name: "dateUploaded", content: ""},
		{name: "description", content: ""}
	],
	create: function() {
		this.inherited(arguments);
		
		this.dateUploadedChanged();
		this.descriptionChanged();
		this.durationInSecondsChanged();
		this.numDislikesChanged();
		this.numLikesChanged();
		this.numViewsChanged();
		this.titleChanged();
		this.videoIdChanged();
	},
	dateUploadedChanged: function() {
		this.$.dateUploaded.setContent("Date Uploaded: " + this.dateUploaded);
	},
	descriptionChanged: function() {
		this.$.description.setContent(this.description);
	},
	durationInSecondsChanged: function() {
		this.$.VideoTimeLine.setPosition(0);
		
		if(this.durationInSeconds == "" ) {
			this.$.VideoTimeLine.setMaximum(0);
			this.$.duration.setContent("Duration: ");
		} else {
			this.$.VideoTimeLine.setMaximum(this.durationInSeconds);
			var time = this.$.Utils.secondsToTime(this.durationInSeconds);
			this.$.duration.setContent("Duration: " + (this.$.Utils.zeroPad(time.h,2) + ":" + this.$.Utils.zeroPad(time.m,2) + ":" + this.$.Utils.zeroPad(time.s,2)));
		}
	},
	numDislikesChanged: function() {
		this.$.numDislikes.setContent("Num Dislikes: " + this.numDislikes);
	},
	numLikesChanged: function() {
		this.$.numLikes.setContent("Num Likes: " + this.numLikes);
	},
	numViewsChanged: function() {
		this.$.numViews.setContent("Num Views: " + this.numViews);
	},
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	videoIdChanged: function() {
		this.$.vidViewer.setVideoId(this.getVideoId());
	},
	getVideoUrl: function() {
		//If no video is selected just go to main YouTube page
		if(this.$.Utils.exists(this.getVideoId())) {
			var time = this.$.VideoTimeLine.getTime();
			return "http://www.youtube.com/watch?v=" + this.getVideoId() + "#t=" + time.h + "h" + time.m + "m" + time.s + "s";
		} else {
			return "http://www.youtube.com/";
		}
	},
	clear: function() {
		this.setDateUploaded("");
		this.setDescription("");
		this.setDurationInSeconds("");
		this.setNumDislikes("");
		this.setNumLikes("");
		this.setNumViews("");
		this.setTitle("");
		this.setVideoId("");
	},
	timeLineChange: function (inSender, position) {
		this.$.vidViewer.setStartTimeInSeconds(position);
	}
})