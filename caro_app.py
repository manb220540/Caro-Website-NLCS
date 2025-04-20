from flask import Flask, request, jsonify, session, render_template
#from minimax import initialize_board, find_best_move, board, AI, HUMAN, check_win, is_moves_left
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import requests  # Thư viện để gửi HTTP request đến Flask-Socket.IO server
#from caro_app import app, db
import jwt #token
# Khởi tạo Flask với thư mục template và static
app = Flask(__name__, template_folder='template', static_folder='static')

# Route cho trang chủ: Trả về index.html từ thư mục template
@app.route('/')
def home():
    return render_template('index.html')

# Các route cho các trang HTML khác:
@app.route('/<page_name>')
def render_page(page_name):
    try:
        return render_template(f'{page_name}.html')
    except Exception as e:
        return "Page not found", 404
# Cấu hình CORS
# CORS(app, resources={r"/*": {"origins": ["http://localhost:5001", "http://127.0.0.1:5001"]}})
CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, supports_credentials=True)  # Cho phép gửi cookie (session) trong các yêu cầu cross-origin  # Kích hoạt CORS cho tất cả các route
app.secret_key = "secret_key"
app.config['SESSION_COOKIE_NAME'] = 'cookie_name'
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Giới hạn chỉ truy cập cookie từ HTTP
app.config['SESSION_COOKIE_SECURE'] = True  # Nếu đang sử dụng HTTPS
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///caro_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
#minmax

# Hằng số
MAX_DEPTH = 3
HUMAN = 'X'
AI = 'O'
EMPTY = '_'

def is_moves_left(board_data):
    """Kiểm tra còn nước đi không (chỉ cần xem còn EMPTY)."""
    for row in board_data:
        if EMPTY in row:
            return True
    return False

def find_bounding_box(board_data, BOARD_SIZE):
    """Tìm min/max row/col cho ô đã đi."""
    min_row, max_row = BOARD_SIZE, -1
    min_col, max_col = BOARD_SIZE, -1

    for i in range(BOARD_SIZE):
        for j in range(BOARD_SIZE):
            if board_data[i][j] != EMPTY:
                min_row = min(min_row, i)
                max_row = max(max_row, i)
                min_col = min(min_col, j)
                max_col = max(max_col, j)

    if min_row > 0: min_row -= 1
    if max_row < BOARD_SIZE - 1: max_row += 1
    if min_col > 0: min_col -= 1
    if max_col < BOARD_SIZE - 1: max_col += 1

    return min_row, max_row, min_col, max_col

def evaluate_line(line, WINNING_COUNT):
    count_ai = line.count(AI)
    count_human = line.count(HUMAN)
    if count_ai == WINNING_COUNT:
        return 100
    if count_human == WINNING_COUNT:
        return -100
    return 0

def evaluate(board_data, min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT):
    """Tính điểm cục bộ."""
    score = 0
    min_row = max(0, min_row)
    max_row = min(BOARD_SIZE - 1, max_row)
    min_col = max(0, min_col)
    max_col = min(BOARD_SIZE - 1, max_col)

    # Kiểm tra hàng
    for i in range(min_row, max_row + 1):
        for j in range(min_col, max_col - WINNING_COUNT + 2):
            line = board_data[i][j:j + WINNING_COUNT]
            score += evaluate_line(line, WINNING_COUNT)

    # Kiểm tra cột
    for j in range(min_col, max_col + 1):
        for i in range(min_row, max_row - WINNING_COUNT + 2):
            col_slice = [board_data[i + k][j] for k in range(WINNING_COUNT)]
            score += evaluate_line(col_slice, WINNING_COUNT)

    # Kiểm tra đường chéo
    for i in range(min_row, max_row - WINNING_COUNT + 2):
        for j in range(min_col, max_col - WINNING_COUNT + 2):
            diag1 = [board_data[i + k][j + k] for k in range(WINNING_COUNT)]
            diag2 = [board_data[i + k][j + (WINNING_COUNT - 1 - k)] for k in range(WINNING_COUNT)]
            score += evaluate_line(diag1, WINNING_COUNT)
            score += evaluate_line(diag2, WINNING_COUNT)

    return score

def evaluate_sequence(board_data, row, col, player, BOARD_SIZE, WINNING_COUNT, direction="horizontal"):
    count = 0
    for k in range(WINNING_COUNT):
        if direction == "horizontal":
            if col + k < BOARD_SIZE and board_data[row][col + k] == player:
                count += 1
        elif direction == "vertical":
            if row + k < BOARD_SIZE and board_data[row + k][col] == player:
                count += 1
        elif direction == "diagonal_main":
            if row + k < BOARD_SIZE and col + k < BOARD_SIZE and board_data[row + k][col + k] == player:
                count += 1
        elif direction == "diagonal_anti":
            if row - k >= 0 and col + k < BOARD_SIZE and board_data[row - k][col + k] == player:
                count += 1
    return count ** 2

def heuristic(board_data, min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT):
    score = 0
    min_row = max(0, min_row)
    max_row = min(BOARD_SIZE - 1, max_row)
    min_col = max(0, min_col)
    max_col = min(BOARD_SIZE - 1, max_col)

    # Kiểm tra hàng ngang
    for i in range(min_row, max_row + 1):
        for j in range(min_col, max_col - WINNING_COUNT + 2):
            if board_data[i][j] == AI:
                score += evaluate_sequence(board_data, i, j, AI, BOARD_SIZE, WINNING_COUNT)
            elif board_data[i][j] == HUMAN:
                score -= evaluate_sequence(board_data, i, j, HUMAN, BOARD_SIZE, WINNING_COUNT)

    # Kiểm tra hàng dọc
    for j in range(min_col, max_col + 1):
        for i in range(min_row, max_row - WINNING_COUNT + 2):
            if board_data[i][j] == AI:
                score += evaluate_sequence(board_data, i, j, AI, BOARD_SIZE, WINNING_COUNT, direction="vertical")
            elif board_data[i][j] == HUMAN:
                score -= evaluate_sequence(board_data, i, j, HUMAN, BOARD_SIZE, WINNING_COUNT, direction="vertical")

    # Kiểm tra đường chéo chính (↘)
    for i in range(min_row, max_row - WINNING_COUNT + 2):
        for j in range(min_col, max_col - WINNING_COUNT + 2):
            if board_data[i][j] == AI:
                score += evaluate_sequence(board_data, i, j, AI, BOARD_SIZE, WINNING_COUNT, direction="diagonal_main")
            elif board_data[i][j] == HUMAN:
                score -= evaluate_sequence(board_data, i, j, HUMAN, BOARD_SIZE, WINNING_COUNT, direction="diagonal_main")

    # Kiểm tra đường chéo phụ (↙)
    for i in range(min_row + WINNING_COUNT - 1, max_row + 1):
        for j in range(min_col, max_col - WINNING_COUNT + 2):
            if board_data[i][j] == AI:
                score += evaluate_sequence(board_data, i, j, AI, BOARD_SIZE, WINNING_COUNT, direction="diagonal_anti")
            elif board_data[i][j] == HUMAN:
                score -= evaluate_sequence(board_data, i, j, HUMAN, BOARD_SIZE, WINNING_COUNT, direction="diagonal_anti")

    return score

def get_potential_moves(board_data, min_row, max_row, min_col, max_col):
    moves = []
    for i in range(min_row, max_row + 1):
        for j in range(min_col, max_col + 1):
            if board_data[i][j] == EMPTY:
                moves.append((i, j))
    return moves

def minimax(board_data, depth, alpha, beta, is_maximizing, max_depth,
            min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT):
    # Đánh giá
    sc = evaluate(board_data, min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT)
    if sc == 100 or sc == -100:
        return sc

    if depth == max_depth or not is_moves_left(board_data):
        return heuristic(board_data, min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT)

    potential_moves = get_potential_moves(board_data, min_row, max_row, min_col, max_col)
    # Sắp xếp move
    potential_moves.sort(
        key=lambda move: heuristic(board_data, move[0], move[0], move[1], move[1], BOARD_SIZE, WINNING_COUNT),
        reverse=is_maximizing
    )

    if is_maximizing:
        max_eval = float('-inf')
        for move in potential_moves:
            r, c = move
            board_data[r][c] = AI
            val = minimax(board_data, depth + 1, alpha, beta, False, max_depth,
                          min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT)
            board_data[r][c] = EMPTY
            max_eval = max(max_eval, val)
            alpha = max(alpha, val)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float('inf')
        for move in potential_moves:
            r, c = move
            board_data[r][c] = HUMAN
            val = minimax(board_data, depth + 1, alpha, beta, True, max_depth,
                          min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT)
            board_data[r][c] = EMPTY
            min_eval = min(min_eval, val)
            beta = min(beta, val)
            if beta <= alpha:
                break
        return min_eval

def find_best_move(board_data, max_depth, BOARD_SIZE, WINNING_COUNT):
    """Tìm nước đi tốt nhất cho AI, kiểm tra nước thắng ngay trước, nếu có => đánh luôn."""
    min_row, max_row, min_col, max_col = find_bounding_box(board_data, BOARD_SIZE)
    best_val = float('-inf')
    best_move = (-1, -1)

    potential_moves = get_potential_moves(board_data, min_row, max_row, min_col, max_col)
    if not potential_moves:
        # Không có nước đi => đánh ở giữa
        return (BOARD_SIZE // 2, BOARD_SIZE // 2)

    # Kiểm tra nước thắng ngay
    for (r, c) in potential_moves:
        board_data[r][c] = AI
        if check_win(board_data, AI, BOARD_SIZE, WINNING_COUNT):
            board_data[r][c] = EMPTY
            return (r, c)
        board_data[r][c] = EMPTY

    # Không có nước thắng ngay => chạy minimax
    potential_moves.sort(
        key=lambda m: heuristic(board_data, m[0], m[0], m[1], m[1], BOARD_SIZE, WINNING_COUNT),
        reverse=True
    )

    for (r, c) in potential_moves:
        board_data[r][c] = AI
        val = minimax(board_data, 0, float('-inf'), float('inf'), False, max_depth,
                      min_row, max_row, min_col, max_col, BOARD_SIZE, WINNING_COUNT)
        board_data[r][c] = EMPTY
        if val > best_val:
            best_val = val
            best_move = (r, c)
    return best_move

def check_win(board_data, player, BOARD_SIZE, WINNING_COUNT):
    """Kiểm tra xem player có thắng không (giống code cũ)."""
    # Kiểm tra hàng
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE - WINNING_COUNT + 1):
            if all(board_data[row][col + i] == player for i in range(WINNING_COUNT)):
                return True

    # Kiểm tra cột
    for col in range(BOARD_SIZE):
        for row in range(BOARD_SIZE - WINNING_COUNT + 1):
            if all(board_data[row + i][col] == player for i in range(WINNING_COUNT)):
                return True

    # Kiểm tra đường chéo chính
    for row in range(BOARD_SIZE - WINNING_COUNT + 1):
        for col in range(BOARD_SIZE - WINNING_COUNT + 1):
            if all(board_data[row + i][col + i] == player for i in range(WINNING_COUNT)):
                return True

    # Kiểm tra đường chéo phụ
    for row in range(BOARD_SIZE - WINNING_COUNT + 1):
        for col in range(WINNING_COUNT - 1, BOARD_SIZE):
            if all(board_data[row + i][col - i] == player for i in range(WINNING_COUNT)):
                return True
    return False

# ------------------ CODE CHÍNH SỬA AI_MOVE ------------------

@app.route("/ai-move", methods=["POST"])
def ai_move():
    """Nhận board cục bộ, xử lý nước đi AI, trả về best_move."""
    try:
        data = request.get_json()
        BOARD_SIZE = data.get("boardSize", 20)
        max_depth = data.get("maxDepth", 3)

        if BOARD_SIZE == 3:
            WINNING_COUNT = 3
        else:
            WINNING_COUNT = 5

        board_data = data.get("board")
        if not board_data or not isinstance(board_data, list):
            return jsonify({"error": "Invalid board data"}), 400

        # Kiểm tra còn nước đi không
        if not is_moves_left(board_data):
            return jsonify({"row": -1, "col": -1, "winner": "Draw"}), 200

        # Tìm best_move
        best_move = find_best_move(board_data, max_depth, BOARD_SIZE, WINNING_COUNT)
        (r, c) = best_move

        # Nếu không có nước đi
        if r == -1 and c == -1:
            return jsonify({"row": -1, "col": -1, "winner": "Draw"}), 200

        # AI đánh
        board_data[r][c] = AI

        # Kiểm tra AI thắng
        if check_win(board_data, AI, BOARD_SIZE, WINNING_COUNT):
            return jsonify({"row": r, "col": c, "winner": "AI"}), 200

        # Nếu chưa thắng
        return jsonify({"row": r, "col": c, "winner": None}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    score = db.Column(db.Integer, default=0)
    is_admin = db.Column(db.Boolean, default=False)

# Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    # Kiểm tra xem username đã tồn tại chưa
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"message": "Username already exists!"}), 400

    # Mã hóa mật khẩu
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_pw)

    # Thêm người dùng mới vào cơ sở dữ liệu
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully!"}), 201

from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

# Hàm thêm tài khoản admin mặc định
def create_default_admin():
    """
    Thêm tài khoản admin mặc định nếu chưa tồn tại.
    """
    admin_username = "admin"
    admin_password = "adminpass"  # Mật khẩu mặc định

    # Kiểm tra xem tài khoản admin đã tồn tại chưa
    existing_admin = User.query.filter_by(username=admin_username).first()
    if not existing_admin:
        hashed_pw = bcrypt.generate_password_hash(admin_password).decode('utf-8')
        admin_user = User(username=admin_username, password=hashed_pw, is_admin=True, score=0)
        db.session.add(admin_user)
        db.session.commit()
        print(f"Default admin created: {admin_username}")
    else:
        print(f"Admin {admin_username} already exists.")


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        print("Current session:", session)
        session['user_id'] = user.id
        session['logged_in'] = True
        session['is_admin'] = user.is_admin
        session['username'] = user.username
        session.modified = True
        print('user id login:',session['user_id']) #debug
        print('logged_in:',session['logged_in'])
        return jsonify({"message": "Login successful",
                        "userId": user.id,
                        "is_admin": user.is_admin  # Trả về thông tin quyền admin
                        }), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    # session.pop('user_id', None)
    # Xóa toàn bộ session để đảm bảo không còn dữ liệu đăng nhập
    session.clear()
    return jsonify({"message": "Logged out successfully!"}), 200

@app.route('/update-score', methods=['POST'])
def update_score():
    data = request.json
    user_id = data.get('userId')
    score = data.get('score')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found!"}), 404

    user.score += score  # Cập nhật điểm
    db.session.commit()

    return jsonify({"message": "Score updated successfully!"}), 200


@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    top_users = User.query.filter(User.is_admin == False).order_by(User.score.desc()).limit(10).all()
    leaderboard = [{"username": user.username, "score": user.score} for user in top_users]
    return jsonify(leaderboard)

@app.route('/add-admin', methods=['POST'])
def add_admin():
    """
    Chỉ admin có thể thêm tài khoản admin mới.
    """
    current_user_id = session.get('user_id')
    current_user = db.session.get(User, current_user_id)
    

    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Kiểm tra nếu tài khoản đã tồn tại
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists!"}), 400

    # Tạo tài khoản admin mới
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_admin = User(username=username, password=hashed_pw, is_admin=True)
    db.session.add(new_admin)
    db.session.commit()

    return jsonify({"message": f"Admin account '{username}' created successfully!"}), 201
@app.route('/delete-user', methods=['POST'])
def delete_user():
    """
    Chỉ admin mới có thể xóa tài khoản người dùng.
    """
    
    
    data = request.json
    username = data.get('username')

    # Kiểm tra nếu người dùng tồn tại trong hệ thống
    user_to_delete = User.query.filter_by(username=username).first()
    if not user_to_delete:
        return jsonify({"message": "User not found!"}), 404  # Người dùng không tồn tại

    # Kiểm tra xem người có xoá tài khoản root hay không
    #print(user_to_delete.id) #debug
    if user_to_delete.id == 1: #id của root
        return jsonify({"message": "Cannot delete root account!"}), 403  # Không thể xóa tài khoản của chính mình


    # Xóa tài khoản người dùng
    db.session.delete(user_to_delete)
    db.session.commit()

    return jsonify({"message": f"User '{username}' has been deleted."}), 200


@app.route('/reset-score', methods=['POST'])
def reset_score():
    """
    Chỉ admin có thể reset điểm số của người dùng.
    """
    current_user_id = session.get('user_id')
    current_user = db.session.get(User, current_user_id)
    print("Current session:", session)  # Debug: in ra session để kiểm tra
    print("current_user_id",session.get('user_id')) #debug
    print("current_user",current_user) #debug
    
    
    data = request.json
    username = data.get('username')

    # Kiểm tra nếu người dùng tồn tại
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "User not found!"}), 404

    # Reset điểm người dùng
    user.score = 0
    db.session.commit()

    return jsonify({"message": f"Score for user '{username}' has been reset to 0."}), 200

@app.route('/list-users', methods=['GET'])
def list_users():
    """
    Chỉ admin có thể xem danh sách người dùng.
    """
    current_user_id = session.get('user_id')
    print("list-user",session.get('user_id')) #debug
    
    
    current_user = db.session.get(User, current_user_id)
    
    # Lấy danh sách người dùng
    users = User.query.all()
    user_list = [{"username": u.username, "score": u.score, "is_admin": u.is_admin} for u in users]
    return jsonify(user_list), 200

@app.route('/check-session', methods=['POST'])
def check_session():
    try:
        data = request.json
        user_id = data.get('userId')  # Log dữ liệu nhận được

        if not user_id:
            print("No userId provided")
            return jsonify({"status": "failed", "message": "No user ID provided"}), 400

        # Kiểm tra thông tin người dùng trong cơ sở dữ liệu
        user = db.session.get(User, user_id)
        if not user:
            print(f"User ID {user_id} not found in database")
            return jsonify({"status": "failed", "message": "Invalid session"}), 401

        # Trả về thông tin người dùng nếu hợp lệ
        return jsonify({
            "status": "success",
            "userId": user.id,
            "username": user.username,
            "is_admin": user.is_admin,
            "score": user.score
        }), 200
    except Exception as e:
        # Catch any other unexpected errors and log them
        print(f"Error in check-session route: {e}")
        return jsonify({"status": "failed", "message": "An internal error occurred"}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    """
    API để xử lý yêu cầu cập nhật mật khẩu của người dùng.
    """
    try:
        # Lấy dữ liệu từ client
        data = request.json
        username = data.get('username')  # ten người dùng
        #current_password = data.get('currentPassword')  # Mật khẩu hiện tại (nếu cần xác thực)
        new_password = data.get('newPassword')  # Mật khẩu mới

        

        # Lấy người dùng từ database
        print(username)
        user = User.query.filter_by(username=data['username']).first()
        print(user) #debug
        if not user:
            return jsonify({"message": "User not found!"}), 404

        

        # Mã hóa và cập nhật mật khẩu mới
        hashed_new_pw = bcrypt.generate_password_hash(new_password).decode('utf-8')
        user.password = hashed_new_pw
        db.session.commit()

        return jsonify({"message": "Password updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def check_winner(board, player):
    # Kiểm tra hàng ngang, hàng dọc, và chéo
    for row in range(20):
        for col in range(20):
            if all(board[row][col + i] == player for i in range(5) if col + 4 < 20):
                return True
            if all(board[row + i][col] == player for i in range(5) if row + 4 < 20):
                return True
            if all(board[row + i][col + i] == player for i in range(5) if row + 4 < 20 and col + 4 < 20):
                return True
            if all(board[row + i][col - i] == player for i in range(5) if row + 4 < 20 and col - 4 >= 0):
                return True
    return False

# Proxy endpoint: Lấy danh sách phòng từ Flask-Socket.IO server
@app.route("/admin/rooms", methods=["GET"])
def get_rooms_from_socketio():
    try:
        # Lấy hostname từ request (ví dụ: "192.168.1.29")
        host = request.host.split(":")[0]
        api_url = f"http://{host}:5001"
        response = requests.get(f"{api_url}/admin/rooms")
        response.raise_for_status()  # Kiểm tra lỗi HTTP
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch rooms: {str(e)}"}), 500

@app.route("/admin/delete-room", methods=["POST"])
def delete_room_from_socketio():
    try:
        room_id = request.json.get("room_id")
        if not room_id:
            return jsonify({"error": "Room ID is required."}), 400
        host = request.host.split(":")[0]
        api_url = f"http://{host}:5001"
        response = requests.post(
            f"{api_url}/admin/delete-room",
            json={"room_id": room_id}
        )
        response.raise_for_status()  # Kiểm tra lỗi HTTP
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to delete room: {str(e)}"}), 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Khởi tạo bảng trong cơ sở dữ liệu
        create_default_admin()  # Thêm admin mặc định nếu chưa tồn tại
    app.run(debug=True,host="0.0.0.0")



    """Cách khởi tạo backend trước khi khởi chạy frontend
    tạo môi trường ảo:
    python -m venv venv
    Chạy môi trường:
    source venv/bin/activate
    Tải về các môi trương cần thiết:
    pip install flask
    Khởi chạy server:
    python app.py
    Cách đóng server:
    press Control+C to quit
    Nếu kết nối frontend từ thiết bị khác:
    1 chạy lệnh ipconfig để tìm địa chỉ ipv4 của thiết bị chạy server (ví dụ: 192.168.1.100)
    2 thay URL trong script.js (frontend):
        const response = await fetch("http://192.168.1.100:5000/ai-move", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board })
        });
    3 đảm bảo 2 thiết bị kết nối cùng mạng wifi (vì khác wifi dẫn đến khác địa chỉ ip)
    truy vấn caro_game.db:
    mở terminal và chạy lệnh:
        cd instance
        sqlite3 caro_game.db
    các câu lệnh truy vấn đơn giản:
        .tables
        .help
        SELECT * FROM user;
    """
