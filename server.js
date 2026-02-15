const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const app = express();

// ตั้งค่า Port สำหรับ Render
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// บอกให้ Server ดึงไฟล์จากโฟลเดอร์ public มาโชว์
app.use(express.static(path.join(__dirname, 'public')));

// เชื่อมต่อฐานข้อมูล
const db = new sqlite3.Database('./yenix.db', (err) => {
    if (err) console.error('Database error:', err.message);
    else console.log('Connected to yenix.db');
});

// API สำหรับสมัครสมาชิก
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    
    db.run(sql, [username, password], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Registration successful!" });
    });
});

// ส่งหน้าแรกให้ผู้ใช้
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
