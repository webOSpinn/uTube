enyo.kind({
	name: "AddEditEntityDialog",
	kind: enyo.ModalDialog,
	className: "enyo-popup enyo-modaldialog addEditEntityDialog",
	layoutKind: "VFlexLayout",
	contentHeight:"100%", height:"90%", style: "max-height: 395px;",
	events: {
		onSave: "",
		onCancel: ""
	},
	components: [
		{kind: "Spinn.Utils" name: "Utils"},
		{kind: "Spinn.InfoDialog", name:"info", onOk:"oKHandler", caption:"", message:""},
		{kind: "Scroller", name:"theScroller", flex: 1, autoHorizontal: false, horizontal: false,
			components: [
				{kind: "RowGroup", caption: "YouTube ID:", components: [
					{name: "uTubeId", kind: "Input", hint:"YouTube user or channel ID", autocorrect: false, onchange: "uTubeIdChanged"}
				]},
				{kind: "RowGroup", caption: "Name:", components: [
					{name: "name", kind: "Input", autocorrect: false, hint:"Enter display name"}
				]},
				{kind: "RowGroup", caption: "Type:", components: [
					{
						kind: "Picker",
						name: "typePicker",
						value: "User",
						items: ["User", "Channel", "Playlist"]
					}
				]}
		]},
		{kind: "Spinn.AffirmDeny", affirmCaption: "Save", onAffirm: "btnSave_Click", denyCaption: "Cancel", onDeny: "btnCancel_Click" }
	],
	constructor: function () {
		this.inherited(arguments);
	},
	openAtCenter: function (entity) {
		this.inherited(arguments);
		
		this.$.theScroller.scrollTo(0,0);
		this.clearFields();
		this._mode = "Add";
		
		if(this.$.Utils.exists(entity)) {
			this.$.uTubeId.setValue(entity.uTubeId),
			this.$.name.setValue(entity.name),
			this.$.typePicker.setValue(entity.entityType)
			this.$.uTubeId.setDisabled(true);
		}
	},
	uTubeIdChanged: function (inSender, inEvent) {
		//Don't want to overwrite something if the user has already supplied input
		if(enyo.string.trim(this.$.name.getValue()) == "") {
			this.$.name.setValue(this.$.uTubeId.getValue());
		}
	},
	btnSave_Click: function (inSender, inEvent) {
		if(this.validateFields()){
			var entity = { 
				uTubeId: this.$.uTubeId.getValue(),
				name: this.$.name.getValue(),
				entityType: this.$.typePicker.getValue()
			}
			
			var mode;
			
			//If the uTubeId field is disabled then we are in edit mode
			if(this.$.uTubeId.getDisabled() == true) {
				mode = "Edit";
			} else {
				mode = "Add";
			}
			
			this.doSave({mode: mode, entity: entity});
			this.close()
		}
	},
	btnCancel_Click: function (inSender, inEvent) {
		this.doClose();
		this.close();
	},
	clearFields: function() {
		this.$.uTubeId.setValue("");
		this.$.name.setValue("");
		this.$.typePicker.setValue("User");
		this.$.uTubeId.setDisabled(false);
	},
	validateFields: function() {
		var temp = "";
		
		//Check uTubeId
		temp = enyo.string.trim(this.$.uTubeId.getValue());
		if(temp == "") {
			this.handleInvalidInput(this.$.uTubeId, "Please enter the YouTube ID.");
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
		if(this.$.Utils.exists(this.input)) {
			this.input.forceFocusEnableKeyboard();
			this.input.forceSelect();
		}
	}
});