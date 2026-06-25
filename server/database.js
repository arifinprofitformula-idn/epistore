import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const databaseName = process.env.DB_NAME || "dashboard_epis";
const autoCreateDatabase = process.env.DB_AUTO_CREATE !== "false";
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error("DB_NAME hanya boleh berisi huruf, angka, dan underscore.");
}

export const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: databaseName,
};

if (autoCreateDatabase) {
  try {
    const bootstrapConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await bootstrapConnection.end();
  } catch (error) {
    throw new Error(
      `Tidak dapat terhubung ke database MySQL di ${dbConfig.host}:${dbConfig.port}. ` +
      "Pastikan MySQL berjalan dan konfigurasi DB_HOST/DB_PORT/DB_USER/DB_PASSWORD benar. " +
      error.message,
    );
  }
}

export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  decimalNumbers: true,
  timezone: "Z",
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      role ENUM('admin', 'be', 'viewer') NOT NULL DEFAULT 'be',
      pin_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await pool.query(
    "ALTER TABLE users MODIFY role ENUM('admin', 'be', 'viewer') NOT NULL DEFAULT 'be'",
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      store_code SMALLINT UNSIGNED NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL UNIQUE,
      segment VARCHAR(40) NOT NULL,
      gold_target DECIMAL(20,0) NOT NULL DEFAULT 0,
      meezan_target DECIMAL(20,0) NOT NULL DEFAULT 0,
      silver_target DECIMAL(20,0) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_brands (
      user_id BIGINT UNSIGNED NOT NULL,
      brand_code ENUM('goldgram', 'meezan_gold', 'silvergram') NOT NULL,
      PRIMARY KEY (user_id, brand_code),
      CONSTRAINT fk_user_brands_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ip_address VARCHAR(45) NOT NULL,
      pin_fingerprint CHAR(64) NOT NULL,
      attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      last_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      locked_until TIMESTAMP NULL,
      UNIQUE KEY uq_login_attempts_ip_pin (ip_address, pin_fingerprint)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_stores (
      user_id BIGINT UNSIGNED NOT NULL,
      store_code SMALLINT UNSIGNED NOT NULL,
      PRIMARY KEY (user_id, store_code),
      CONSTRAINT fk_user_stores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_stores_store FOREIGN KEY (store_code) REFERENCES stores(store_code) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS realisations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      store_id BIGINT UNSIGNED NOT NULL,
      year SMALLINT UNSIGNED NOT NULL,
      month_index TINYINT UNSIGNED NOT NULL,
      gold DECIMAL(20,0) NOT NULL DEFAULT 0,
      meezan DECIMAL(20,0) NOT NULL DEFAULT 0,
      silver DECIMAL(20,0) NOT NULL DEFAULT 0,
      note TEXT NULL,
      submitted_by BIGINT UNSIGNED NULL,
      submitted_name VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_realisations_store_period (store_id, year, month_index),
      CONSTRAINT fk_realisations_store FOREIGN KEY (store_id) REFERENCES stores(id),
      CONSTRAINT fk_realisations_user FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      action VARCHAR(60) NOT NULL,
      entity VARCHAR(60) NOT NULL,
      entity_id VARCHAR(120) NULL,
      old_value JSON NULL,
      new_value JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_user_created (user_id, created_at),
      CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await seedDatabase();
}

async function seedDatabase() {
  const masterData = JSON.parse(
    await readFile(new URL("./master-data.json", import.meta.url), "utf8"),
  );
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const [index, store] of masterData.stores.entries()) {
      await connection.query(
        `INSERT INTO stores
          (store_code, name, segment, gold_target, meezan_target, silver_target)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          segment = VALUES(segment),
          gold_target = VALUES(gold_target),
          meezan_target = VALUES(meezan_target),
          silver_target = VALUES(silver_target)`,
        [index, store.n, store.seg, store.g, store.m, store.s],
      );
    }

    const [[userCount]] = await connection.query("SELECT COUNT(*) AS total FROM users");
    let adminId;
    if (userCount.total === 0) {
      const adminHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PIN || "123456", 12);
      const demoHash = await bcrypt.hash(process.env.DEFAULT_BE_PIN || "654321", 12);
      const [adminResult] = await connection.query(
        "INSERT INTO users (name, role, pin_hash) VALUES (?, 'admin', ?)",
        ["Admin", adminHash],
      );
      adminId = adminResult.insertId;
      const [demoResult] = await connection.query(
        "INSERT INTO users (name, role, pin_hash) VALUES (?, 'be', ?)",
        ["BE Default", demoHash],
      );
      await connection.query(
        `INSERT INTO user_brands (user_id, brand_code)
         VALUES (?, 'goldgram')`,
        [demoResult.insertId],
      );
    } else {
      const [[admin]] = await connection.query(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1",
      );
      adminId = admin?.id || null;
    }

    const [[realisationCount]] = await connection.query(
      "SELECT COUNT(*) AS total FROM realisations",
    );
    if (realisationCount.total === 0) {
      for (const [key, value] of Object.entries(masterData.seedData)) {
        const [storeCode, monthIndex] = key.split("-").map(Number);
        await connection.query(
          `INSERT INTO realisations
            (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
           SELECT id, 2026, ?, ?, ?, ?, ?, ?, ?
           FROM stores WHERE store_code = ?`,
          [
            monthIndex,
            value.g,
            value.m,
            value.s,
            value.note || "Data awal import",
            adminId,
            value.be || "Import",
            storeCode,
          ],
        );
      }
    }

    await connection.query(
      `INSERT IGNORE INTO user_brands (user_id, brand_code)
       SELECT id, 'goldgram' FROM users
       WHERE role = 'be'
         AND NOT EXISTS (
           SELECT 1 FROM user_brands ub WHERE ub.user_id = users.id
         )`,
    );

    await connection.query(
      `INSERT IGNORE INTO user_stores (user_id, store_code)
       SELECT u.id, s.store_code
       FROM users u
       JOIN stores s
       WHERE u.role <> 'admin'
         AND NOT EXISTS (
           SELECT 1 FROM user_stores us WHERE us.user_id = u.id
         )`,
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSessionUser(userId) {
  const [[user]] = await pool.query(
    "SELECT id, name, role, is_active AS isActive FROM users WHERE id = ?",
    [userId],
  );
  if (!user || !user.isActive) return null;

  const [brands] = await pool.query(
    `SELECT brand_code AS brandCode
     FROM user_brands
     WHERE user_id = ?
     ORDER BY brand_code`,
    [userId],
  );

  const [stores] = await pool.query(
    `SELECT store_code AS storeCode
     FROM user_stores
     WHERE user_id = ?
     ORDER BY store_code`,
    [userId],
  );

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    brandCodes: brands.map((brand) => brand.brandCode),
    storeCodes: stores.map((store) => Number(store.storeCode)),
    canReadAllStores: user.role === "admin",
  };
}
