enyo.kind({
	name: "RssToJson",
	kind: enyo.Component,
	events: {
	  onSuccess: "",
	  onFailure: ""
	},
	components: [
		{
			kind: "WebService",
			name: "RSSWebService",
			onSuccess: "RssAnswer",
			onFailure: "RssFail"
		}
	],
	getRss: function(rssUrl) {
		var url = "http://query.yahooapis.com/v1/public/yql?q=select" + "%20link%2C%20title%2C%20description%20from%20rss%20where%20url%3D%22" + rssUrl + "%22&format=json&callback=";
		this.$.RSSWebService.setUrl(url);
        this.$.RSSWebService.call();
	},
	RssAnswer: function (inSender, inResponse) {
		this.doSuccess(inResponse);
    },
	RssFail: function (inSender, inResponse) {
		this.doFailure(inResponse);
	}
});