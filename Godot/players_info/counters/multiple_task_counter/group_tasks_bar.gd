extends Control

@export var bar : CustomMarginContainerGroupTasks

func _enter_tree():
	Fred.game_state_wrapper_changed.connect(game_state_wrapper_changed);
	
func _exit_tree():
	Fred.game_state_wrapper_changed.disconnect(game_state_wrapper_changed);

func game_state_wrapper_changed(gsw : game_state_wrapper):
	var is_started := gsw.is_game_started();
	
	visible = is_started;
	
	if !is_started:
		return;
		
	bar.set_values(gsw.inner_game_state.completedGroupTasks,gsw.inner_game_state.conGeneral.groupTasksCompletionTarget);
