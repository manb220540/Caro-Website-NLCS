
// Xử lý logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("userId"); // Xóa session
    window.location.href = "/index"; // Quay lại trang đăng nhập
});


document.addEventListener("DOMContentLoaded", () => {
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


document.addEventListener("DOMContentLoaded", function () {
    createBoard();

    // Nút 'Bắt đầu lại' -> Xóa & tạo lại bàn cờ rỗng
    document.getElementById("start-game").addEventListener("click", function () {
        createBoard();
    });

    // Nút 'Tạo cây trò chơi' -> Đọc bàn cờ + Sinh cây Minimax
    let generateTreeButton = document.getElementById("generate-tree");
    if (generateTreeButton) {
        generateTreeButton.addEventListener("click", function () {
            readBoardState(); // Đọc bàn cờ và hiển thị + tạo cây
        });
    } else {
        console.error("Element with ID 'generate-tree' not found!");
    }
});

/************************************
 * 1) TẠO BÀN CỜ 3x3 ĐỂ NGƯỜI DÙNG NHẬP
 ************************************/
function createBoard() {
    const boardContainer = document.getElementById("board");
    boardContainer.innerHTML = "";

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let cell = document.createElement("input");
            cell.type = "text";
            cell.maxLength = 1;
            cell.className = "cell";
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.style.textAlign = "center";

            // Lắng nghe sự kiện input
            cell.addEventListener("input", function () {
                let val = this.value.toUpperCase();
                // Xóa class cũ
                this.classList.remove("X", "O");
                if (val !== "" && val !== "X" && val !== "O") {
                    alert("Chỉ cho phép nhập X hoặc O!");
                    this.value = ""; // Xóa ký tự không hợp lệ
                }else {
                    this.value = val; // Cập nhật chữ in hoa
                    // Thêm class X hoặc O nếu hợp lệ
                    if (val === "X") this.classList.add("X");
                    else if (val === "O") this.classList.add("O");
                }
            });

            boardContainer.appendChild(cell);
        }
    }
}

/************************************
 * 2) ĐỌC BÀN CỜ VÀ HIỂN THỊ
 ************************************/
function readBoardState() {
    let boardState = [];
    const cells = document.querySelectorAll(".cell");

    for (let i = 0; i < 3; i++) {
        let row = [];
        for (let j = 0; j < 3; j++) {
            let cell = cells[i * 3 + j];
            let value = cell.value.toUpperCase();
            // Chỉ chấp nhận X, O, hoặc rỗng
            if (value !== "X" && value !== "O" && value !== "") value = "";
            row.push(value);
        }
        boardState.push(row);
    }

    console.log("Bàn cờ hiện tại:", boardState);
    displayBoardState(boardState);

    // Lưu vào biến toàn cục board
    board = boardState;
    // Lấy độ sâu người dùng nhập
    let depthInput = parseInt(document.getElementById("max-depth").value, 10);
    if (isNaN(depthInput) || depthInput < 1) {
        depthInput = 10; // Mặc định
    }

    // Gọi hàm sinh cây Minimax (bắt đầu từ trạng thái này)
    generateTree(3, 3, depthInput); // boardSize=3, winningCount=3
}

// Hiển thị bàn cờ người dùng vừa nhập
function displayBoardState(boardState) {
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = "";
    let table = document.createElement("table");

    for (let i = 0; i < 3; i++) {
        let rowEl = document.createElement("tr");
        for (let j = 0; j < 3; j++) {
            let cellEl = document.createElement("td");
            cellEl.textContent = boardState[i][j] || "-";
            rowEl.appendChild(cellEl);
        }
        table.appendChild(rowEl);
    }
    gameBoard.appendChild(table);
}

/************************************
 * 3) CÁC HẰNG VÀ HÀM CẦN THIẾT CHO MINIMAX
 ************************************/
const MAX_DEPTH = 10;
const HUMAN = 'X';
const AI = 'O';
const EMPTY = '_';

let board = []; // Mảng 2D

// Đếm số X và O => quyết định lượt tiếp theo
function checkNextMoveOfBoard(board2D) {
    let xCount = 0, oCount = 0;
    let result=""
    for (let row of board2D) {
        for (let cell of row) {
            if (cell === 'X') xCount++;
            if (cell === 'O') oCount++;
        }
    }
    // Nếu số X <= số O => lượt tiếp theo là X, ngược lại là O
    if (xCount == oCount) {
        result="O";
    } else if (xCount < oCount) {
        result="O";
    } else if (xCount > oCount) {
        result="X";
    }
    return result;
}

function isMovesLeft() {
    // Nếu còn EMPTY ('_') hoặc '' thì vẫn còn nước
    return board.some(row => row.includes(EMPTY) || row.includes(''));
}

// Chuyển 2D -> 1D (dùng cho checkWinner)
function flattenBoard2D(board2D) {
    return board2D.flat().map(cell => cell || '');
}

// Kiểm tra thắng 3x3 (dùng mảng 1D)
function checkWinner(oneD) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8], // Hàng ngang
        [0,3,6], [1,4,7], [2,5,8], // Hàng dọc
        [0,4,8], [2,4,6]           // Đường chéo
    ];
    for (let [a,b,c] of lines) {
        if (oneD[a] && oneD[a] === oneD[b] && oneD[a] === oneD[c]) {
            return oneD[a]; // 'X' hoặc 'O'
        }
    }
    // Nếu không còn rỗng => hòa
    if (!oneD.includes('')) return 'draw';
    return null; // Vẫn chưa kết thúc
}

/************************************
 * 4) EVALUATE + ALPHA-BETA
 ************************************/
function findBoundingBox(boardSize) {
    let minRow = boardSize, maxRow = -1, minCol = boardSize, maxCol = -1;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] !== EMPTY && board[i][j] !== '') {
                minRow = Math.min(minRow, i);
                maxRow = Math.max(maxRow, i);
                minCol = Math.min(minCol, j);
                maxCol = Math.max(maxCol, j);
            }
        }
    }
    if (minRow > 0) minRow--;
    if (maxRow < boardSize - 1) maxRow++;
    if (minCol > 0) minCol--;
    if (maxCol < boardSize - 1) maxCol++;
    return { minRow, maxRow, minCol, maxCol };
}

function evaluateLine(line, winningCount) {
    const countAI = line.filter(cell => cell === AI).length;
    const countHuman = line.filter(cell => cell === HUMAN).length;
    if (countAI === winningCount) return 100;
    if (countHuman === winningCount) return -100;
    return 0;
}

// Tính điểm bàn cờ (nếu chưa kết thúc)
function evaluate(minRow, maxRow, minCol, maxCol, boardSize, winningCount) {
    let score = 0;
    // Hàng
    for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCol; j <= maxCol - winningCount + 1; j++) {
            let rowSlice = board[i].slice(j, j + winningCount);
            score += evaluateLine(rowSlice, winningCount);
        }
    }
    // Cột
    for (let j = minCol; j <= maxCol; j++) {
        for (let i = minRow; i <= maxRow - winningCount + 1; i++) {
            let colSlice = [];
            for (let k = 0; k < winningCount; k++) {
                colSlice.push(board[i + k][j]);
            }
            score += evaluateLine(colSlice, winningCount);
        }
    }
    // Chéo
    for (let i = minRow; i <= maxRow - winningCount + 1; i++) {
        for (let j = minCol; j <= maxCol - winningCount + 1; j++) {
            let diag1 = [];
            let diag2 = [];
            for (let k = 0; k < winningCount; k++) {
                diag1.push(board[i + k][j + k]);
                diag2.push(board[i + k][j + (winningCount - k - 1)]);
            }
            score += evaluateLine(diag1, winningCount);
            score += evaluateLine(diag2, winningCount);
        }
    }
    return score;
}

function getPotentialMoves(minRow, maxRow, minCol, maxCol) {
    let potentialMoves = [];
    for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCol; j <= maxCol; j++) {
            if (board[i][j] === EMPTY || board[i][j] === '') {
                potentialMoves.push([i, j]);
            }
        }
    }
    return potentialMoves;
}

/************************************
 * 5) MINIMAX (LƯU TRẠNG THÁI CUỐI)
 ************************************/
// Thay đổi: nếu depth===0 => gán node gốc cho tree, thay vì tạo node con
function minimax(
    depth, alpha, beta, isMaximizing, maxDepth,
    minRow, maxRow, minCol, maxCol,
    boardSize, winningCount, tree
) {
    // Nếu là lần gọi đầu tiên (depth=0) => tạo node gốc
    let currentNode;
    if (depth === 0) {
        // Lần đầu => gán trực tiếp vào 'tree'
        currentNode = {
            board: JSON.parse(JSON.stringify(board)),
            result: null,
            children: []
        };
        // Sao chép sang 'tree'
        Object.assign(tree, currentNode);
    } else {
        // Từ depth=1 trở đi => tạo node con
        currentNode = {
            board: JSON.parse(JSON.stringify(board)),
            result: null,
            children: []
        };
        tree.children.push(currentNode);
        // 'tree' bây giờ chuyển sang node con
        tree = currentNode;
    }

    // Kiểm tra tình trạng kết thúc
    let flat = flattenBoard2D(board);
    let w = checkWinner(flat);
    if (w === 'X') {
        currentNode.result = 'X wins';
        return 100;
    } else if (w === 'O') {
        currentNode.result = 'O wins';
        return -100;
    } else if (w === 'draw') {
        currentNode.result = 'draw';
        return 0;
    }

    // Chưa kết thúc => tính điểm tạm
    let score = evaluate(minRow, maxRow, minCol, maxCol, boardSize, winningCount);

    // Dừng nếu đạt độ sâu hoặc hết nước
    if (depth === maxDepth) {
        currentNode.result = 'Max depth reached';
        return score;
    }
    if (!isMovesLeft()) {
        currentNode.result = 'No moves left';
        return score;
    }

    // Danh sách nước đi
    let potentialMoves = getPotentialMoves(minRow, maxRow, minCol, maxCol);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of potentialMoves) {
            // AI
            board[move[0]][move[1]] = AI;
            let eval = minimax(
                depth + 1, alpha, beta, false, maxDepth,
                minRow, maxRow, minCol, maxCol,
                boardSize, winningCount,
                currentNode // node hiện tại
            );
            board[move[0]][move[1]] = '';
            if (eval > maxEval) {
                maxEval = eval;
            }
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of potentialMoves) {
            // HUMAN
            board[move[0]][move[1]] = HUMAN;
            let eval = minimax(
                depth + 1, alpha, beta, true, maxDepth,
                minRow, maxRow, minCol, maxCol,
                boardSize, winningCount,
                currentNode
            );
            board[move[0]][move[1]] = '';
            if (eval < minEval) {
                minEval = eval;
            }
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

/*********************************
 * VẼ CÂY TRÒ CHƠI BẰNG D3
 ********************************/
function initializeBoard(boardState) {
    board = JSON.parse(JSON.stringify(boardState)); // copy 2D array
}

// Vẽ nút hình vuông + hiển thị 3 dòng + kết quả
function drawTree(treeData) {
    d3.select("#tree").html("");
    const width = 800, height = 600;
    const svg = d3.select("#tree").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    const root = d3.hierarchy(treeData, d => d.children);
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);
  
    // Vẽ line
    svg.selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x + 50)
      .attr("y1", d => d.source.y + 50)
      .attr("x2", d => d.target.x + 50)
      .attr("y2", d => d.target.y + 50)
      .attr("stroke", "black");
  
    // Vẽ node
    const nodes = svg.selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x + 50},${d.y + 50})`);
  
    // Vẽ hình vuông
    nodes.append("rect")
      .attr("width", 60)
      .attr("height", 60)
      .attr("x", -30)
      .attr("y", -30)
      .attr("fill", "lightblue")
      .attr("stroke", "black");
  
    // Vẽ text (3 dòng hiển thị bàn cờ + 1 dòng kết quả)
    nodes.each(function(d) {
        const group = d3.select(this);
      
        // Lấy 3 dòng (mỗi dòng 3 ký tự) + kết quả (nếu có)
        let lines = formatBoardText(d.data.board); // VD: ["XO_", "OXO", "X_O"]
        if (d.data.result) {
          lines.push(`(${d.data.result})`);
        }
      
        // Tạo thẻ <text> gốc
        let textEl = group.append("text")
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "black");
      
        // Với mỗi dòng, ta tạo 1 <tspan> "dòng cha"
        // rồi "chia nhỏ" dòng thành từng ký tự để tô màu
        lines.forEach((line, lineIndex) => {
          // Tạo 1 <tspan> đại diện cho dòng
          let lineTspan = textEl.append("tspan")
            .attr("x", 0)
            // Dòng đầu nâng lên, dòng sau xuống 15px
            .attr("dy", lineIndex === 0 ? -10 : 15);
      
          // Chia dòng thành từng ký tự
          // Mỗi ký tự là 1 <tspan> con
          // dx nhỏ để các ký tự không cách nhau quá xa
          line.split("").forEach((ch, charIndex) => {
            // Xác định màu chữ
            let color = "black";
            if (ch === "X") color = "red";
            if (ch === "O") color = "blue";
            if (ch === "_") ch = "_"; // Ký tự trống
      
            lineTspan.append("tspan")
              .attr("dx", charIndex === 0 ? 0 : 6) // Mỗi ký tự cách 6px
              .style("fill", color)
              .text(ch);
          });
        });
      });

      
}

// Format 3 dòng
function formatBoardText(board2D) {
    return board2D.map(row =>
        // Với mỗi hàng, nếu cell === "" thì thay = "_"
        row.map(cell => cell === "" ? "_" : cell).join("")
    );
}

/*********************************
 * HÀM TẠO CÂY TỪ BÀN CỜ
 ********************************/
function generateTree(boardSize, winningCount, userDepth) {
    // 1) Xác định ai đi tiếp
    let nextMove = checkNextMoveOfBoard(board);
    let isMax = (nextMove === 'X');

    // 2) Tạo object rỗng cho cây
    let tree = {};

    // 3) Tìm bounding box
    let { minRow, maxRow, minCol, maxCol } = findBoundingBox(boardSize);

    // 4) Gọi Minimax (depth=0)
    minimax(
      0, -Infinity, Infinity, isMax,
      userDepth,
      minRow, maxRow, minCol, maxCol,
      boardSize, winningCount,
      tree
    );

    // 5) Vẽ cây
    drawTree(tree);
}
