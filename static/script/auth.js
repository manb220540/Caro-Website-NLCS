
// Đăng nhập
// Lấy thông tin protocol (http hoặc https) và hostname hiện tại của trang
const protocol = window.location.protocol; // "http:" hoặc "https:"
const host = window.location.hostname;     // ví dụ: "localhost", "127.0.0.1", hoặc "192.168.1.29"

// Thiết lập các biến API_BASE_URL sử dụng protocol, hostname và cổng tương ứng
const API_BASE_URL_5000 = `${protocol}//${host}:5000`;
const API_BASE_URL_5001 = `${protocol}//${host}:5001`;
let loginAttempts = 0; // Biến đếm số lần đăng nhập thất bại
document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Ngừng việc gửi form mặc định

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL_5000}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Lưu vào sessionStorage để đảm bảo an toàn
            sessionStorage.setItem("userId", data.userId);
            // sessionStorage.setItem("is_admin", data.is_admin);
            //localStorage.setItem("userId", data.userId);
            // Chuyển hướng đến trang admin nếu là admin
            window.location.href = data.is_admin ? "/admin" : "/menu";
        } else {
            loginAttempts++;
            alert(data.message || "Login failed");

            // Kiểm tra nếu nhập sai 3 lần thì hiển thị đường link reset mật khẩu
            if (loginAttempts >= 3) {
                document.getElementById("reset-password-link").style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred. Please try again.");
    }
});

document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('invalid', (event) => {
      event.target.setCustomValidity(''); // Xóa thông báo mặc định

      // Tùy chỉnh thông báo cho từng trường
      if (event.target.name === 'username') {
        event.target.setCustomValidity('Please fill out your username!');
      } else if (event.target.name === 'password') {
        event.target.setCustomValidity('Please fill out your Password!');
      }
    });

    // Xóa thông báo khi người dùng nhập lại
    input.addEventListener('input', (event) => {
      event.target.setCustomValidity('');
    });
  });