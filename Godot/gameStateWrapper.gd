class_name game_state_wrapper;
extends Object

var inner_game_state;
var inner_user_id;

func _init(game_state, user_id):
	inner_user_id = user_id;
	inner_game_state = game_state;

func is_game_started()->bool:
	return get_turn_index() >= 0;

func get_local_player():
	for player in inner_game_state.players:
		if player.name == inner_user_id:
			return player;
	return null;

func get_total_player_count():
	return inner_game_state.players.size();
	
func get_remote_player_count():
	return get_total_player_count() - 1;
	
func get_player_index(user_id) -> int:
	for i in range(inner_game_state.players.size()):
		if inner_game_state.players[i].name == user_id : return i
		
	return -1;

func get_player_color(userName) -> Color:
	var index := get_player_index(userName);
	
	if index == 0:
		return Color.BLUE;
	elif index == 1:
		return Color.YELLOW;
	elif index == 2:
		return Color.GREEN;
	else:
		return Color.RED;

#remote player index should be between 0 and 2
func get_remote_player(remote_player_index:int):
	for player in inner_game_state.players:
		if player.name == inner_user_id:
			continue
			
		remote_player_index-=1;
		
		if remote_player_index<0:
			return player
	return null;

func get_turn_index()->int:
	return inner_game_state.turnIndex;

func get_is_staging_phase()->bool:
	return inner_game_state.phaseIndex == 0;
	
func get_is_choosing_activity_phase()->bool:
	return inner_game_state.phaseIndex == 1;
