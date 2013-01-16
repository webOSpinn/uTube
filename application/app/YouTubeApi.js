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
	getJson: function(userOrChannelOrPlaylistId, entityType) {
		var url = "";
		switch(entityType)
		{
			case "User":
			case "Channel":
				url = "http://gdata.youtube.com/feeds/api/videos?max-results=50&alt=json&orderby=published&author=" + userOrChannelOrPlaylistId;
				break;
			case "Playlist":
				url = "http://gdata.youtube.com/feeds/api/playlists/" + userOrChannelOrPlaylistId + "?v=2&alt=json";
				break;
			default:
		}
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