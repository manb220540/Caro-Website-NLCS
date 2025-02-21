
// // Xử lý logout
// document.getElementById("logout").addEventListener("click", () => {
//     localStorage.removeItem("userId"); // Xóa session
//     window.location.href = "index.html"; // Quay lại trang đăng nhập
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
//     if (!username||!password) {
//         alert("Please enter a username and password to create.");
//         return;
//     }
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
//             .map((user) => `<li>${user.username} - Score: ${user.score} - Admin: ${user.is_admin}</li>`)
//             .join("");
//         } else {
//             console.error("Invalid data received from the server");
//             alert("Error: Invalid data format.");
//         }
//     } catch (error) {
//         console.error("Error fetching user list:", error);
//     }
// });

// // Lấy danh sách phòng từ server Flask
// async function fetchRooms() {
//     try {
//         const response = await fetch("http://127.0.0.1:5000/admin/rooms");
//         const data = await response.json();

//         if (response.ok) {
//             console.log("Active Rooms:", data.rooms);
//             displayRooms(data.rooms);
//         } else {
//             console.error("Error fetching rooms:", data.error);
//             alert(`Error: ${data.error}`);
//         }
//     } catch (error) {
//         console.error("Error fetching rooms:", error);
//         alert("Failed to fetch rooms. Please try again later.");
//     }
// }

// // Hiển thị danh sách phòng trên giao diện
// function displayRooms(rooms) {
//     const roomsList = document.getElementById("rooms-list");
//     roomsList.innerHTML = "";

//     Object.keys(rooms).forEach((roomId) => {
//         const room = rooms[roomId];
//         const roomElement = document.createElement("li");

//         roomElement.textContent = `Room ID: ${roomId}, Board Size: ${room.board_size}, Players: ${room.players_count}`;
        
//         // Thêm nút xóa phòng
//         const deleteButton = document.createElement("button");
//         deleteButton.textContent = "Delete";
//         deleteButton.onclick = () => deleteRoom(roomId);

//         roomElement.appendChild(deleteButton);
//         roomsList.appendChild(roomElement);
//     });
// }

// // Xóa phòng
// async function deleteRoom(roomId) {
//     try {
//         const response = await fetch("http://127.0.0.1:5000/admin/delete-room", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ room_id: roomId }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//             alert(data.message);
//             fetchRooms(); // Cập nhật lại danh sách phòng
//         } else {
//             console.error("Error deleting room:", data.error);
//             alert(`Error: ${data.error}`);
//         }
//     } catch (error) {
//         console.error("Error deleting room:", error);
//         alert("Failed to delete room. Please try again later.");
//     }
// }

// // Gọi hàm fetchRooms khi nhấn nút "Show Rooms"
// document.getElementById("show-rooms-btn").addEventListener("click", fetchRooms);
// Hàm kiểm tra quyền admin
async function checkAdmin() {
    const userId = sessionStorage.getItem("userId");
    // const isAdmin = sessionStorage.getItem("isAdmin");
    if (!userId) {
        alert("No active session. Please log in.");
        window.location.href = "index.html";
        return false;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/check-session", {
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
        window.location.href = "index.html";
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
        const response = await fetch("http://127.0.0.1:5000/list-users", { method: "GET" });
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
        const response = await fetch("http://127.0.0.1:5000/add-admin", {
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
        const response = await fetch("http://127.0.0.1:5000/delete-user", {
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
        const response = await fetch("http://127.0.0.1:5000/reset-score", {
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
        const response = await fetch("http://127.0.0.1:5001/admin/rooms", { method: "GET" });
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
        const response = await fetch("http://127.0.0.1:5001/admin/delete-room", {
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
    window.location.href = "index.html"; // Quay lại trang đăng nhập
});

// Gọi các hàm khi nhấn nút tương ứng
document.getElementById("list-users").addEventListener("click", fetchUsers);
document.getElementById("add-admin").addEventListener("click", addAdmin);
document.getElementById("delete-user").addEventListener("click", deleteUser);
document.getElementById("reset-score").addEventListener("click", resetUserScore);
document.getElementById("show-rooms-btn").addEventListener("click", fetchRooms);
window.onload = checkAdmin; // Kiểm tra xem người dùng đã đăng nhập chưa
