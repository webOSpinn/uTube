enyo.kind({
	name: "TimeLine",
	kind: enyo.Control,
	className: "TimeLine",
	published: {
		caption: "Jump To: ",
		position: 0,
		showTimeInCaption: true,
		maximum: 60,
		minimum: 0,
		snap: 1
	},
	events: {
		onChanging: "",
		onChange: ""
	},
	components:[
		{kind: "RowGroup", name: "header", caption: "Jump To: ", components: [
			{kind: "Slider", name: "TimeSlider", position: 0, maximum: 60, minimum: 0, snap: 1,
				onChanging: "sliderChanging", onChange: "sliderChange"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		
		this.captionChanged();
		this.positionChanged();
		this.showTimeInCaptionChanged();
		this.maximumChanged();
		this.minimumChanged();
		this.snapChanged();
	},
	captionChanged: function() {
		this.renderCaption();
	},
	positionChanged: function() {
		this.$.TimeSlider.setPosition(this.position);
		this.renderCaption();
	},
	showTimeInCaptionChanged: function() {
		this.renderCaption();
	},
	maximumChanged: function() {
		this.$.TimeSlider.setMaximum(this.maximum);
	},
	minimumChanged: function() {
		this.$.TimeSlider.setMinimum(this.minimum);
	},
	snapChanged: function() {
		this.$.TimeSlider.setSnap(this.snap);
	},
	getTime: function() {
		return Spinn.Utils.secondsToTime(this.$.TimeSlider.position);
	},
	renderCaption: function() {
		if (this.showTimeInCaption) {
			var time = Spinn.Utils.secondsToTime(this.$.TimeSlider.position);
			this.$.header.setCaption(this.caption + (Spinn.Utils.zeroPad(time.h,2) + ":" + Spinn.Utils.zeroPad(time.m,2) + ":" + Spinn.Utils.zeroPad(time.s,2)));
		} else {
			this.$.header.setCaption(this.caption);
		}
	},
	//Fired while sliding
	sliderChanging: function(inSender, position) {
		this.renderCaption();
		this.doChanging(position);
	},
	//Fired once user releases slider
	sliderChange: function(inSender, position) {
		this.renderCaption();
		this.doChange(position);
	}
})