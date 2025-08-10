class_name diceResultContainer
extends AspectRatioContainer

@export var bg : ColorRect
@export var label : Label

func show_dice_result(color : Color, number : int):
	visible = true;
	label.text = str(number)
	bg.color = color;

func hide_dice_result():
	visible = false;
