extends Control

@export var maximum_screen_percentage = 1.02
@export var minimum_screen_percentage = 0.54
@export var card_shift_weight = 5

var target_height = 0
var current_height = 0


func _ready() -> void:
	target_height = minimum_screen_percentage
	current_height = minimum_screen_percentage
	

func _process(delta) -> void:
	current_height = lerpf(current_height, target_height, card_shift_weight * delta)
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
