class_name staging_card_container
extends Control

@export var card : Card
@export var isLocalPlayerCard : bool
@export var local_selection_scale : float
@export var choose_button: Button

var card_id;

func set_staging(cardData):
	if(cardData == null || !isLocalPlayerCard):
		set_hidden();
		return;
		
	process_mode = Node.PROCESS_MODE_INHERIT
	visible = true;
	
	card_id = cardData.id;
	#choose_button.disabled = true;
	
	card.generate_card(cardData)
	var scale_factor = 1
	scale = Vector3.ONE * scale_factor;

func set_choosing(cardData, locally_selected_card_Id):
	if(cardData == null):
		set_hidden();
		return;
		
	process_mode = Node.PROCESS_MODE_INHERIT
	visible = true;
	
	card_id = cardData.id;
	#choose_button.disabled = false;
	
	card.generate_card(cardData)
	var isLocallySelected = locally_selected_card_Id != null && cardData.id == locally_selected_card_Id;
	var scale_factor = local_selection_scale if isLocallySelected else 1;
	scale = Vector2.ONE * scale_factor;

func set_hidden():
	process_mode = Node.PROCESS_MODE_DISABLED;
	visible = false

func choose_button_pressed():
	print("consolehdnjhfnesh ")
	Fred.choose_activity(card_id)
