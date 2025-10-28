// @ts-ignore - Bun built-in module
import { Database } from 'bun:sqlite';

export interface User {
  id?: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseManager {
  private db: Database;

  constructor(dbPath: string = 'example.db') {
    this.db = new Database(dbPath);
    
    this.db.exec('PRAGMA journal_mode = WAL');
    
    this.initTables();
  }

  private initTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        phone TEXT,
        website TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.exec(createUsersTable);
    
    const createTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;
    
    this.db.exec(createTrigger);
  }

  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }

  getUserById(id: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, username, phone, website)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(user.name, user.email, user.username, user.phone || null, user.website || null);
    
    return this.getUserById(result.lastInsertRowid as number)!;
  }

  updateUser(id: number, user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): User | null {
    const existingUser = this.getUserById(id);
    if (!existingUser) return null;

    const fields = [];
    const values = [];
    
    if (user.name !== undefined) {
      fields.push('name = ?');
      values.push(user.name);
    }
    if (user.email !== undefined) {
      fields.push('email = ?');
      values.push(user.email);
    }
    if (user.username !== undefined) {
      fields.push('username = ?');
      values.push(user.username);
    }
    if (user.phone !== undefined) {
      fields.push('phone = ?');
      values.push(user.phone);
    }
    if (user.website !== undefined) {
      fields.push('website = ?');
      values.push(user.website);
    }

    if (fields.length === 0) return existingUser;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getUserById(id);
  }

  deleteUser(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getUserCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  close() {
    this.db.close();
  }
}

let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}