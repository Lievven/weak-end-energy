extends Control


@export var name_edit: NameEdit

func _on_start_button_pressed() -> void:
	Fred.user_id = name_edit.text
	Fred.poll()
	self.visible = false
