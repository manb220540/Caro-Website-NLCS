from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from functools import wraps

app = Flask(__name__)


# CORS(app, resources={r"/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000"]}})
CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, supports_credentials=True)  # Cho phép gửi cookie (session) trong các yêu cầu cross-origin 
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

# Lưu trạng thái các phòng
rooms = {}

# Hằng số
EMPTY = "_"
HUMAN = "X"
AI = "O"

# Tạo phòng
@socketio.on("create_room")
def create_room(data):
    room_id = data.get("room_id")
    board_size = data.get("board_size")
    username = data.get("username")

    if not room_id or not board_size or not username:
        emit("error", {"message": "Invalid room data."})
        return

    if room_id in rooms:
        emit("error", {"message": "Room already exists."})
        return
    # Tạo phòng mới
    rooms[room_id] = {
        "board_size": board_size,
        "players": [{"sid": request.sid, "username": username, "symbol": HUMAN}],
        "board": [[EMPTY] * board_size for _ in range(board_size)],
        "turn": HUMAN,
        "chat_history": []  # Lưu lịch sử tin nhắn trong phòng
    }
    join_room(room_id)
    emit(
        "start_game",
        {
            "room_id": room_id,
            "board_size": board_size,
            "board": rooms[room_id]["board"],
            "turn": HUMAN,
            "message": f"Room {room_id} created by {username}.",
        },
        room=room_id,
    )


# Tham gia phòng
@socketio.on("join_room")
def join_room_handler(data):
    room_id = data.get("room_id")
    username = data.get("username")

    if not room_id or not username:
        emit("error", {"message": "Invalid join data."})
        print("Error: Invalid join data.") # Debug
        return

    if room_id not in rooms:
        emit("error", {"message": "Room does not exist."})
        print(f"Error: Room {room_id} does not exist.") # Debug
        return

    room = rooms[room_id]
    if len(room["players"]) >= 2:
        emit("error", {"message": "Room is full."})
        print(f"Error: Room {room_id} is full.")    # Debug
        return

    room["players"].append({"sid": request.sid, "username": username, "symbol": AI})
    join_room(room_id)
    emit(
        "start_game",
        {
            "room_id": room_id,
            "board_size": room["board_size"],
            "board": room["board"],
            "turn": room["turn"],
            "message": f"Player {username} joined room {room_id}.",
        },
        room=room_id,
    )
    print(f"Player {username} joined room {room_id}.")  # Debug


# Gửi tin nhắn
@socketio.on("send_message")
def handle_send_message(data):
    room_id = data.get("room_id")
    username = data.get("username")
    message = data.get("message")

    if not room_id or not username or not message:
        emit("error", {"message": "Invalid message data."})
        print("Error: Invalid message data.")  # Debug
        return

    if room_id not in rooms:
        emit("error", {"message": "Room does not exist."})
        print(f"Error: Room {room_id} does not exist.")  # Debug
        return

    # Lấy `username` từ danh sách người chơi
    room = rooms[room_id]
    player = next((player for player in room["players"] if player["sid"] == request.sid), None)

    if not player:
        emit("error", {"message": "You are not in this room."})
        print(f"Error: Player not found in room {room_id}.")  # Debug
        return

    username = player["username"]
    # Lưu tin nhắn vào `chat_history`
    room["chat_history"].append({"username": username, "message": message})
    # Gửi tin nhắn đến tất cả người chơi trong phòng
    emit("chat_message", {"username": username, "message": message}, room=room_id)
    print(f"Message from {username} in room {room_id}: {message}")  # Debug
# Rời phòng
@socketio.on("leave_room")
def leave_room_handler(data):
    room_id = data.get("room_id")

    if not room_id or room_id not in rooms:
        emit("error", {"message": "Room does not exist!"}, to=request.sid)
        return

    room = rooms[room_id]
    player = next((p for p in room["players"] if p["sid"] == request.sid), None)

    if player:
        room["players"].remove(player)
        leave_room(room_id)

    if not room["players"]:
        del rooms[room_id] # Xóa phòng (bao gồm chat_history)
        emit("room_closed", {"message": f"Room {room_id} has been closed."}, room=room_id)
        print(f"Room {room_id} has been closed.")
    else:
        emit("chat_message", {"username": "System", "message": f"{player['username']} left the room."}, room=room_id)
        print(f"Player {player['username']} left room {room_id}. Current players: {room.get('players', [])}")

    print(f"Player {player['username']} left room {room_id}. Current players: {room.get('players', [])}")
@socketio.on("make_move")
def make_move(data):
    room_id = data.get("room_id")
    move = data.get("move")  # {"row": row, "col": col}
    player_sid = request.sid

    if room_id not in rooms:
        emit("update_board", {"status": "error", "message": "Room does not exist!"}, to=request.sid)
        return

    room = rooms[room_id]
    player = next((p for p in room["players"] if p["sid"] == player_sid), None)

    if not player:
        emit("update_board", {"status": "error", "message": "Player not in room!"}, to=request.sid)
        return

    if room["turn"] != player["symbol"]:
        emit("update_board", {"status": "error", "message": "Not your turn!"}, to=request.sid)
        return

    row, col = move["row"], move["col"]
    if room["board"][row][col] != EMPTY:
        emit("update_board", {"status": "error", "message": "Cell already taken!"}, to=request.sid)
        return

    # Update board
    room["board"][row][col] = player["symbol"]
    winner = check_winner(room["board"], room["board_size"], player["symbol"])
    is_draw = all(cell != EMPTY for row in room["board"] for cell in row)

    if winner:
        emit(
            "update_board",
            {"status": "success", "board": room["board"], "turn": None, "isGameOver": True, "winner": winner},
            room=room_id,
        )
        return

    if is_draw:
        emit(
            "update_board",
            {"status": "success", "board": room["board"], "turn": None, "isGameOver": True, "winner": None},
            room=room_id,
        )
        return

    # Switch turn
    room["turn"] = HUMAN if room["turn"] == AI else AI
    emit(
        "update_board",
        {"status": "success", "board": room["board"], "turn": room["turn"], "isGameOver": False},
        room=room_id,
    )

def check_winner(board, size, symbol):
    """
    Kiểm tra xem người chơi có thắng hay không
    :param board: Bàn cờ (danh sách 2 chiều)
    :param size: Kích thước bàn cờ (n x n)
    :param symbol: Ký hiệu của người chơi ('X' hoặc 'O')
    :return: Ký hiệu của người thắng nếu có, ngược lại trả về None
    """
    winning_count = 3 if size == 3 else 5  # 3 liên tiếp cho 3x3, 5 liên tiếp cho bàn cờ lớn hơn

    # Kiểm tra hàng ngang
    for row in board:
        for col in range(size - winning_count + 1):
            if all(cell == symbol for cell in row[col:col + winning_count]):
                return symbol

    # Kiểm tra cột dọc
    for col in range(size):
        for row in range(size - winning_count + 1):
            if all(board[row + i][col] == symbol for i in range(winning_count)):
                return symbol

    # Kiểm tra đường chéo chính
    for row in range(size - winning_count + 1):
        for col in range(size - winning_count + 1):
            if all(board[row + i][col + i] == symbol for i in range(winning_count)):
                return symbol

    # Kiểm tra đường chéo phụ
    for row in range(size - winning_count + 1):
        for col in range(winning_count - 1, size):
            if all(board[row + i][col - i] == symbol for i in range(winning_count)):
                return symbol

    return None  # Không có người thắng


# Endpoint kiểm tra trạng thái phòng
@app.route("/admin/rooms", methods=["GET"])
def admin_get_rooms():
    try:
        active_rooms = {
            room_id: {
                "board_size": room["board_size"],
                "players_count": len(room["players"]),
            }
            for room_id, room in rooms.items()
        }
        print(f"Active rooms: {active_rooms}")  # Debug
        return jsonify({"rooms": active_rooms}), 200
    except Exception as e:
        print(f"Error retrieving rooms: {str(e)}")  # Debug
        return jsonify({"error": str(e)}), 500
# Endpoint: Xóa phòng
@app.route("/admin/delete-room", methods=["POST"])
def admin_delete_room():
    try:
        room_id = request.json.get("room_id")
        if not room_id or room_id not in rooms:
            return jsonify({"error": "Room does not exist."}), 404

        del rooms[room_id]  # Xóa phòng (bao gồm chat_history)
        return jsonify({"message": f"Room {room_id} deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return "Socket server is running."

if __name__ == "__main__":
    socketio.run(app, debug=True,host="0.0.0.0", port=5001)
