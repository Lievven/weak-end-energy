class_name staging_card_container
extends Control

@export var card : Card
@export var isLocalPlayerCard : bool
@export var local_selection_scale : float
@export var choose_button: Button
@export var diceResultContainersParent : Control
@export var diceResultControllers : Array[diceResultContainer]
@export var backSideVisual : Control

var card_id;

func set_staging(cardData):
	if(cardData == null):
		set_hidden();
		return;
	
	process_mode = Node.PROCESS_MODE_INHERIT
	visible = true;
	backSideVisual.visible = !isLocalPlayerCard
	
	card_id = cardData.id;
	choose_button.disabled = true;
	
	card.generate_card(cardData)
	scale = Vector2.ONE;
	
	diceResultContainersParent.visible = false;

func set_choosing(cardData, locally_selected_card_Id):
	if(cardData == null):
		set_hidden();
		return;
		
	process_mode = Node.PROCESS_MODE_INHERIT
	visible = true;
	backSideVisual.visible = false;
	
	card_id = cardData.id;
	choose_button.disabled = false;
	
	card.generate_card(cardData)
	var isLocallySelected = locally_selected_card_Id != null && cardData.id == locally_selected_card_Id;
	var scale_factor = local_selection_scale if isLocallySelected else 1;
	scale = Vector2.ONE * scale_factor;
	
	diceResultContainersParent.visible = false;

func set_hidden():
	process_mode = Node.PROCESS_MODE_DISABLED;
	visible = false

func choose_button_pressed():
	Fred.choose_activity(card_id)
	
func set_choose_result(cardData, gsw : game_state_wrapper):
	if(cardData == null):
		set_hidden();
		return;
		
	process_mode = Node.PROCESS_MODE_INHERIT
	visible = true;
	
	card_id = cardData.id;
	choose_button.disabled = true;
	
	card.generate_card(cardData)
	scale = Vector2.ONE;
	diceResultContainersParent.visible = true;
	
	for v in diceResultControllers:
		v.hide_dice_result();
		
	for pi in range(gsw.get_total_player_count()):
		var p = gsw.inner_game_state.players[pi];
		if p.lastChosenCard != null && p.lastChosenCard.id == card_id:
			diceResultControllers[pi].show_dice_result(gsw.get_player_color(p.name), p.lastDiceResult);
	
