

// Lấy thông tin protocol (http hoặc https) và hostname hiện tại của trang
const protocol = window.location.protocol; // "http:" hoặc "https:"
const host = window.location.hostname;     // ví dụ: "localhost", "127.0.0.1", hoặc "192.168.1.29"

// Thiết lập các biến API_BASE_URL sử dụng protocol, hostname và cổng tương ứng
const API_BASE_URL_5000 = `${protocol}//${host}:5000`;
const API_BASE_URL_5001 = `${protocol}//${host}:5001`;

// // Gọi hàm fetchRooms khi nhấn nút "Show Rooms"
// document.getElementById("show-rooms-btn").addEventListener("click", fetchRooms);
// Hàm kiểm tra quyền admin
async function checkAdmin() {
    const userId = sessionStorage.getItem("userId");
    // const isAdmin = sessionStorage.getItem("isAdmin");
    if (!userId) {
        alert("No active session. Please log in.");
        window.location.href = "/index";
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL_5000}/check-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
            credentials: "include", // Gửi cookie trong yêu cầu
        });

        const data = await response.json();
        if (response.ok && data.is_admin) {
            return true; // User là admin
        }

        alert(data.message || "Unauthorized access");
        window.location.href = "/index";
        return false; // Không phải admin
    } catch (error) {
        console.error("Error checking admin:", error);
        alert("Error verifying admin privileges. Please try again later.");
        return false;
    }
}

// Hàm hiển thị danh sách người dùng
async function fetchUsers() {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    try {
        const response = await fetch(`${API_BASE_URL_5000}/list-users`, { method: "GET" });
        const users = await response.json();

        if (response.ok) {
            const userListElement = document.getElementById("user-list");
            userListElement.innerHTML = users
                .map(
                    (user) =>
                        `<li>${user.username} - Score: ${user.score} - Admin: ${user.is_admin}</li>`
                )
                .join("");
        } else {
            console.error("Error fetching user list:", users.message);
            alert(users.message || "Unauthorized access");
        }
    } catch (error) {
        console.error("Error fetching user list:", error);
    }
}

// Thêm admin mới
async function addAdmin() {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    const username = document.getElementById("new-admin-username").value;
    const password = document.getElementById("new-admin-password").value;

    if (!username || !password) {
        alert("Please enter a username and password to create.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL_5000}/add-admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include", // Gửi cookie trong yêu cầu
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            document.getElementById("new-admin-username").value = "";
            document.getElementById("new-admin-password").value = "";
        }
    } catch (error) {
        console.error("Error adding admin:", error);
        alert("An error occurred while adding the admin.");
    }
}

// Xóa người dùng
async function deleteUser() {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    const username = document.getElementById("delete-username").value;

    if (!username) {
        alert("Please enter a username to delete.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL_5000}/delete-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
            credentials: "include",
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            document.getElementById("delete-username").value = "";
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while trying to delete the user.");
    }
}

// Reset điểm số người dùng
async function resetUserScore() {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    const username = document.getElementById("reset-username").value;
    if (!username) {
        alert("Please enter a username to reset score.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL_5000}/reset-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
            credentials: "include",
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            document.getElementById("reset-username").value = "";
        }
    } catch (error) {
        console.error("Error resetting user score:", error);
    }
}

// Lấy danh sách phòng
async function fetchRooms() {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    try {
        const response = await fetch(`${API_BASE_URL_5000}/admin/rooms`, { method: "GET" });
        const data = await response.json();

        if (response.ok) {
            console.log("Active Rooms:", data.rooms);
            displayRooms(data.rooms);
        } else {
            console.error("Error fetching rooms:", data.error);
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error fetching rooms:", error);
        alert("Failed to fetch rooms. Please try again later.");
    }
}

// Hiển thị danh sách phòng
function displayRooms(rooms) {
    const roomsList = document.getElementById("rooms-list");
    roomsList.innerHTML = "";

    // Kiểm tra nếu rooms rỗng
    if (Object.keys(rooms).length === 0) {
        const noRoomElement = document.createElement("li");
        noRoomElement.textContent = "No room was created.";
        roomsList.appendChild(noRoomElement);
        return;
    }

    // Nếu rooms không rỗng, hiển thị danh sách các phòng
    Object.keys(rooms).forEach((roomId) => {
        const room = rooms[roomId];
        const roomElement = document.createElement("li");
        
        roomElement.textContent = `Room ID: ${roomId}, Board Size: ${room.board_size}, Players: ${room.players_count}`;
        // Thêm nút xóa phòng
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteRoom(roomId);

        roomElement.appendChild(deleteButton);
        roomsList.appendChild(roomElement);
    });
}




// Xóa phòng
async function deleteRoom(roomId) {
    if (!(await checkAdmin())) return; // Dừng nếu không phải admin

    try {
        const response = await fetch(`${API_BASE_URL_5000}/admin/delete-room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room_id: roomId }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            fetchRooms(); // Cập nhật lại danh sách phòng
        } else {
            console.error("Error deleting room:", data.error);
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error deleting room:", error);
        alert("Failed to delete room. Please try again later.");
    }
}

// Đăng xuất
document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("userId"); // Xóa session
    window.location.href = "/index"; // Quay lại trang đăng nhập
});

// Gọi các hàm khi nhấn nút tương ứng
document.getElementById("list-users").addEventListener("click", fetchUsers);
document.getElementById("add-admin").addEventListener("click", addAdmin);
document.getElementById("delete-user").addEventListener("click", deleteUser);
document.getElementById("reset-score").addEventListener("click", resetUserScore);
document.getElementById("show-rooms-btn").addEventListener("click", fetchRooms);
window.onload = checkAdmin; // Kiểm tra xem người dùng đã đăng nhập chưa
