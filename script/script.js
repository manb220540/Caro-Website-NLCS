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

        const response = await fetch("http://127.0.0.1:5000/ai-move", {
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
        const response = await fetch("http://127.0.0.1:5000/update-score", {
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
    const response = await fetch("http://127.0.0.1:5000/leaderboard");
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
    window.location.href = "index.html"; // Quay lại trang đăng nhập
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
        window.location.href = "index.html";
        
    }
});
// cập nhật bảng xếp hạng sau khi tải lại trang
document.addEventListener("DOMContentLoaded", fetchLeaderboard);





// async function updatePlayerScore(score) {
//     const userId = sessionStorage.getItem("userId"); // or localStorage, tùy bạn
//     if (!userId) {
//         alert("User is not logged in.");
//         return;
//     }

//     try {
//         const response = await fetch("http://127.0.0.1:5000/update-score", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ score, userId }),
//         });

//         const data = await response.json();
//         if (response.ok) {
//             console.log("Score updated successfully!");
//             // CẬP NHẬT BẢNG XẾP HẠNG TRÊN TRÌNH DUYỆT NGƯỜI THẮNG
//             if (data.leaderboard) {
//                 renderLeaderboard(data.leaderboard); 
//             }
//         } else {
//             console.log("Error updating score:", data.message);
//         }
//     } catch (error) {
//         console.error("Error sending score:", error);
//     }
// }

// function renderLeaderboard(leaderboard) {
//     const leaderboardElement = document.getElementById("leaderboard");
//     leaderboardElement.innerHTML = leaderboard
//         .map((user, index) => `
//             <li class="leaderboard-item">
//                 <span class="leaderboard-rank">${index + 1}</span>
//                 <span class="leaderboard-name">${user.username}</span>
//                 <span class="leaderboard-score">${user.score}</span>
//             </li>
//         `)
//         .join("");
// }



// // Khi ván chơi kết thúc, reset lại trạng thái trò chơi
// function resetGame() {
//     // Reset trạng thái game mà không ảnh hưởng đến session người dùng
//     isGameOver = false;
//     isHumanTurn = true;
//     board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
//     try{

//         // Khởi tạo bàn cờ và trạng thái trò chơi
//         isGameOver = false;
//         initializeBoard();
    
//         // Xử lý lượt đi đầu tiên theo chế độ
//         if (maxDepth === 3) {
//             isHumanTurn = false;
//             //message.textContent = "AI is making the first move...";
//             getAIMove();
//         } else {
//             isHumanTurn = true; // Người chơi đi trước
//             //message.textContent = "Your turn! Place an X.";
//         }
//     } catch (error) {
//         console.error("Error fetching AI move:", error);
//         message.textContent = "An error occurred. Please try again.";
//     }
// }


// // Logout
// document.getElementById("logout").addEventListener("click", async () => {
//     const response = await fetch("http://127.0.0.1:5000/logout", { method: "POST" });
//     const data = await response.json();
//     alert(data.message);
//     // Hiển thị lại phần đăng nhập
//     document.getElementById("auth-section").style.display = "block";
//     document.getElementById("settings").style.display = "none";
//     // Xóa giá trị trong trường nhập mật khẩu
//     document.getElementById("password").value = "";
// });
// document.addEventListener("DOMContentLoaded", () => {
//     const userId = localStorage.getItem("userId");
//     if (!userId) {
//         // Nếu không tìm thấy userId, quay lại trang đăng nhập
//         window.location.href = "index.html";
//     }
// });


// // Register
// document.getElementById("register").addEventListener("click", async () => {
//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;
//     try {
//     const response = await fetch("http://127.0.0.1:5000/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//     });

//     const data = await response.json();
//     if (response.ok) {
//         alert(data.message);  // Nếu đăng ký thành công
//         // Xóa giá trị trong các ô input
//         document.getElementById("username").value = "";
//         document.getElementById("password").value = "";
//     } else {
//         // Nếu có lỗi (username đã tồn tại), hiển thị thông báo lỗi
//         alert(data.message);
//         // Làm sạch input
//         document.getElementById("username").value = "";
//         document.getElementById("password").value = "";
//     }

//     } catch (error) {
//         console.error("Error:", error);
//         alert("An error occurred. Please try again.");
//     }
// });

// // Login
// document.getElementById("login").addEventListener("click", async () => {
//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;

//     const response = await fetch("http://127.0.0.1:5000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//     });

//     const data = await response.json();
//     alert(data.message);
//     if (response.ok) {
//         // Sau khi đăng nhập thành công, lưu userId vào localStorage
//         localStorage.setItem("userId", data.userId); // Lưu userId từ phản hồi
//         document.getElementById("auth-section").style.display = "none";
//         document.getElementById("settings").style.display = "block";
//     }
// });




// // Hiển thị admin panel nếu người dùng là admin
// document.addEventListener("DOMContentLoaded", async () => {
//     const userId = localStorage.getItem("userId");

//     if (!userId) return;

//     const response = await fetch("http://127.0.0.1:5000/check-session", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId }),
//         credentials: 'include'  // Đảm bảo gửi cookie (session) trong yêu cầu
//     });

//     const data = await response.json();
//     if (response.ok && data.is_admin) {
//         document.getElementById("admin-panel").style.display = "block";
//     }
// });

// // Thêm tài khoản Admin mới
// document.getElementById("add-admin").addEventListener("click", async () => {
//     const username = document.getElementById("new-admin-username").value;
//     const password = document.getElementById("new-admin-password").value;

//     const response = await fetch("http://127.0.0.1:5000/add-admin", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//         credentials: 'include'  // Đảm bảo gửi cookie (session) trong yêu cầu
//     });

//     const data = await response.json();
//     alert(data.message);
//     if (response.ok) {
//         document.getElementById("new-admin-username").value = "";
//         document.getElementById("new-admin-password").value = "";
//     }
// });
// // Xoá tài khoản 
// document.getElementById("delete-user").addEventListener("click", async () => {
//     const username = document.getElementById("delete-username").value;  // Lấy tên người dùng cần xóa
    
//     if (!username) {
//         alert("Please enter a username to delete.");
//         return;
//     }

//     try {
//         const response = await fetch("http://127.0.0.1:5000/delete-user", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username: username }),  // Gửi tên người dùng muốn xóa
//             credentials: 'include',  // Đảm bảo cookie session được gửi
//         });

//         const data = await response.json();
//         alert(data.message);

//         if (response.ok) {
//             document.getElementById("delete-username").value = "";  // Reset ô input sau khi xóa
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert("An error occurred while trying to delete the user.");
//     }
// });


// // Reset điểm số người dùng
// document.getElementById("reset-score").addEventListener("click", async () => {
//     const username = document.getElementById("reset-username").value;
//     const response = await fetch("http://127.0.0.1:5000/reset-score", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
                    
//         body: JSON.stringify({ username }),
//         credentials: 'include'  // Đảm bảo gửi cookie (session) trong yêu cầu
//     });

//     const data = await response.json();
//     alert(data.message);
//     if (response.ok) {
//         document.getElementById("reset-username").value = "";
//     }
// });

// // Hiển thị danh sách người dùng
// async function checkAdmin() {
//     const userId = localStorage.getItem("userId");
//     if (!userId) {
//         alert("No active session. Please log in.");
//         window.location.href = "authentication.html";
//         return false;
//     }

//     const response = await fetch("http://127.0.0.1:5000/check-session", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId }),
//         credentials: 'include'  // Đảm bảo gửi cookie (session) trong yêu cầu
//     });
//     console.log(userId) //debug

//     const data = await response.json();
//     console.log(data)
//     if (response.ok && data.is_admin) {
//         return true;  // User là admin
//     }

//     alert(data.message || "Unauthorized access");
//     return false;  // User không phải admin
// }

// // Gọi trước khi hiển thị danh sách người dùng
// document.getElementById("list-users").addEventListener("click", async () => {
//     const isAdmin = await checkAdmin();
//     if (!isAdmin) return;  // Dừng nếu không phải admin

//     // Nếu là admin, gọi API để lấy danh sách người dùng
//     try {
//         const response = await fetch("http://127.0.0.1:5000/list-users", {
//             method: "GET",
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             console.error("Error:", errorData.message);
//             alert(errorData.message || "Unauthorized access");
//             return;
//         }

//         const users = await response.json();
//         if (Array.isArray(users)) {
//             const userListElement = document.getElementById("user-list");
//             userListElement.innerHTML = users
//                 .map((user) => `<li>${user.username} - Score: ${user.score} - Admin: ${user.is_admin}</li>`)
//                 .join("");
//         } else {
//             console.error("Invalid data received from the server");
//             alert("Error: Invalid data format.");
//         }
//     } catch (error) {
//         console.error("Error fetching user list:", error);
//     }
// });




// // Khi trò chơi kết thúc, không xóa session người dùng
// function endGame() {
//     // Reset trạng thái trò chơi mà không xóa session
//     isGameOver = true;
//     message.textContent = "Game over! Your final score: " + finalScore;

//     // Không thực hiện bất kỳ thao tác nào với session ở đây
// }






// function checkAuth() {  
//     const userId = sessionStorage.getItem("userId"); // Hoặc từ sessionStorage
//     console.log(userId)
//     if (!userId) {
//         alert("User is not logged in.");
//         window.location.href = "index.html";
//         return false;
//     }
//     return true;
// }

// window.onload = checkAuth; // Kiểm tra xem người dùng đã đăng nhập chưa