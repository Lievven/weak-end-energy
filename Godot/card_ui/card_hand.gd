extends Control

class_name CardHand

@export var card_slot_packed: PackedScene
@export var separator_size = 10

var cards_enabled = true

var card_slots = []

func _enter_tree():
	Fred.game_state_wrapper_changed.connect(game_state_wrapper_changed)

func _exit_tree():
	Fred.game_state_wrapper_changed.disconnect(game_state_wrapper_changed)

func disable_cards(enabled = false):
	cards_enabled = enabled
	for child in $SlotContainer.get_children(true):
		if child is CardSlot:
			child.card_active = enabled

func _ready() -> void:
	Fred.update_cards.connect(update_cards)

func update_cards(cards):
	for i in range(cards.size()):
		if i >= card_slots.size():
			_add_card()
		card_slots[i].card.generate_card(cards[i])

func _add_card():
	var new_card = card_slot_packed.instantiate()
	new_card.card_hand = self
	card_slots.append(new_card)
	$SlotContainer.add_child(new_card)
	var separator = Control.new()
	separator.custom_minimum_size = Vector2(separator_size, 0)
	$SlotContainer.add_child(separator)

func game_state_wrapper_changed(gsw : game_state_wrapper):
	if !gsw.is_game_started(): return;
	
	disable_cards(gsw.get_local_player().stagedCard == null);
	
