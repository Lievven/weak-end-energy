extends AudioStreamPlayer


@export var music_tracks: Array[AudioStream]

var track_index = 0

func _ready() -> void:
	self.play(140)

func _on_finished() -> void:
	track_index += 1 % 2
	track_index %= music_tracks.size()
	self.stream = music_tracks[track_index]
	self.play()
