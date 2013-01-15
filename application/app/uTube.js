enyo.kind({
	name: "UTube",
	kind: enyo.VFlexBox,
	components: [
		{
			name: "model",
			kind: "utube.YouTubeModel"
		},
		{
			name      : "openApp",
			kind      : "PalmService",
			service   : "palm://com.palm.applicationManager/",
			method    : "open",
			subscribe : true
		},
		{
			kind: "YouTubeApi", name: "YouTubeService",
			onSuccess: "YouTubeAnswer",
			onFailure: "YouTubeFail"
		},
		{kind: "Spinn.AboutDialog", name: "theAboutDialog"},
		{kind: "AddEntityDialog", name: "addEntityDialog",
			onSave: "handleNewEntity", onCancel: "handleCancelNewEntity"},
		{name: "appMenu", kind: "AppMenu", components: [
			{name: "about", caption: "About", onclick: "btnAbout_Click"}
		]},
		{kind: "SlidingPane", name: "slidingPane", flex: 1, components: [
			{name: "entityPane", width: "320px", components: [
				{kind: "VFlexBox",  flex: 1, components: [
					{kind: "Header", content: "YouTube Users"},
					{kind: "Scroller", name:"entityListScroller", flex: 1, autoHorizontal: false, horizontal: false,
						components: [
							{name: "entityList", kind: "Spinn.SelectableVirtualRepeater", onSetupRow: "getEntityItem", onclick: "entityListItemClick",
								components: [
									{kind: "Spinn.CountableItem", name: "entityItem"}
								]
							}
						]
					},
					{kind: "Toolbar",
						components: [{
							name: "newButton",
							kind: "ToolButton",
							icon: "./images/menu-icon-new.png",
							onclick: "addNewEntity"
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
										{kind: "SwipeableItem", onConfirm: "doDeleteVideo", layoutKind: "VFlexLayout", tapHighlight: true, components: [
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
	constructor: function () {
		this.inherited(arguments);
		var b = enyo.getCookie("utube.installed");
		var c = enyo.fetchDeviceInfo();
		if (!b || (enyo.exists(c) && b !== c.serialNumber)) {
			localStorage.removeItem("utube.version");
			localStorage.removeItem("utube.firstRun");
			if (enyo.fetchDeviceInfo()) {
				enyo.setCookie("utube.installed", enyo.fetchDeviceInfo().serialNumber)
			} else {
				enyo.setCookie("utube.installed", "browser")
			}
		}
		this.bound = {
			renderVideos: enyo.bind(this, this.renderVideos),
			renderYouTubeEntities: enyo.bind(this, this.renderYouTubeEntities)
		}
	},
	create: function () {
		this.inherited(arguments);
		enyo.application.model = this.$.model;
		this.$.model.setVideosUpdatedCallback(this.bound.renderVideos);
		this.$.model.setYouTubeEntitiesUpdatedCallback(this.bound.renderYouTubeEntities);
		this.$.model.refreshYouTubeEntities();
	},
	loaded: function (inSender) {
		//When the application is loaded we need to check to see if it is a phone
		if(enyo.isPhone())
		{ this.addClass("isPhone"); }
	},
	btnAbout_Click: function() {
		this.$.theAboutDialog.openAtCenter();
	},
	addNewEntity: function(inSender, inResponse){
		//this.$.vidViewer.hide();
		this.$.addEntityDialog.openAtCenter();
	},
	handleNewEntity: function(inSender, inEvent){
		//this.$.vidViewer.show();
		//In this case I think refreshing just the entities will be sufficient (instead of refreshItems)
		this.$.model.insertYouTubeEntity(inEvent.entity, this.$.model.bound.refreshYouTubeEntities);
	},
	handleCancelNewEntity: function(inSender, inResponse){
		//this.$.vidViewer.show();
	},
	YouTubeAnswer: function (inSender, inResponse){
		this.videos = inResponse.feed.entry;
		this.renderVideos();
	},
	YouTubeFail: function (inSender, inResponse){/*Do nothing on fail*/},
	renderYouTubeEntities: function (results) {
		//Scroll the entity list back to the top
		this.$.entityListScroller.scrollTo(0,0);
		this.$.entityList.render();
	},
	getEntityItem: function(inSender, inIndex) {
		if(this.$.model.currentYouTubeEntities !== null) {
			var r = this.$.model.currentYouTubeEntities[inIndex];
			if (r) {
				this.$.entityItem.setCaption(r.name);
				this.$.entityItem.setCount(r.VidCount);
				//If the item being rendered is what was selected before, reselect it
				if(inSender.getSelectedID() == r.uTubeId) {
					inSender.setItemToSelectOnRender(inIndex, r.uTubeId);
				}
				return true;
			}
		}
	},
	entityListItemClick: function(inSender, inEvent) {
		//Only trigger if user has clicked on an item
		if(enyo.exists(inEvent.rowIndex)) {
			//Only do selection if the user has selected a different entity
			if(inSender.getSelectedIndex() != inEvent.rowIndex) {
				var entity = this.$.model.currentYouTubeEntities[inEvent.rowIndex];
				//Select the clicked item
				inSender.setSelectedItem(inEvent.rowIndex, entity.uTubeId);
				
				this.$.model.currentYouTubeEntity = entity;
				//**************************TEMP CODE*************************************************
				this.$.YouTubeService.getJson(entity.uTubeId);
				//************************************************************************************this.$.model.refreshVideos();
				//Scroll the video list back to the top - do it here because we are looking at a different list
				this.$.videoListScroller.scrollTo(0,0);
				//clear the selected video item in the list - as we are looking at a new list
				this.$.videoList.clearSelection();
			}
			//Always go to the video list pane on a phone
			if(enyo.isPhone())
			{ this.$.slidingPane.selectView(this.$.videosPane); }
		}
	},
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
				this.$.videoName.setContent(r.title.$t);
				//If the item being rendered is what was selected before, reselect it
				if(inSender.getSelectedID() == r.link[0].href) {
					inSender.setItemToSelectOnRender(inIndex, r.link[0].href);
				}
				return true;
			}
		}
	},
	videoListItemClick: function(inSender, inEvent) {
		//Only trigger if user has clicked on an item
		if(enyo.exists(inEvent.rowIndex)) {
			//Only do selection if the user has selected a different video
			if(inSender.getSelectedIndex() != inEvent.rowIndex) {
				var vid = this.videos[inEvent.rowIndex]
				//Select the clicked item
				inSender.setSelectedItem(inEvent.rowIndex, vid.link[0].href);
				
				var videoId = vid.link[0].href.replace('http://www.youtube.com/watch?v=','');
				videoId = videoId.replace('&feature=youtube_gdata','');
				console.log("VideoId: " + videoId);
				this.$.vidViewer.setVideoId(videoId);
			}
			
			//Always go to the video pane on a phone
			if(enyo.isPhone())
			{ this.$.slidingPane.selectView(this.$.videoPlayerPane); }
		}
	}
});