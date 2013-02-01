enyo.kind({
	name: "YouTubeVideoDetails",
	kind: enyo.VFlexBox,
	published: {
		dateUploaded: "",
		description: "",
		duration: "",
		numDislikes: "",
		numLikes: "",
		numViews: "",
		title: "",
		videoId: ""
	},
	components:[
		{name: "title", content: ""},
		{kind: "HFlexBox", align:"center", pack:"center", components: [
			{kind: "YouTubeViewer", name: "vidViewer", showSuggestedVideos: false, style: "width: 640px; height: 360px;"}
		]},
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
		this.durationChanged();
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
	durationChanged: function() {
		this.$.duration.setContent("Duration: " + this.duration);
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
	clear: function() {
		this.$.dateUploaded.setContent("");
		this.$.description.setContent("");
		this.$.duration.setContent("");
		this.$.numDislikes.setContent("");
		this.$.numLikes.setContent("");
		this.$.numViews.setContent("");
		this.$.title.setContent("");
	}
})