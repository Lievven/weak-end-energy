class_name CustomMarginContainer
extends MarginContainer

var max_value = 10
var counter_value = 10

var m_right = 95
var m_left = 80
var m_top = 80
var m_bottom = 70

var color_rect: ColorRect

func _ready():
	# Add child first
	color_rect = ColorRect.new()
	color_rect.color = Color.GREEN
	add_child(color_rect)
	
	# Set margins with debug output
	add_theme_constant_override("margin_right", m_right)
	add_theme_constant_override("margin_left", m_left)  
	add_theme_constant_override("margin_top", m_top)
	add_theme_constant_override("margin_bottom", m_bottom)
	
	#print("Margins set - Left:", m_left, " Right:", m_right, " Top:", m_top, " Bottom:", m_bottom)
	#print("Container size:", size)
	
	update_counter_display()

func increment_counter():
	counter_value += 1
	update_counter_display()
	
func set_values(value : int, max : int):
	counter_value = value;
	max_value = max;
	update_counter_display();
	
func set_color(color: Color):
	color_rect.color = color

func update_counter_display():
	var counter_percentage = counter_value / float(max_value)
	var container_width = size.x - 2 * m_right
	var visible_width = container_width * counter_percentage
	var new_m_right = m_right + (container_width - visible_width)
	 
	# Adjust right margin to "hide" part of the health bar
	add_theme_constant_override("margin_right", new_m_right)
