extends LineEdit

class_name NameEdit

@export var default_name_prefix: Array[String]
@export var default_name_suffix: Array[String]

func _ready() -> void:
	var prefix_index = randi_range(0, default_name_prefix.size() - 1)
	var suffix_index = randi_range(0, default_name_suffix.size() - 1)
	text = default_name_prefix[prefix_index] \
		+ default_name_suffix[suffix_index]
	


func _on_text_changed(new_text: String) -> void:
	var prev_caret_column = caret_column
	text = ""
	var skipped_letters = 0
	for char in new_text:
		if char.is_valid_identifier():
			text += char
		else:
			skipped_letters += 1
			
	caret_column = prev_caret_column - skipped_letters
	
	if skipped_letters > 0:
		shake()


# TODO: make the element shake to show the character was invalid	
func shake() -> void:
	pass
