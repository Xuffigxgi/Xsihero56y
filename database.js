const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

class Database {
    constructor() {
        this.data = {
            categories: [],
            products: [],
            users: [],
            settings: {},
            logs: [],
            banners: []
        };
        this.init();
    }

    init() {
        if (fs.existsSync(DB_PATH)) {
            try {
                const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
                this.data = JSON.parse(fileContent);
                // Ensure new fields exist if loading old db
                if (!this.data.users) this.data.users = [];
                if (!this.data.settings) this.data.settings = {};
                if (!this.data.logs) this.data.logs = [];
                if (!this.data.banners) this.data.banners = [];
            } catch (error) {
                console.error('Error reading database file:', error);
            }
        } else {
            this.seed();
        }
    }

    save() {
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
    }

    seed() {
        console.log('Seeding database...');

        let catIdCounter = 1;
        let prodIdCounter = 1;

        // Categories
        const accountCat = {
            id: catIdCounter++,
            name: 'ACCOUNT',
            description: 'เลือกดูบัญชีที่ต้องการ',
            image_url: 'https://img5.pic.in.th/file/secure-sv1/yonex78756deec19e4cab.png'
        };
        const programCat = {
            id: catIdCounter++,
            name: 'PROGRAM',
            description: 'เลือกดูโปรแกรมที่ต้องการ',
            image_url: ''
        };

        this.data.categories.push(accountCat, programCat);

        // Products
        this.data.products.push(
            {
                id: prodIdCounter++,
                category_id: accountCat.id,
                name: 'Grand Piece Online',
                price: 49.00,
                description: 'ไก่หลัก',
                image_url: 'https://tr.rbxcdn.com/1802d334cb50de3257859b9f528d25ca/768/432/Image/Png',
                stock: 5,
                features: JSON.stringify(['Level 425-475', 'Haki V1', 'Geppo']),
                supported_maps: JSON.stringify(['Grand Piece Online'])
            },
            {
                id: prodIdCounter++,
                category_id: accountCat.id,
                name: 'Rogue Piece',
                price: 35.00,
                description: 'ไก่ตัน',
                image_url: 'https://tr.rbxcdn.com/1802d334cb50de3257859b9f528d25ca/768/432/Image/Png',
                stock: 10,
                features: JSON.stringify(['Level Max', 'God Human']),
                supported_maps: JSON.stringify(['Rogue Piece'])
            }
        );

        // Users
        this.data.users.push({
            id: 1,
            username: 'admin',
            password: 'admin', // Default password
            role: 'Super Admin',
            status: 'Active',
            last_login: new Date().toISOString()
        });

        // Settings
        this.data.settings = {
            site_title: 'YENIX HUB - Premium Store',
            footer_text: '© 2024 YENIX HUB. All rights reserved.',
            logo_url: 'https://img5.pic.in.th/file/secure-sv1/yonex78756deec19e4cab.png',
            discord_link: 'https://discord.gg/XVXWdfpa'
        };

        // Logs
        this.data.logs.push(
            { id: 1, action: 'System Init', user: 'System', timestamp: new Date().toISOString() }
        );

        this.save();
        console.log('Seeding complete.');
    }

    // --- Stats ---
    getDashboardStats() {
        return {
            total_sales: 12500, // Mock
            active_users: this.data.users.length,
            total_products: this.data.products.length,
            pending_orders: 3 // Mock
        };
    }

    // --- Categories ---
    getAllCategories() {
        return this.data.categories.map(cat => {
            const count = this.data.products.filter(p => p.category_id == cat.id).length;
            return { ...cat, product_count: count };
        });
    }

    updateCategory(id, updates) {
        const index = this.data.categories.findIndex(c => c.id == id);
        if (index !== -1) {
            this.data.categories[index] = { ...this.data.categories[index], ...updates };
            this.logAction('Update Category', `Updated category ID ${id}`);
            this.save();
            return this.data.categories[index];
        }
        return null;
    }

    addCategory(data) {
        const newId = this.data.categories.length > 0 ? Math.max(...this.data.categories.map(c => c.id)) + 1 : 1;
        const newCategory = { id: newId, ...data };
        this.data.categories.push(newCategory);
        this.logAction('Add Category', `Added category ${data.name}`);
        this.save();
        return newCategory;
    }

    deleteCategory(id) {
        const index = this.data.categories.findIndex(c => c.id == id);
        if (index !== -1) {
            this.data.categories.splice(index, 1);
            this.data.products = this.data.products.filter(p => p.category_id != id);
            this.logAction('Delete Category', `Deleted category ID ${id}`);
            this.save();
            return true;
        }
        return false;
    }

    // --- Products ---
    getProducts(categoryId) {
        if (categoryId) {
            return this.data.products.filter(p => p.category_id == categoryId);
        }
        return this.data.products;
    }

    getProductById(id) {
        return this.data.products.find(p => p.id == id);
    }

    addProduct(data) {
        const newId = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
        const newProduct = { id: newId, ...data };
        this.data.products.push(newProduct);
        this.logAction('Add Product', `Added product ${data.name}`);
        this.save();
        return newProduct;
    }

    updateProduct(id, updates) {
        const index = this.data.products.findIndex(p => p.id == id);
        if (index !== -1) {
            this.data.products[index] = { ...this.data.products[index], ...updates };
            this.logAction('Update Product', `Updated product ID ${id}`);
            this.save();
            return this.data.products[index];
        }
        return null;
    }

    deleteProduct(id) {
        const index = this.data.products.findIndex(p => p.id == id);
        if (index !== -1) {
            this.data.products.splice(index, 1);
            this.logAction('Delete Product', `Deleted product ID ${id}`);
            this.save();
            return true;
        }
        return false;
    }

    // --- Users ---
    getUsers() {
        return this.data.users.map(u => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });
    }

    validateUser(username, password) {
        const user = this.data.users.find(u => u.username === username && u.password === password);
        if (user) {
            user.last_login = new Date().toISOString();
            this.save();
            const { password, ...safeUser } = user;
            return safeUser;
        }
        return null;
    }

    userExists(username) {
        return this.data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    }

    addUser(data) {
        const newId = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            ...data,
            last_login: '-',
            password: data.password || 'admin123' // Default if missing, though UI should provide it
        };
        this.data.users.push(newUser);
        this.logAction('Add User', `Added user ${data.username}`);
        this.save();
        const { password, ...safeUser } = newUser;
        return safeUser;
    }

    deleteUser(id) {
        const index = this.data.users.findIndex(u => u.id == id);
        if (index !== -1) {
            this.data.users.splice(index, 1);
            this.logAction('Delete User', `Deleted user ID ${id}`);
            this.save();
            return true;
        }
        return false;
    }

    isSetupRequired() {
        return this.data.users.length === 0;
    }

    // --- Settings ---
    getSettings() {
        return this.data.settings;
    }

    updateSettings(updates) {
        this.data.settings = { ...this.data.settings, ...updates };
        this.logAction('Update Settings', 'Updated system settings');
        this.save();
        return this.data.settings;
    }

    // --- Logs ---
    getLogs() {
        return this.data.logs.slice().reverse().slice(0, 50); // Return last 50 logs
    }

    logAction(action, details) {
        const newLog = {
            id: Date.now(),
            action,
            details,
            user: 'Admin', // Mock user for now
            timestamp: new Date().toISOString()
        };
        this.data.logs.push(newLog);
        // data.js auto save on other ops, but logs might need explicit save if used standalone
        // For efficiency, we rely on other ops to save or periodic save, but here we just save to be safe
        this.save();
    }
}

module.exports = new Database();
