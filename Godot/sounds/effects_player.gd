extends AudioStreamPlayer

@export var card_played: Array[AudioStream]
@export var card_reveal: Array[AudioStream]
@export var turn_over: Array[AudioStream]
@export var die_roll: Array[AudioStream]
@export var energy_down: Array[AudioStream]
@export var energy_up: Array[AudioStream]


func play_stream(stream_array):
	var stream_id = randi_range(0, stream_array.size() - 1)
	self.stream = stream_array[stream_id]
	self.play()
	
