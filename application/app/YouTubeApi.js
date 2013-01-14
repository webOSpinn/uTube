enyo.kind({
	name: "YouTubeApi",
	kind: enyo.Component,
	events: {
	  onSuccess: "",
	  onFailure: ""
	},
	components: [
		{
			kind: "WebService",
			name: "JsonWebService",
			onSuccess: "JsonAnswer",
			onFailure: "JsonFail"
		}
	],
	getJson: function(userOrChannelId) {
		var url = "http://gdata.youtube.com/feeds/api/videos?max-results=50&alt=json&orderby=published&author="+userOrChannelId
		this.$.JsonWebService.setUrl(url);
        this.$.JsonWebService.call();
	},
	JsonAnswer: function (inSender, inResponse) {
		this.doSuccess(inResponse);
    },
	JsonFail: function (inSender, inResponse) {
		this.doFailure(inResponse);
	}
});