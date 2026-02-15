const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'yenix.db');
const db = new sqlite3.Database(DB_PATH);

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

class DatabaseSQL {
    constructor() {
        this.init();
    }

    async init() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        db.exec(schema, (err) => {
            if (err) console.error('Schema Init Error:', err);
            else console.log('Database Schema Initialized');
        });

        const title = await this.getSetting('site_title');
        if (!title) {
            await this.updateSettings({
                site_title: 'YENIX HUB - Premium Store',
                footer_text: '© 2024 YENIX HUB. All rights reserved.',
                logo_url: 'https://img5.pic.in.th/file/secure-sv1/yonex78756deec19e4cab.png',
                discord_link: 'https://discord.gg/XVXWdfpa'
            });
        }
    }


    async getUsers() {
        const users = await allQuery('SELECT id, username, role, last_login, created_at FROM users');
        return users;
    }

    async validateUser(username, password) {
        const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
        if (user) {
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                await runQuery('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                const { password_hash, ...safeUser } = user;
                return safeUser;
            }
        }
        return null;
    }

    async userExists(username) {
        const user = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
        return !!user;
    }

    async addUser(data) {
        const hash = await bcrypt.hash(data.password, 10);
        const result = await runQuery(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [data.username, hash, data.role || 'Member']
        );
        return { id: result.lastID, username: data.username, role: data.role };
    }

    async deleteUser(id) {
        const result = await runQuery('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    }

    async isSetupRequired() {
        const count = await getQuery('SELECT COUNT(*) as count FROM users');
        return count.count === 0;
    }

    async getAllCategories() {

        const sql = `
            SELECT c.*, COUNT(p.id) as product_count 
            FROM categories c 
            LEFT JOIN products p ON c.id = p.category_id 
            GROUP BY c.id
        `;
        return await allQuery(sql);
    }

    async addCategory(data) {
        const res = await runQuery(
            'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
            [data.name, data.description, data.image_url]
        );
        return { id: res.lastID, ...data };
    }

    async updateCategory(id, data) {

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(data)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);

        if (fields.length === 0) return null;

        await runQuery(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getCategoryById(id);
    }

    async deleteCategory(id) {
        const res = await runQuery('DELETE FROM categories WHERE id = ?', [id]);
        return res.changes > 0;
    }

    async getCategoryById(id) {
        return await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    }

    async getProducts(categoryId) {
        if (categoryId) {
            return await allQuery('SELECT * FROM products WHERE category_id = ?', [categoryId]);
        }
        return await allQuery('SELECT * FROM products');
    }

    async getProductById(id) {
        return await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    }

    async addProduct(data) {
        const res = await runQuery(
            `INSERT INTO products (category_id, name, price, stock, description, image_url, features, supported_maps) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.category_id, data.name, data.price, data.stock, data.description, data.image_url, data.features, data.supported_maps]
        );
        return { id: res.lastID, ...data };
    }

    async updateProduct(id, data) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(data)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);

        if (fields.length === 0) return null;

        await runQuery(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getProductById(id);
    }

    async deleteProduct(id) {
        const res = await runQuery('DELETE FROM products WHERE id = ?', [id]);
        return res.changes > 0;
    }

    async getSettings() {
        const rows = await allQuery('SELECT * FROM settings');
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return settings;
    }

    async getSetting(key) {
        const row = await getQuery('SELECT value FROM settings WHERE key = ?', [key]);
        return row ? row.value : null;
    }

    async updateSettings(updates) {
        for (const [key, value] of Object.entries(updates)) {

            await runQuery(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`, [key, value, value]);
        }
        return this.getSettings();
    }


    async getLogs() {
        return await allQuery('SELECT * FROM logs ORDER BY id DESC LIMIT 50');
    }

    async logAction(action, details, user_id = null) {
        await runQuery('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)', [user_id, action, details]);
    }

    async getDashboardStats() {
        const sales = await getQuery('SELECT SUM(price) as total FROM orders');
        const users = await getQuery('SELECT COUNT(*) as count FROM users');
        const products = await getQuery('SELECT COUNT(*) as count FROM products');

        return {
            total_sales: sales.total || 0,
            active_users: users.count || 0,
            total_products: products.count || 0,
            pending_orders: 0
        };
    }

    async addOrder(userId, productId, price) {
        const res = await runQuery(
            'INSERT INTO orders (user_id, product_id, price) VALUES (?, ?, ?)',
            [userId, productId, price]
        );
        this.logAction('New Order', `User ${userId} bought Product ${productId}`, userId);

        await runQuery('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId]);

        return { id: res.lastID, status: 'Completed' };
    }

    async getUserOrders(userId) {
        return await allQuery(
            `SELECT o.*, p.name as product_name, p.image_url
             FROM orders o
             JOIN products p ON o.product_id = p.id
             WHERE o.user_id = ? ORDER BY o.created_at DESC`,
            [userId]
        );
    }
}

module.exports = new DatabaseSQL();
