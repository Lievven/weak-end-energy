extends Control


var music_bus = AudioServer.get_bus_index("Music")
var sfx_bus = AudioServer.get_bus_index("SFX")

@export var sfx: SFX_Player


func _on_music_volume_value_changed(value: float) -> void:
	AudioServer.set_bus_volume_linear(music_bus, value)


func _on_effect_volume_value_changed(value: float) -> void:
	AudioServer.set_bus_volume_linear(sfx_bus, value)
