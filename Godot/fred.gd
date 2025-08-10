extends Node

signal new_turn(turn, phase)
signal update_player(player)
signal game_ended
signal update_cards(cards)
signal game_state_wrapper_changed(v:game_state_wrapper);

var url = "2cool4bool.com"
#var url = "localhost:8081"
@onready var poll_http = HTTPRequest.new()
@onready var req_http = HTTPRequest.new()

var previous_turn = -1
var previous_version = 0
var user_id = "Player0"
var current_game_state_wrapper : game_state_wrapper;

func _ready() -> void:
	add_child(poll_http)
	poll_http.request_completed.connect(_on_request_completed)
	add_child(req_http)
	req_http.request_completed.connect(_on_request_completed)
	
	
func poll():
	poll_http.request("https://" + url + "/poll?user=" + user_id + "&knownVersion=" + str(previous_version))


func stage_card(card_id):
	req_http.request("https://" + url + "/action?user=" + user_id + \
	"&action=StageCard&cardId=" + str(card_id))
	
	
func choose_activity(card_id):
	req_http.request("https://" + url + "/action?user=" + user_id + \
	"&action=ChooseActivity&cardId=" + str(card_id))
	
	
func start_game():
	req_http.request("https://" + url + "/action?user=" + user_id + \
	"&action=StartGame")
	
func _on_request_completed(result, response_code, headers, body) -> void:
	print(response_code)
	if response_code != 200:
		push_error("Invalid request: ", response_code, " -> ", body.get_string_from_utf8())
		return
	
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	if json.is_empty():
		return
	
	if previous_version == json["version"]:
		return
	previous_version = json["version"]
	
	current_game_state_wrapper = game_state_wrapper.new(json, user_id);
	
	if json["ended"]:
		game_ended.emit()
	
	new_turn.emit(json["turnIndex"], json["phaseIndex"])
	
	for player in json["players"]:
		if player["name"] != user_id:
			continue
		
		update_player.emit(player)
		
		if previous_turn != json["turnIndex"]:
			previous_turn = json["turnIndex"]
			update_cards.emit(player["hand"])
			
		break
		
	game_state_wrapper_changed.emit(current_game_state_wrapper)

func keep_polling():
	while (true):
		poll()
		await get_tree().create_timer(1.4).timeout
