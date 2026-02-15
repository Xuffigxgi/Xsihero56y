const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// 1. ตั้งค่า Port สำหรับ Render (สำคัญมาก)
const PORT = process.env.PORT || 3000;

// 2. ตั้งค่าการรับข้อมูลจากฟอร์ม (Middleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. บอกให้ Server รู้ว่าไฟล์ HTML/CSS อยู่ในโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// 4. เชื่อมต่อฐานข้อมูล (yenix.db)
const db = new sqlite3.Database('./yenix.db', (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to the SQLite database.');
});

// 5. โค้ดสำหรับสมัครสมาชิก (ตัวอย่างการรับข้อมูลจาก register.html)
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(sql, [username, password], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Registration failed: " + err.message);
        }
        res.send("Registration successful! You can now login.");
    });
});

// 6. หน้าแรกให้เปิด index.html ในโฟลเดอร์ public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
