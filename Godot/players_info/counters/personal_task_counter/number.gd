extends Label

var score = 0

func _ready():
	update_display()

func update_display():
	text = str(score)

func increase_score():
	score += 1
	update_display()
