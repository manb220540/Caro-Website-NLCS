Sau khi tải về, đi đến thư mục bên trong.
Tạo môi trường ảo:
    python -m venv venv
Chạy môi trường:
    source venv/bin/activate
Tải về các môi trương cần thiết:
    pip install flask
Khởi chạy server:
    python app.py
    python roomgame.py
Cách đóng server:
    nhấn Control+C để thoát


Phần mở rộng:
truy vấn caro_game.db:
    mở terminal và chạy lệnh:
        cd instance
        sqlite3 caro_game.db
    các câu lệnh truy vấn đơn giản:
        .tables
        .help
        SELECT * FROM user;


