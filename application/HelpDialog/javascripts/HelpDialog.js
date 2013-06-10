enyo.kind({
	name: "HelpDialog",
	kind: enyo.ModalDialog,
	dismissWithClick: true,
	layoutKind: "VFlexLayout",
	caption: "Help",
	contentHeight:"100%", height:"90%", style: "max-height: 395px; width: 540px;",
	components: [
		{kind: "Group", caption: "", contentFit: true, flex: 1, layoutKind: "VFlexLayout", components: [
			{kind: "Scroller", name:"theScroller", flex: 1, autoHorizontal: false, horizontal: false,
				components: [
					{content: "To add a new YouTube User/Channel/Playlist:<ol><li>Navigate to the webpage of your favorite YouTube User/Channel/Playlist.</li><li>Copy the YouTube ID from the URL.</li><li>In this app open the \"add entity\" dialog by clicking the \"plus\" button.</li><li>Paste the ID into the YouTube ID field.</li><li>Enter a friendly display name.</li><li>Specify if it is a User/Channel/Playlist.</li></ol> "},
					{content: "<b>User ID:</b>"},
					{kind: "Image", src: "HelpDialog/images/user_url.png"},
					{content: "<b>Channel ID:</b>"},
					{kind: "Image", src: "HelpDialog/images/channel_url.png"},
					{content: "<b>Playlist ID:</b>"},
					{kind: "Image", src: "HelpDialog/images/playlist_url.png"}
			]}
		]}
	],
	constructor: function () {
		this.inherited(arguments);
		this.addClass("helpDialog");
	},
	openAtCenter: function (entity) {
		this.inherited(arguments);
		this.$.theScroller.scrollTo(0,0);
	}
});