// Assuming this is the complete content of database_sql.js before modifications
function runQuery(query, params) {
    return new Promise((resolve, reject) => {
        // Implementation...
        // Corrected return value
        resolve({ lastID: this.lastID, changes: this.changes });
    });
}
// Other existing functions...
