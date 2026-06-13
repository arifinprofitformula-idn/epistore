import { initializeDatabase, pool } from "../server/database.js";

await initializeDatabase();
await pool.end();
console.log("Database, tabel, akun awal, dan data awal berhasil diinisialisasi.");
