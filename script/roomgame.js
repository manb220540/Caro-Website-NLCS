
const socket = io("http://127.0.0.1:5001");

// DOM Elements
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const leaveRoomBtn = document.getElementById("leave-room-btn");
const createRoomSection = document.getElementById("create-room");
const joinRoomSection = document.getElementById("join-room");
const gameArea = document.getElementById("game-area");
const gameBoard = document.getElementById("game-board");
const gameMessage = document.getElementById("game-message");
const roomInfo = document.getElementById("room-info");
const chatMessages = document.getElementById("chat-content");
const chatInput = document.getElementById("chat-input");
const roomId = document.getElementById("room-id");
const joinRoomId = document.getElementById("join-room-id");


// Lấy các phần tử DOM
const chatIcon = document.getElementById("chat-icon");
const chatBox = document.getElementById("chat-box");
const closeChat = document.getElementById("close-chat");

// Xử lý sự kiện khi nhấp vào icon chat
// chatIcon.addEventListener("click", () => {
//     chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
// });

// Xử lý sự kiện khi nhấp vào nút đóng
// closeChat.addEventListener("click", () => {
//     chatBox.style.display = "none";
// });
function toggleChat() {
    const chatBox = document.getElementById("chat-box");
    chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
}


let board = []; // Trạng thái bàn cờ
let currentPlayer = ""; // "X" hoặc "O"
let currentPlayerUsername = ""; // Người tạo phòng hoặc tham gia phòng
let currentTurn = ""; // Lượt đi hiện tại ("X" hoặc "O")
let isGameOver = false; // Trạng thái kết thúc trò chơi
let currentRoomId = ""; // ID phòng hiện tại




// Event Handlers for Menu
createRoomBtn.addEventListener("click", () => {
    createRoomSection.style.display = "block";
    joinRoomSection.style.display = "none";
    gameArea.style.display = "none";
});

joinRoomBtn.addEventListener("click", () => {
    createRoomSection.style.display = "none";
    joinRoomSection.style.display = "block";
    gameArea.style.display = "none";
});

// Tạo phòng
document.getElementById("create-room-submit").addEventListener("click", () => {
    const roomId = document.getElementById("room-id").value.trim();
    const boardSize = parseInt(document.getElementById("board-size").value);
    const username = prompt("Enter your username:");

    if (!roomId || !username) {
        alert("Please enter a valid username. Username are required to join a room.");
        return;
    }

    socket.emit("create_room", { room_id: roomId, board_size: boardSize, username });
    currentRoomId = roomId;
    currentPlayer = "X"; // Người tạo phòng là X
    currentPlayerUsername = username;
    console.log(`Joining room: ${roomId} as ${username}`); // Debug
});

// Tham gia phòng
document.getElementById("join-room-submit").addEventListener("click", () => {
    const roomId = document.getElementById("join-room-id").value.trim();
    const username = prompt("Enter your username:");

    if (!roomId || !username) {
        alert("Room ID and username are required to join a room.");
        return;
    }

    socket.emit("join_room", { room_id: roomId, username });
    currentRoomId = roomId;
    currentPlayer = "O"; // Người tham gia phòng là O
    currentPlayerUsername = username;
    console.log(`Joining room: ${roomId} as ${username}`); // Debug
});

// Gửi tin nhắn
document.getElementById("send-chat").addEventListener("click", () => {
    const message = chatInput.value.trim();

    if (!currentRoomId || !message) {
        alert("You must be in a room to send messages.");
        return;
    }

    if (message) {
        socket.emit("send_message", { room_id: currentRoomId, username: currentPlayerUsername, message: message });
        chatInput.value = ""; // Reset input
        console.log(`Message sent: ${message}`); // Debug
    }
});
function sendMessage() {
    const message = chatInput.value.trim();

    if (!currentRoomId) {
        alert("You must be in a room to send messages.");
        return;
    }
    if (!message) {
        alert("Please enter a message.");
        return;
    }

    if (message) {
        socket.emit("send_message", { room_id: currentRoomId, username: currentPlayerUsername, message: message });
        chatInput.value = ""; // Reset input
        console.log(`Message sent: ${message}`);// Debug
    }
}
document.getElementById("chat-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Nhận tin nhắn
socket.on("chat_message", (data) => {
    const newMessage = document.createElement("p");
    newMessage.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Tự động cuộn xuống
    console.log(`Message received: ${data.message} from ${data.username}`); // Debug
});
// Start Game Event
socket.on("start_game", (data) => {
    const { board_size, board: serverBoard, message, room_id, turn } = data;
    if (!serverBoard || !Array.isArray(serverBoard)) {
        console.error("Invalid board data from server:", data);
        return;
    }

    console.log("Data received from server:", data); // Debug line
    currentRoomId = room_id;
    currentTurn = turn; // Lượt đi đầu tiên
    board = serverBoard;
    isGameOver = false;

    roomInfo.textContent = `Room: ${room_id}`;
    gameArea.style.display = "block";
    createRoomSection.style.display = "none";
    joinRoomSection.style.display = "none";
    chatIcon.style.display = "block"; // Show Chat Icon

    initializeBoard(board_size, serverBoard);
    gameMessage.textContent = message;

    

    leaveRoomBtn.style.display = "block"; // Show Leave Room Button
    //chatBox.style.display = "block"; // Show Chat Box
    // Cập nhật thông báo
    if (currentPlayer === "X") {
        alert(`You are X. It's your turn!`);
    } else if (currentPlayer === "O") {
        alert(`You are O. Waiting for X to make a move.`);
    }
});

// Khởi tạo bàn cờ
function initializeBoard(boardSize, serverBoard) {
    board = serverBoard;
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    gameBoard.innerHTML = "";

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener("click", () => {
                if (!isGameOver && currentPlayer === currentTurn && board[i][j] === "_") {
                    makeMove(i, j);
                }
            });

            if (board[i][j] !== "_") {
                cell.textContent = board[i][j];
                cell.classList.add(board[i][j] === "X" ? "X" : "O");
            }

            gameBoard.appendChild(cell);
        }
    }
}
function makeMove(row, col) {
    socket.emit("make_move", { room_id: currentRoomId, player_name: currentPlayer, move: { row, col } }, (response) => {
        if (response && response.status === "success") {
            console.log("Move successful:", response);
        } else if (response && response.status === "error") {
            alert(response.message);
        } else {
            console.error("Unexpected response from server:", response);
        }
    });
}


// Xử lý sự kiện click vào ô
function handleCellClick(row, col) {
    if (isGameOver) {
        alert("The game is over. Please start a new game.");
        return;
    }

    if (currentPlayer !== currentTurn) {
        alert("It's not your turn!");
        return;
    }

    if (board[row][col] !== "_") {
        alert("This cell is already taken!");
        return;
    }

    // Gửi nước đi lên server
    socket.emit("make_move", { room_id: currentRoomId, player_name: currentPlayer, move: { row, col } }, (response) => {
        if (response && response.status === "success") {
            console.log("Move successful:", response);
        } else if (response && response.status === "error") {
            alert(response.message);
        } else {
            console.error("Unexpected response from server:", response);
        }
    });
}


// Lắng nghe sự kiện từ server: cập nhật bàn cờ
socket.on("update_board", (data) => {
    const { board: updatedBoard, turn, isGameOver: gameStatus, winner } = data;

    board = updatedBoard;
    currentTurn = turn;
    isGameOver = gameStatus;
    renderBoard(board.length);

    if (isGameOver) {
        if (winner) {
            gameMessage.textContent = `${winner} wins!`;
            setTimeout(function() {
                alert(`${winner} wins!`);
            }, 1000);
        } else {
            gameMessage.textContent = "It's a draw!";
            setTimeout(function() {
                alert("The game is a draw!");
            }, 1000);
        }
    } else {
        gameMessage.textContent = `It's ${currentTurn}'s turn.`;
    }
});

// Vẽ lại bàn cờ
function renderBoard(size) {
    if (!board || !Array.isArray(board) || board.length === 0) return;
    gameBoard.innerHTML = "";

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;

            if (board[i][j] === "X" || board[i][j] === "O") {
                cell.textContent = board[i][j];
                cell.classList.add(board[i][j] === "X" ? "X" : "O");
                cell.classList.add("taken");
            }

            cell.addEventListener("click", () => handleCellClick(i, j));
            gameBoard.appendChild(cell);
        }
    }
}

//hide leave room button when not in a room
leaveRoomBtn.style.display = "none";

// Leave Room Event
// Rời phòng

leaveRoomBtn.addEventListener("click", () => {
    socket.emit("leave_room", { room_id: currentRoomId });
    alert("You have left the room.");
    resetGame();
});

// Reset trò chơi
function resetGame() {
    currentRoomId = "";
    currentPlayer = "";
    currentTurn = "";
    isGameOver = false;

    gameArea.style.display = "none";
    createRoomSection.style.display = "none";
    joinRoomSection.style.display = "none";
    leaveRoomBtn.style.display = "none";
    chatBox.style.display = "none"; // hide Chat Box
    chatIcon.style.display = "none"; // hide Chat Icon

    gameBoard.innerHTML = "";
    gameMessage.textContent = "";
    roomInfo.textContent = "";
    chatMessages.innerHTML = "";
    roomId.value= "";
    joinRoomId.value = "";
    
}

// Khi phòng bị đóng
socket.on("room_closed", (data) => {
    alert(data.message);
    resetGame();
    // Xóa lịch sử tin nhắn trên giao diện
    chatMessages.innerHTML = "";
});

function checkAuth() {  
    const userId = sessionStorage.getItem("userId"); // Hoặc từ sessionStorage
    console.log(userId)
    if (!userId) {
        alert("User is not logged in.");
        window.location.href = "index.html";
        return false;
    }
    return true;
}

window.onload = checkAuth; // Kiểm tra xem người dùng đã đăng nhập chưa