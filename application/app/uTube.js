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
			onGetVideoSuccess: "GetVideosAnswer",
			onGetVideoCountSuccess: "GetVideoCountAnswer",
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
						{name: "videoList", kind: "Spinn.SelectableVirtualList", flex:1, onSetupRow: "getVideoItem", onclick: "videoListItemClick", 
							onAcquirePage: "acquireVideoListPage", pageSize:50, lookAhead:1,
							components: [
								{kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, components: [
									{name: "videoName"}
								]}
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
						{kind: "HFlexBox", flex: 1, align:"center", pack:"center", components: [
							{kind: "YouTubeViewer", name: "vidViewer", showSuggestedVideos: false, style: "width: 640px; height: 360px;"}
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
								onclick: "btnShare_Click"
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
			renderYouTubeEntities: enyo.bind(this, this.renderYouTubeEntities),
			updateVideoCount: enyo.bind(this, this.updateVideoCount)
		}
		this.videos = new Object();
	},
	create: function () {
		this.inherited(arguments);
		enyo.application.model = this.$.model;
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
	btnShare_Click: function(inSender) {
		//Only show the webpage if the user is currently viewing a video
		if(enyo.exists(this.$.vidViewer.getVideoId())) {
			this.$.openApp.call({
				"id": "com.palm.app.browser", 
				"params": {
					"target": "http://www.youtube.com/watch?v=" + this.$.vidViewer.getVideoId()
				}
			});
		}
	},
	addNewEntity: function(inSender, inResponse){
		//this.$.vidViewer.hide();
		this.$.addEntityDialog.openAtCenter();
	},
	handleNewEntity: function(inSender, inEvent){
		//this.$.vidViewer.show();
		this.$.model.insertYouTubeEntity(inEvent.entity, this.bound.updateVideoCount);
	},
	handleCancelNewEntity: function(inSender, inResponse){
		//this.$.vidViewer.show();
	},
	GetVideosAnswer: function (inSender, inResponse){
		if(enyo.exists(this.videos)
			&& enyo.exists(this.videos[inResponse.entity.uTubeId])){
			this.videos[inResponse.entity.uTubeId] = this.videos[inResponse.entity.uTubeId].concat(inResponse.Videos);
		} else {
			this.videos[inResponse.entity.uTubeId] = inResponse.Videos;
		}
		
		this.$.model.updateYouTubeEntity(inResponse.entity.uTubeId, {numVideos: inResponse.entity.numVideos});
		this.renderVideos();
	},
	updateVideoCount: function (data) {
		this.$.YouTubeService.getVideoCount(data.uTubeId, data.entityType);
	},
	GetVideoCountAnswer: function (inSender, inResponse){
		this.$.model.updateYouTubeEntity(inResponse.uTubeId, {numVideos: inResponse.numVideos});
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
				this.$.entityItem.setCount(r.numVideos);
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
				
				//Only setup the array the first time the user click the item
				if(!this.videos[entity.uTubeId]) {
					this.videos[entity.uTubeId] = new Array();
				}
				//These two lines set the list back to the top.  They come from the ScrollingList kind.
				this.$.videoList.punt();
				this.$.videoList.reset();
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
		this.$.videoList.refresh();
	},
	getVideoItem: function(inSender, inIndex) {
		if(enyo.exists(this.videos)
			&& this.$.model.currentYouTubeEntity
			&& enyo.exists(this.videos[this.$.model.currentYouTubeEntity.uTubeId])) {
			
			var r = this.videos[this.$.model.currentYouTubeEntity.uTubeId][inIndex];
			if(r) {
				this.$.videoName.setContent(r.title);
				//If the item being rendered is what was selected before, reselect it
				if(inSender.getSelectedID() == r.videoId) {
					inSender.setItemToSelectOnRender(inIndex, r.videoId);
				}
				return true;
			}
		}
	},
	acquireVideoListPage: function(inSender, inPage) {
		if(enyo.exists(this.$.model.currentYouTubeEntity)) {
			var index = (Math.abs(inPage) * inSender.pageSize);
			//If index isn't past max videos...
			if((index < this.$.model.currentYouTubeEntity.numVideos) || (this.$.model.currentYouTubeEntity.numVideos == 0)) {
				// if we don't have data for this page...
				if (!this.videos[this.$.model.currentYouTubeEntity.uTubeId][index]) {
					if(this.$.YouTubeService.getVideosRunning() == false) {
						// get it from a service
						this.$.YouTubeService.getVideos(this.$.model.currentYouTubeEntity.uTubeId, this.$.model.currentYouTubeEntity.entityType, (index + 1));
					} else {
						console.log("Get Videos already running!");
					}
				}
			}
		}
	},
	videoListItemClick: function(inSender, inEvent) {
		//Only trigger if user has clicked on an item
		if(enyo.exists(inEvent.rowIndex)) {
			//Only do selection if the user has selected a different video
			if(inSender.getSelectedIndex() != inEvent.rowIndex) {
				var vid = this.videos[this.$.model.currentYouTubeEntity.uTubeId][inEvent.rowIndex]
				//Select the clicked item
				inSender.setSelectedItem(inEvent.rowIndex, vid.videoId);

				console.log("VideoId: " + vid.videoId);
				this.$.vidViewer.setVideoId(vid.videoId);
			}
			
			//Always go to the video pane on a phone
			if(enyo.isPhone())
			{ this.$.slidingPane.selectView(this.$.videoPlayerPane); }
		}
	}
});