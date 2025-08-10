extends Control


@export var name_edit: NameEdit

func _on_start_button_pressed() -> void:
	Fred.user_id = name_edit.text
	Fred.keep_polling();
	self.visible = false
