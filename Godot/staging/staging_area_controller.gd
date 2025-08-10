class_name staging_area_controller
extends Control

@export var local_player_card : staging_card_container
@export var remote_player_cards : Array[staging_card_container]
@export var choose_phase_result_button : Button

var prev_game_state_wrapper : game_state_wrapper;
var is_showing_choose_phase_result : bool;

func _enter_tree():
	Fred.game_state_wrapper_changed.connect(game_state_wrapper_changed);
	
func _exit_tree():
	Fred.game_state_wrapper_changed.disconnect(game_state_wrapper_changed);
	
func game_state_wrapper_changed(gsw : game_state_wrapper):
	
	if !gsw.is_game_started() :
		visible = false 
		return;
	else:
		visible = true;

	choose_phase_result_button.process_mode =Node.PROCESS_MODE_INHERIT if is_showing_choose_phase_result else Node.PROCESS_MODE_DISABLED
	choose_phase_result_button.visible = is_showing_choose_phase_result
	choose_phase_result_button.mouse_filter = Control.MOUSE_FILTER_STOP if is_showing_choose_phase_result else MOUSE_FILTER_PASS
	choose_phase_result_button.disabled = !is_showing_choose_phase_result;
	if is_showing_choose_phase_result : return;
	
	for i in range(gsw.get_remote_player_count()-1, remote_player_cards.size()):
		remote_player_cards[i].set_hidden();
	
	if gsw.get_is_staging_phase():
		var local_player = gsw.get_local_player();
		local_player_card.set_staging(local_player.stagedCard);
		for remote_player_index in range(gsw.get_remote_player_count()):
			var remote_player = gsw.get_remote_player(remote_player_index)
			remote_player_cards[remote_player_index].set_staging(remote_player.stagedCard)

	if gsw.get_is_choosing_activity_phase():
		var local_player = gsw.get_local_player();
		var local_selection = local_player.chosenCard;
		var local_selection_id = null if local_selection == null else local_selection.id;
		
		local_player_card.set_choosing(local_player.stagedCard, local_selection_id);
		for remote_player_index in range(gsw.get_remote_player_count()):
			var remote_player = gsw.get_remote_player(remote_player_index)
			remote_player_cards[remote_player_index].set_choosing(remote_player.stagedCard, local_selection_id)
