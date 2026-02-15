function runQuery(query, params) {
    const stmt = this.db.prepare(query);
    const info = stmt.run(...params);
    return { lastID: this.lastID, changes: this.changes };
}