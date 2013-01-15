enyo.kind({
	name: "AddEntityDialog",
	kind: enyo.ModalDialog,
	className: "enyo-popup enyo-modaldialog addEntityDialog",
	layoutKind: "VFlexLayout",
	contentHeight:"100%", height:"90%", style: "max-height: 395px;",
	events: {
		onSave: "",
		onCancel: ""
	},
	components: [
		{kind: "Spinn.InfoDialog", name:"info", onOk:"oKHandler", caption:"", message:""},
		{kind: "Scroller", name:"theScroller", flex: 1, autoHorizontal: false, horizontal: false,
			components: [
				{kind: "RowGroup", caption: "YouTube ID:", components: [
					{name: "uTubeID", kind: "Input", hint:"YouTube user or channel ID", onchange: "uTubeIDdChanged"}
				]},
				{kind: "RowGroup", caption: "Name:", components: [
					{name: "name", kind: "Input", hint:"Enter display name"}
				]},
				{kind: "RowGroup", caption: "Type:", components: [
					{
						kind: "Picker",
						name: "typePicker",
						value: "User",
						items: ["User", "Channel"]
					}
				]}
		]},
		{kind: "Spinn.AffirmDeny", affirmCaption: "Save", onAffirm: "btnSave_Click", denyCaption: "Cancel", onDeny: "btnCancel_Click" }
	],
	constructor: function () {
		this.inherited(arguments);
	},
	openAtCenter: function () {
		this.inherited(arguments);
		
		this.$.theScroller.scrollTo(0,0);
		this.clearFields();
	},
	uTubeIDdChanged: function (inSender, inEvent) {
		//Don't want to overwrite something if the user has already supplied input
		if(enyo.string.trim(this.$.name.getValue()) == "") {
			this.$.name.setValue(this.$.uTubeID.getValue());
		}
	},
	btnSave_Click: function (inSender, inEvent) {
		if(this.validateFields()){
			var entity = { 
				uTubeID: this.$.uTubeID.getValue(),
				name: this.$.name.getValue(),
				entityType: this.$.typePicker.getValue()
			}
			
			this.doSave({entity: entity});
			this.close()
		}
	},
	btnCancel_Click: function (inSender, inEvent) {
		this.doClose();
		this.close();
	},
	clearFields: function() {
		this.$.uTubeID.setValue("");
		this.$.name.setValue("");
		this.$.typePicker.setValue("User");
	},
	validateFields: function() {
		var temp = "";
		
		//Check uTubeID
		temp = enyo.string.trim(this.$.uTubeID.getValue());
		if(temp == "") {
			this.handleInvalidInput(this.$.uTubeID, "Please enter the YouTube ID.");
			return false;
		} 
		
		//Check name
		temp = enyo.string.trim(this.$.name.getValue());
		if(temp == "") {
			this.handleInvalidInput(this.$.name, "Please enter the name.");
			return false;
		}
				
		//If we have made it this far eveything must be fine
		return true;
	},
	handleInvalidInput: function(input, message) {
		this.input = input;
		this.$.info.openAtCenter();
		this.$.info.setMessage(message);
	},
	oKHandler: function (inSender, inEvent) {
		if(enyo.exists(this.input)) {
			this.input.forceFocusEnableKeyboard();
			this.input.forceSelect();
		}
	}
});