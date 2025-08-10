extends Control

@export var nameLabel : Label
@export var energyContainer : CustomMarginContainer
@export var personalCounterValue : Label
@export var isLocalPlayer: bool
@export var remote_player_index : int

func _enter_tree():
	Fred.game_state_wrapper_changed.connect(game_state_wrapper_changed)

func _exit_tree():
	Fred.game_state_wrapper_changed.disconnect(game_state_wrapper_changed)

func game_state_wrapper_changed(gsw : game_state_wrapper):
	if !gsw.is_game_started(): 
		visible = false;
		return;
	
	var player = gsw.get_local_player() if isLocalPlayer else gsw.get_remote_player(remote_player_index);
	
	if player == null : 
		visible = false;
		return;
	
	visible = true;
	nameLabel.text = player.name;
	energyContainer.set_values(player.energy, 10);
	personalCounterValue.text = str(player.completedPersonalTasks);
