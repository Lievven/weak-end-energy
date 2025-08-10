extends Control

class_name CardSlot

@export var card: Card

@export var maximum_screen_percentage = 1.02
@export var minimum_screen_percentage = 0.54
@export var card_shift_weight = 5

@export var card_hand: CardHand

var target_height = 0
var current_height = 0

var card_active = true

func _ready() -> void:
	target_height = minimum_screen_percentage
	current_height = minimum_screen_percentage
	

func _process(delta) -> void:
	var target = target_height
	if not card_active:
		target = -0.1
	current_height = lerpf(current_height, target, card_shift_weight * delta)
	move_card_up_percentage(current_height)


func move_card_up_percentage(y_percent) -> void:
	$Card.position.y = self.size.y - $Card/BackgroundFrame.size.y * y_percent * $Card.scale.y


func _on_resized() -> void:
	var width_mod = self.size.x / $Card/BackgroundFrame.size.x
	$Card.scale = Vector2(width_mod, width_mod)


func _on_card_mouse_entered() -> void:
	target_height = maximum_screen_percentage


func _on_card_mouse_exited() -> void:
	target_height = minimum_screen_percentage
	
	
func _on_card_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			card_hand.disable_cards(false)
			Fred.stage_card(card.card_id)
