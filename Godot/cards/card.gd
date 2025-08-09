extends Control

class_name Card

@export var sprites: Dictionary[String, Texture]

var card_id = -1

func generate_card(card):
	print(card)
	card_id = card["id"]
	$NameLabel.text = card["name"]
	
	$BackgroundFrame.texture = sprites[card["type"]]
	$ContentImage.texture = sprites[card["name"]]
	
	$VBoxContainer/Effect0.text = generate_effect(card["effects"][0])
	$VBoxContainer/Effect1.text = generate_effect(card["effects"][1])
	$VBoxContainer/Effect2.text = generate_effect(card["effects"][2])

func generate_effect(effect):
	var effect_string = "%d-%d: %s %d" % \
	[effect["diceResultMin"], effect["diceResultMax"], \
	effect["description"], effect["energyChange"]]
	return effect_string
