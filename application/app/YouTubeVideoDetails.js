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
		{name: "title", content: ""},
		{kind: "HFlexBox", align:"center", pack:"center", components: [
			{kind: "YouTubeViewer", name: "vidViewer", showSuggestedVideos: false, style: "width: 640px; height: 360px;"}
		]},
		{name: "VideoTimeLine", kind: "TimeLine", maximum: 0, onChange: "timeLineChange"},
		{kind: "RowGroup", components: [
			{kind: "HFlexBox", components: [
				{name: "numViews", kind: "Spinn.IconLabel", iconSrc: "images/eye.png", caption: "", style: "width:50%;"},
				{name: "likeDislike", kind: "HFlexBox", align:"center", pack:"left", style: "width:50%;", components: [
					{name: "numLikes", kind: "Spinn.IconLabel", iconSrc: "images/thumbs-up.png", caption: ""},
					{name: "numDislikes", kind: "Spinn.IconLabel", iconSrc: "images/thumbs-down.png", caption: ""}
				]}
			]},
			{kind: "HFlexBox", components: [
				{name: "duration", kind: "Spinn.IconLabel", iconSrc: "images/clock.png", caption: "", style: "width:50%;", },
				{name: "dateUploaded", kind: "Spinn.IconLabel", iconSrc: "images/calendar.png", caption: "", style: "width:50%;", }
			]}
		]},
		{kind: "RowGroup", name: "descriptionHeader", caption: "Description: ", components: [
			{name: "description", content: ""}
		]}
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
		if(Spinn.Utils.exists(this.dateUploaded)
			&& enyo.string.trim(this.dateUploaded) != "") {
			var tempDate = new Date(this.dateUploaded);
			var tempDateString = tempDate.toDateString();
			
			if(tempDate.getHours() > 12) {
				tempDateString = tempDateString + " " + (tempDate.getHours() - 12) + ":" + tempDate.getMinutes() + ":" + tempDate.getSeconds() + " PM";
			} else {
				tempDateString = tempDateString + " " + tempDate.getHours() + ":" + tempDate.getMinutes() + ":" + tempDate.getSeconds() + " AM";
			}
			
			this.$.dateUploaded.setCaption(tempDateString);
		} else {
			this.$.dateUploaded.setCaption("");
		}
	},
	descriptionChanged: function() {
		this.$.description.setContent(this.description);
	},
	durationInSecondsChanged: function() {
		this.$.VideoTimeLine.setPosition(0);
		
		if(this.durationInSeconds == "" ) {
			this.$.VideoTimeLine.setMaximum(0);
			this.$.duration.setCaption("");
		} else {
			this.$.VideoTimeLine.setMaximum(this.durationInSeconds);
			var time = Spinn.Utils.secondsToTime(this.durationInSeconds);
			this.$.duration.setCaption(Spinn.Utils.zeroPad(time.h,2) + ":" + Spinn.Utils.zeroPad(time.m,2) + ":" + Spinn.Utils.zeroPad(time.s,2));
		}
	},
	numDislikesChanged: function() {
		this.$.numDislikes.setCaption(this.numDislikes);
	},
	numLikesChanged: function() {
		this.$.numLikes.setCaption(this.numLikes);
	},
	numViewsChanged: function() {
		this.$.numViews.setCaption(this.numViews);
	},
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	videoIdChanged: function() {
		this.$.vidViewer.setVideoId(this.getVideoId());
	},
	getVideoUrl: function() {
		var videoID = this.getVideoId();
		//If no video is selected just go to main YouTube page
		if(Spinn.Utils.exists(videoID) && (enyo.string.trim(videoID) != "")) {
			var tempUrl = "http://www.youtube.com/watch?v=" + this.getVideoId()
			
			if(this.$.VideoTimeLine.getPosition() > 0) {
				var time = this.$.VideoTimeLine.getTime();
				tempUrl = tempUrl + "#t=" + time.h + "h" + time.m + "m" + time.s + "s";
			}
			
			return tempUrl; 
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