let BOARD_SIZE = 20;
let WINNING_COUNT = 5;
const EMPTY = '_';
const HUMAN = 'X';  // Người chơi
const AI = 'O';     // AI
let maxDepth = 3; // Mặc định Hard
let board = [];
let isHumanTurn = true;
let isGameOver = false;
const gameBoard = document.getElementById("game-board");
const message = document.getElementById("message");
// Lấy thông tin protocol (http hoặc https) và hostname hiện tại của trang
const protocol = window.location.protocol; // "http:" hoặc "https:"
const host = window.location.hostname;     // ví dụ: "localhost", "127.0.0.1", hoặc "192.168.1.29"

// Thiết lập các biến API_BASE_URL sử dụng protocol, hostname và cổng tương ứng
const API_BASE_URL_5000 = `${protocol}//${host}:5000`;
const API_BASE_URL_5001 = `${protocol}//${host}:5001`;

// Initialize the game board
function initializeBoard() {
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = ""; // Xóa bàn cờ cũ

    // Tạo bàn cờ mới
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener("click", handleHumanMove);
            gameBoard.appendChild(cell);
        }
    }

    // Điều chỉnh kích thước game board
    gameBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    document.getElementById("message").textContent = "";
    gameBoard.style.display = "none"; // Ẩn bàn cờ

}

function checkWin(player) {
    // Kiểm tra hàng
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - WINNING_COUNT + 1; col++) {
            if (board[row].slice(col, col + WINNING_COUNT).every(cell => cell === player)) {
                return true;
            }
        }
    }

    // Kiểm tra cột
    for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE - WINNING_COUNT + 1; row++) {
            let win = true;
            for (let i = 0; i < WINNING_COUNT; i++) {
                if (board[row + i][col] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }

    // Kiểm tra đường chéo chính
    for (let row = 0; row < BOARD_SIZE - WINNING_COUNT + 1; row++) {
        for (let col = 0; col < BOARD_SIZE - WINNING_COUNT + 1; col++) {
            let win = true;
            for (let i = 0; i < WINNING_COUNT; i++) {
                if (board[row + i][col + i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }

    // Kiểm tra đường chéo phụ
    for (let row = 0; row < BOARD_SIZE - WINNING_COUNT + 1; row++) {
        for (let col = WINNING_COUNT - 1; col < BOARD_SIZE; col++) {
            let win = true;
            for (let i = 0; i < WINNING_COUNT; i++) {
                if (board[row + i][col - i] !== player) {
                    win = false;
                    break;
                }
            }
            if (win) return true;
        }
    }

    return false;  // Không có chiến thắng
}
// check if Board is full
function isBoardFull() {
    return board.every(row => row.every(cell => cell !== EMPTY));
}


// Handle human move
function handleHumanMove(event) {
    if (!isHumanTurn||isGameOver) return;
    try{
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);

        if (board[row][col] !== EMPTY) {
            alert("Cell already taken! Choose another.");
            return;
        }

        board[row][col] = 'X';
        event.target.textContent = 'X';
        event.target.classList.add("X");
        event.target.classList.add("taken");

        // Kiểm tra hòa
        if (isBoardFull()) {
            message.textContent = "The game is a draw!";
            isGameOver = true;
            const score = 50; // Điểm có thể thay đổi theo chiến thắng hoặc thỏa thuận khác
            setTimeout(function () {
                alert("Game over, it's a draw! Your score: 50"); // Hiển thị thông báo hòa
            }, 1000);
            setTimeout(function() {
                updatePlayerScore(score); // Gửi điểm lên server
                //resetGame()
                //initializeBoard()
            }, 2000);
            return;
        }
        

        // Kiểm tra chiến thắng của người chơi
        if (checkWin(HUMAN)) {
            message.textContent = "You win!";
            isGameOver = true;
            const score = 100; // Điểm có thể thay đổi theo chiến thắng hoặc thỏa thuận khác
            setTimeout(function() {
                alert("Game over, You Wins! Your score: 100"); // Hiển thị thông báo điểm cho người chơi
            }, 1000);
            setTimeout(function() {
                updatePlayerScore(score); // Gửi điểm lên server
                //resetGame()
                //initializeBoard()
            }, 2000);
            return;
        }

        isHumanTurn = false;
        message.textContent = "AI is thinking...";
        getAIMove();
    } catch (error) {
    console.error("Error fetching HUMAN move:", error);
    message.textContent = "An error occurred. Please try again.";
}
}
// Get AI move from the server
async function getAIMove() {
    if (isGameOver||isHumanTurn) return;

    try {
        const boardData = {
            board,
            boardSize: BOARD_SIZE, // Gửi kích thước bàn cờ
            maxDepth: maxDepth     // Gửi độ khó
        };
        console.log("Sending data to server:", boardData);

        const response = await fetch(`${API_BASE_URL_5000}/ai-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(boardData)
        });

        const { row, col, winner } = await response.json();
        console.log("AI move:", row, col);

        if (row === -1 || col === -1) {
            message.textContent = "No valid moves left.";
            isGameOver = true;
            return;
        }
        // AI đặt O vào ô tương ứng
        board[row][col] = 'O';
        const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
        cell.textContent = 'O';
        cell.classList.add("O");
        cell.classList.add("taken");

        // if (winner) {
        //     message.textContent = `${winner} wins!`;
        //     isGameOver = true;
        //     setTimeout(function() {
        //         alert("Game over! Your score: 0"); // Hiển thị thông báo điểm cho người chơi
        //     }, 1000);
        //     //setTimeout(resetGame, 5000); // Reset game sau khi hiển thị thông báo
        //     return;
        // }

        // Kiểm tra hòa
        if (isBoardFull()) {
            message.textContent = "The game is a draw!";
            isGameOver = true;
            const score = 50; // Điểm có thể thay đổi theo chiến thắng hoặc thỏa thuận khác
            setTimeout(function () {
                alert("Game over, it's a draw! Your score: 50"); // Hiển thị thông báo hòa
            }, 1000);
            setTimeout(function() {
                updatePlayerScore(score); // Gửi điểm lên server
                //resetGame(); 
                //initializeBoard()
            }, 2000);
            return;
        }
        
        // Kiểm tra chiến thắng của AI
        if (checkWin(AI)) {
            message.textContent = "AI win!";
            isGameOver = true;
            const score = 0; // Điểm có thể thay đổi theo chiến thắng hoặc thỏa thuận khác
            setTimeout(function() {
                alert("Game over, AI Wins ! Your score: 0"); // Hiển thị thông báo điểm cho người chơi
            }, 1000);
            setTimeout(function() {
                updatePlayerScore(score); // Gửi điểm lên server
                //resetGame(); 
                //initializeBoard()
            }, 2000);
            return;
        }
        isHumanTurn = true;
        message.textContent = "Your turn! Place an X.";
    } catch (error) {
        console.error("Error fetching AI move:", error);
        message.textContent = "An error occurred. Please try again.";
    }
}

// Hàm cập nhật điểm số của người chơi
async function updatePlayerScore(score) {
    // Lấy ID người chơi từ session hoặc localStorage (nếu có)
    const userId = sessionStorage.getItem("userId"); // Hoặc từ session nếu bạn lưu ID người chơi

    if (!userId) {
        alert("User is not logged in.");
        return;
    }

    // Gửi điểm lên server
    try {
        const response = await fetch(`${API_BASE_URL_5000}/update-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score: score, userId: userId }), // Gửi thông tin người chơi và điểm số
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Score updated successfully!");
        } else {
            console.log("Error updating score:", data.message);
        }
    } catch (error) {
        console.error("Error sending score:", error);
    }
}
// Fetch Leaderboard
async function fetchLeaderboard() {
    const response = await fetch(`${API_BASE_URL_5000}/leaderboard`);
    const leaderboard = await response.json();

    const leaderboardElement = document.getElementById("leaderboard");
    leaderboardElement.innerHTML = leaderboard
        .map((user, index) => `
            <li class="leaderboard-item">
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${user.username}</span>
                <span class="leaderboard-score">${user.score}</span>
            </li>
        `)
        .join("");
}
// cập nhật bảng xếp hạng sau khi chọn nút reset
document.getElementById("reset-game").addEventListener("click", () => {
    // reset cục bộ
    isGameOver = false;
    isHumanTurn = true;
    initializeBoard(); // Tạo bàn cờ mới cho client này
    fetchLeaderboard(); // Cập nhật bảng xếp hạng
});


function renderBoard(board) {
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = ""; // Xóa nội dung cũ

    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");

            if (cell === "X") {
                cellElement.classList.add("X");
                cellElement.textContent = "X";
            } else if (cell === "O") {
                cellElement.classList.add("O");
                cellElement.textContent = "O";
            }

            gameBoard.appendChild(cellElement);
        });
    });
}


document.getElementById("start-game").addEventListener("click", () => {
    // Lấy tùy chọn từ giao diện
    BOARD_SIZE = parseInt(document.getElementById("board-size").value);
    maxDepth = parseInt(document.getElementById("difficulty").value);
    // Điều chỉnh WINNING_COUNT nếu BOARD_SIZE nhỏ
    WINNING_COUNT = BOARD_SIZE === 3 ? 3 : 5;
try{

    // Khởi tạo bàn cờ và trạng thái trò chơi
    isGameOver = false;
    initializeBoard();
    gameBoard.style.display = "grid"; // Ẩn bàn cờ



    // Xử lý lượt đi đầu tiên theo chế độ
    if (maxDepth === 3) {
        isHumanTurn = false;
        message.textContent = "AI is making the first move...";
        getAIMove();
    } else {
        isHumanTurn = true; // Người chơi đi trước
        message.textContent = "Your turn! Place an X.";
    }
} catch (error) {
    console.error("Error fetching AI move:", error);
    message.textContent = "An error occurred. Please try again.";
}

});

// Xử lý logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("userId"); // Xóa session
    window.location.href = "/index"; // Quay lại trang đăng nhập
});document.addEventListener("DOMContentLoaded", () => {
    const userId = sessionStorage.getItem("userId"); // Hoặc sessionStorage
    console.log(userId)
    if (userId) {
        // Nếu có userId trong session, giữ trạng thái đăng nhập và hiển thị trò chơi
        //document.getElementById("auth-section").style.display = "none";
        document.getElementById("settings").style.display = "block";
    } else {
        // Nếu không có userId trong session, hiển thị màn hình đăng nhập
        alert("User is not logged in.");
        window.location.href = "/index";
        
    }
});
// cập nhật bảng xếp hạng sau khi tải lại trang
document.addEventListener("DOMContentLoaded", fetchLeaderboard);



