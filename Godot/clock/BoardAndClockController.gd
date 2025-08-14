extends Node

@export var clock_arm_parent : Node3D
@export var clock_arm_name : String

var clock_arm : Node3D

func _ready():
	clock_arm = clock_arm_parent.find_child(clock_arm_name);

func _enter_tree():
	Fred.game_state_wrapper_changed.connect(game_state_wrapper_changed)
	
func _exit_tree():
	Fred.game_state_wrapper_changed.disconnect(game_state_wrapper_changed)

func game_state_wrapper_changed(gsw : game_state_wrapper):
	if !gsw.is_game_started(): return
	
	clock_arm.rotation = Vector3(0,0,-((gsw.get_turn_index()+0.5) / gsw.get_turns_max()) * PI * 2)
