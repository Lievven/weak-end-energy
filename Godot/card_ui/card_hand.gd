extends Control

class_name CardHand

var cards_enabled = true

func disable_cards(enabled = false):
	cards_enabled = enabled
	for child in $SlotContainer.get_children(true):
		if child is CardSlot:
			child.card_active = enabled


func _ready() -> void:
	pass
