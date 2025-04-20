// Lấy thông tin protocol (http hoặc https) và hostname hiện tại của trang
const protocol = window.location.protocol; // "http:" hoặc "https:"
const host = window.location.hostname;     // ví dụ: "localhost", "127.0.0.1", hoặc "192.168.1.29"

// Thiết lập các biến API_BASE_URL sử dụng protocol, hostname và cổng tương ứng
const API_BASE_URL_5000 = `${protocol}//${host}:5000`;
const API_BASE_URL_5001 = `${protocol}//${host}:5001`;
document.getElementById("reset-password-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Ngừng hành vi gửi form mặc định

    const username = document.getElementById("username").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/;
    const errorMessage = document.getElementById("error-message");
    
    // Kiểm tra xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match!";
        errorMessage.style.display = "block";
        return;
    // Kiểm tra độ mạnh của mật khẩu
    }
    if (!passwordRegex.test(newPassword)) {
        errorMessage.textContent = "Password must be at least 5 characters long, include a letter, a number, and a special character.";
        errorMessage.style.display = "block";
        return;
    } else {
        errorMessage.style.display = "none";
    }

    try {
        const response = await fetch(`${API_BASE_URL_5000}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password updated successfully!");
            window.location.href = "/login";
        } else {
            alert(data.message || "Failed to update password. Please try again.");
        }
    } catch (error) {
        console.error("Error during password reset:", error);
        alert("An error occurred. Please try again.");
    }
});
document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('invalid', (event) => {
      event.target.setCustomValidity(''); // Xóa thông báo mặc định

      // Tùy chỉnh thông báo cho từng trường
      if (event.target.name === 'username') {
        event.target.setCustomValidity('Please fill out your username!');
      } else if (event.target.name === 'new-password') {
        event.target.setCustomValidity('Please fill out your new Password!');
      } else if (event.target.name === 'confirm-password') {
            event.target.setCustomValidity('Please fill out your confirm Password!');
    }
    });

    // Xóa thông báo khi người dùng nhập lại
    input.addEventListener('input', (event) => {
      event.target.setCustomValidity('');
    });
  });