
// Xử lý logout
document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("userId"); // Xóa session
    window.location.href = "index.html"; // Quay lại trang đăng nhập
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
