const fs = require('fs');
const path = require('path');
const db = require('./database_sql');

const JSON_DB_PATH = path.join(__dirname, 'data.json');

async function migrate() {
    if (!fs.existsSync(JSON_DB_PATH)) {
        console.log('No data.json found. Skipping migration.');
        process.exit(0);
    }

    console.log('Migrating data from data.json to SQLite...');

    try {
        const jsonData = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));

        await db.init();

        if (jsonData.users) {
            console.log(`Migrating ${jsonData.users.length} users...`);
            for (const user of jsonData.users) {
                if (await db.userExists(user.username)) {
                    console.log(`Skipping existing user: ${user.username}`);
                    continue;
                }
                await db.addUser(user);
            }
        }

        if (jsonData.categories) {
            console.log(`Migrating ${jsonData.categories.length} categories...`);
            for (const cat of jsonData.categories) {
                await new Promise((resolve, reject) => {
                    db.db.run('INSERT OR IGNORE INTO categories (id, name, description, image_url) VALUES (?, ?, ?, ?)',
                        [cat.id, cat.name, cat.description, cat.image_url], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                });
            }
        }

        if (jsonData.products) {
            console.log(`Migrating ${jsonData.products.length} products...`);
            for (const prod of jsonData.products) {
                await new Promise((resolve, reject) => {
                    db.db.run(`INSERT OR IGNORE INTO products (id, category_id, name, price, stock, description, image_url, features, supported_maps) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [prod.id, prod.category_id, prod.name, prod.price, prod.stock, prod.description, prod.image_url, prod.features, prod.supported_maps], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                });
            }
        }

        if (jsonData.settings) {
            console.log('Migrating settings...');
            await db.updateSettings(jsonData.settings);
        }

        console.log('Migration Complete!');

    } catch (e) {
        console.error('Migration Failed:', e);
    }
}

migrate();
