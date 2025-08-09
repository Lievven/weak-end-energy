extends Node


signal new_turn(turn, phase)
signal update_player(player)
signal game_ended
signal update_cards(cards)

var url = "localhost:8081"
@onready var http = HTTPRequest.new()

var previous_turn = -1
var previous_version = 0
var user_id = "Player0"

func _ready() -> void:
	add_child(http)
	http.request_completed.connect(_on_request_completed)
	poll()
	
	
func poll():
	http.request("http://" + url + "/poll?userid=" + user_id + "&knownVersion=" + str(previous_version))


func stage_card(card_id):
	http.request("http://" + url + "/action?user=" + user_id + \
	"&action=StageCard&cardId=" + card_id)
	
	
func choose_activity(card_id):
	http.request("http://" + url + "/action?user=" + user_id + \
	"&action=ChooseActivity&cardId=" + card_id)
	
	
func start_game():
	http.request("http://" + url + "/action?user=" + user_id + \
	"&action=StartGame")
	
func _on_request_completed(result, response_code, headers, body) -> void:
	if response_code != 200:
		push_error("Invalid request: ", response_code, " -> ", body)
	
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	if previous_version == json["version"]:
		return
	previous_version = json["version"]
	
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
