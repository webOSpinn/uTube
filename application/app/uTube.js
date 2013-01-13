enyo.kind({
	name: "UTube",
	kind: enyo.VFlexBox,
	components: [
		{kind: "RssToJson", name: "rssService",
			onSuccess: "RssAnswer",
			onFailure: "RssFail"
		},
		{kind: "Spinn.InputDialog", name: "addUserDialog", caption: "Add User", 
			affirmCaption: "Add", denyCaption: "Cancel",
			inputHint: "Enter YouTube User Name.",
			directions: "",
			onSubmit: "handleNewUser", onCancel: "handleCancelNewUser"},
		{kind: "SlidingPane", name: "slidingPane", flex: 1, components: [
			{name: "userPane", width: "320px", components: [
				{kind: "VFlexBox",  flex: 1, components: [
					{kind: "Header", content: "YouTube Users"},
					{kind: "Scroller", name:"userListScroller", flex: 1, autoHorizontal: false, horizontal: false,
						components: [
							{name: "userList", kind: "Spinn.SelectableVirtualRepeater", onSetupRow: "getUserItem", onclick: "userListItemClick",
								components: [
									{kind: "Spinn.CountableItem", name: "userItem"}
								]
							}
						]
					},
					{kind: "Toolbar",
						components: [{
							name: "newButton",
							kind: "ToolButton",
							icon: "./images/menu-icon-new.png",
							onclick: "addNewUser"
						}]
					}
				]}
			]},
			{name: "videosPane", width: "320px",
				components: [
					{kind: "VFlexBox",  flex: 1, components: [
						{kind: "Header", content: "Videos"},
						{kind: "Scroller", name: "videoListScroller", flex: 1, autoHorizontal: false, horizontal: false,
							components: [
								{name: "videoList", kind: "Spinn.SelectableVirtualRepeater", onSetupRow: "getVideoItem", onclick: "videoListItemClick",
									components: [
										{kind: "SwipeableItem", onConfirm: "doDeleteLocation", layoutKind: "VFlexLayout", tapHighlight: true, components: [
											{name: "videoName"}
										]}
									]
								}
							]
						},
						{kind: "Toolbar",
							components: [{
								name: "fullscreenButton2",
								kind: "GrabButton"
							},
							{
								name: "syncButton",
								kind: "ToolButton",
								icon: "./images/menu-icon-sync.png",
								onclick: "syncClick"
							}]
						}
					]}
					
				]
			},
			{name: "videoPlayerPane", flex: 1, onResize: "slidingResize",
				components: [
					{kind: "VFlexBox",  flex: 1, components: [
						{kind: "Header", content: "Video Player"},
						{kind: "HFlexBox",  flex: 1, align:"center", pack:"center", components: [
							{kind: "YouTubeViewer", name: "vidViewer", style: "width: 640px; height: 360px;"}
						]},
						{kind: "Toolbar",
							components: [{
								name: "fullscreenButton3",
								kind: "GrabButton"
							},
							{
								name: "shareButton",
								kind: "ToolButton",
								icon: "./images/menu-icon-share.png",
								onmousedown: "noteMousedown",
								onmouseup: "shareDocument"
							}]
						}
					]}
				]
			}
		]}
	],
	addNewUser: function(inSender, inResponse){
		//this.$.vidViewer.hide();
		this.$.addUserDialog.openAtCenter();
	},
	handleNewUser: function(inSender, inResponse){
		//this.$.vidViewer.show();
		this.$.rssService.getRss("http://www.youtube.com/rss/user/" + inResponse.userInput + "/videos.rss");
	},
	handleCancelNewUser: function(inSender, inResponse){
		//this.$.vidViewer.show();
	},
	RssAnswer: function (inSender, inResponse){
		this.videos = inResponse.query.results.item;
		this.renderVideos();
	},
	RssFail: function (inSender, inResponse){/*Do nothing on fail*/},
	renderVideos: function (results) {
		//Don't scroll to the top here because this also get triggered when the
		//list the user it looking at gets refreshed and it is annoying for the user
		//to have to scroll back down.
		this.$.videoList.render();
	},
	getVideoItem: function(inSender, inIndex) {
		if(enyo.exists(this.videos)) {
			var r = this.videos[inIndex];
			if(r) {
				this.$.videoName.setContent(r.title);
				//If the item being rendered is what was selected before, reselect it
				if(inSender.getSelectedID() == r.link) {
					inSender.setItemToSelectOnRender(inIndex, r.link);
				}
				return true;
			}
		}
	},
	videoListItemClick: function(inSender, inEvent) {
		//Only trigger if user has clicked on an item
		if(enyo.exists(inEvent.rowIndex)) {
			//Only do selection if the user has selected a different location
			if(inSender.getSelectedIndex() != inEvent.rowIndex) {
				var vid = this.videos[inEvent.rowIndex]
				//Select the clicked item
				inSender.setSelectedItem(inEvent.rowIndex, vid.link);
				
				var videoId = vid.link.replace('http://www.youtube.com/watch?v=','');
				videoId = videoId.replace('&feature=youtube_gdata','');
				console.log("VideoId: " + videoId);
				this.$.vidViewer.setVideoId(videoId);
			}
			
			//Always go to the location details pane on a phone
			if(enyo.isPhone())
			{ this.$.slidingPane.selectView(this.$.locationDetailPane); }
		}
	}
});