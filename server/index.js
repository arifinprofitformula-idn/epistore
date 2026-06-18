import "dotenv/config";
import bcrypt from "bcryptjs";
import compression from "compression";
import express from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  dbConfig,
  getSessionUser,
  initializeDatabase,
  pool,
} from "./database.js";

await initializeDatabase();

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore(
  {
    ...dbConfig,
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 12 * 60 * 60 * 1000,
  },
);

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(
  session({
    name: "epis.sid",
    secret: process.env.SESSION_SECRET || "change-this-secret-before-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 12 * 60 * 60 * 1000,
    },
  }),
);

const requireAuth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Silakan login kembali." });
    }
    const user = await getSessionUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Akun tidak aktif atau tidak ditemukan." });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Akses admin diperlukan." });
  }
  next();
};

const requireWriter = (req, res, next) => {
  if (!["admin", "be"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Akun ini hanya memiliki akses lihat." });
  }
  next();
};

const isValidPin = (pin) => /^\d{4,6}$/.test(pin);
const normalizeAmount = (value) => {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
};

const allowedBrandCodes = ["goldgram", "meezan_gold", "silvergram"];
const normalizeBrandCodes = (values) => (
  [...new Set((Array.isArray(values) ? values : []).map(String))]
    .filter((value) => allowedBrandCodes.includes(value))
);
const normalizeStoreCodes = (values) => (
  [...new Set((Array.isArray(values) ? values : []).map(Number))]
    .filter((value) => Number.isInteger(value) && value >= 0)
);
const canAccessStore = (user, storeIndex) => (
  user.role === "admin" || user.storeCodes.includes(storeIndex)
);

async function writeAudit(connection, userId, action, entity, entityId, oldValue, newValue) {
  await connection.query(
    `INSERT INTO audit_logs
      (user_id, action, entity, entity_id, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      action,
      entity,
      String(entityId),
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
    ],
  );
}

app.get("/api/session", async (req, res, next) => {
  try {
    const user = req.session.userId ? await getSessionUser(req.session.userId) : null;
    res.json({ session: user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const pin = String(req.body.pin || "").trim();
    if (!isValidPin(pin)) {
      return res.status(401).json({ message: "PIN tidak valid. Coba lagi." });
    }

    const [users] = await pool.query(
      "SELECT id, pin_hash FROM users WHERE is_active = TRUE ORDER BY id",
    );
    let matchedUser = null;
    for (const user of users) {
      if (await bcrypt.compare(pin, user.pin_hash)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ message: "PIN tidak valid. Coba lagi." });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
    req.session.userId = matchedUser.id;
    const user = await getSessionUser(matchedUser.id);
    res.json({ session: user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("epis.sid");
    res.status(204).end();
  });
});

app.get("/api/bootstrap", requireAuth, async (req, res, next) => {
  try {
    // Admin receives all EPIS data; other roles only receive assigned stores.
    const params = [];
    let storeFilter = "";
    if (req.user.role !== "admin") {
      if (req.user.storeCodes.length === 0) {
        return res.json({
          data: {},
          session: req.user,
          access: {
            canReadAllStores: false,
            readableStoreCodes: [],
            writableBrandCodes: req.user.role === "be" ? req.user.brandCodes : [],
          },
        });
      }
      storeFilter = ` AND s.store_code IN (${req.user.storeCodes.map(() => "?").join(",")})`;
      params.push(...req.user.storeCodes);
    }
    const [rows] = await pool.query(
      `SELECT
        s.store_code AS storeIndex,
        r.month_index AS monthIndex,
        r.gold AS g,
        r.meezan AS m,
        r.silver AS s,
        r.note,
        r.submitted_name AS be,
        r.updated_at AS ts
       FROM realisations r
       JOIN stores s ON s.id = r.store_id
       WHERE r.year = 2026${storeFilter}
       ORDER BY s.store_code, r.month_index`,
      params,
    );
    const data = Object.fromEntries(
      rows.map((row) => [
        `${row.storeIndex}-${row.monthIndex}`,
        { g: row.g, m: row.m, s: row.s, note: row.note || "", be: row.be, ts: row.ts },
      ]),
    );
    res.json({
      data,
      session: req.user,
      access: {
        canReadAllStores: req.user.role === "admin",
        readableStoreCodes: req.user.role === "admin" ? null : req.user.storeCodes,
        writableBrandCodes: req.user.role === "admin"
          ? allowedBrandCodes
          : req.user.brandCodes,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/realisations/:storeIndex/:monthIndex", requireAuth, requireWriter, async (req, res, next) => {
  const storeIndex = Number(req.params.storeIndex);
  const monthIndex = Number(req.params.monthIndex);
  const g = normalizeAmount(req.body.g);
  const m = normalizeAmount(req.body.m);
  const s = normalizeAmount(req.body.s);
  const note = String(req.body.note || "").trim().slice(0, 2000);

  if (
    !Number.isInteger(storeIndex) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    g === null ||
    m === null ||
    s === null
  ) {
    return res.status(400).json({ message: "Data realisasi tidak valid." });
  }
  if (req.user.role !== "admin" && req.user.brandCodes.length === 0) {
    return res.status(403).json({ message: "Belum ada brand yang ditugaskan ke akun Anda." });
  }
  if (!canAccessStore(req.user, storeIndex)) {
    return res.status(403).json({ message: "Akun ini tidak memiliki akses ke EPI Store tersebut." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[store]] = await connection.query(
      "SELECT id FROM stores WHERE store_code = ? FOR UPDATE",
      [storeIndex],
    );
    if (!store) {
      await connection.rollback();
      return res.status(404).json({ message: "EPI Store tidak ditemukan." });
    }

    const [[existing]] = await connection.query(
      `SELECT gold AS g, meezan AS m, silver AS s, note, submitted_name AS be
       FROM realisations WHERE store_id = ? AND year = 2026 AND month_index = ?`,
      [store.id, monthIndex],
    );
    const entry = {
      g: Number(existing?.g || 0),
      m: Number(existing?.m || 0),
      s: Number(existing?.s || 0),
      note,
      be: req.user.name,
      ts: new Date().toISOString(),
    };
    const fieldByBrand = {
      goldgram: "g",
      meezan_gold: "m",
      silvergram: "s",
    };
    const submitted = { g, m, s };
    const userBrands = req.user.role === "admin" ? allowedBrandCodes : req.user.brandCodes;
    for (const brandCode of userBrands) {
      const field = fieldByBrand[brandCode];
      entry[field] = submitted[field];
    }

    await connection.query(
      `INSERT INTO realisations
        (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
       VALUES (?, 2026, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        gold = VALUES(gold),
        meezan = VALUES(meezan),
        silver = VALUES(silver),
        note = VALUES(note),
        submitted_by = VALUES(submitted_by),
        submitted_name = VALUES(submitted_name)`,
      [store.id, monthIndex, entry.g, entry.m, entry.s, note, req.user.id, req.user.name],
    );
    await writeAudit(
      connection,
      req.user.id,
      existing ? "update" : "create",
      "realisation",
      `${storeIndex}-${monthIndex}`,
      existing || null,
      entry,
    );
    await connection.commit();
    res.json({ key: `${storeIndex}-${monthIndex}`, entry });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.post("/api/realisations/import", requireAuth, requireAdmin, async (req, res, next) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (rows.length === 0 || rows.length > 5000) {
    return res.status(400).json({ message: "Data import kosong atau terlalu besar." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const saved = {};

    for (const row of rows) {
      const storeIndex = Number(row.storeIndex);
      const monthIndex = Number(row.monthIndex);
      const g = normalizeAmount(row.g);
      const m = normalizeAmount(row.m);
      const s = normalizeAmount(row.s);
      if (
        !Number.isInteger(storeIndex) ||
        !Number.isInteger(monthIndex) ||
        monthIndex < 0 ||
        monthIndex > 11 ||
        g === null ||
        m === null ||
        s === null
      ) {
        throw new Error("Salah satu baris import tidak valid.");
      }

      const [[store]] = await connection.query(
        "SELECT id FROM stores WHERE store_code = ?",
        [storeIndex],
      );
      if (!store) throw new Error(`Store index ${storeIndex} tidak ditemukan.`);

      await connection.query(
        `INSERT INTO realisations
          (store_id, year, month_index, gold, meezan, silver, note, submitted_by, submitted_name)
         VALUES (?, 2026, ?, ?, ?, ?, 'Import CSV', ?, ?)
         ON DUPLICATE KEY UPDATE
          gold = VALUES(gold),
          meezan = VALUES(meezan),
          silver = VALUES(silver),
          note = VALUES(note),
          submitted_by = VALUES(submitted_by),
          submitted_name = VALUES(submitted_name)`,
        [store.id, monthIndex, g, m, s, req.user.id, req.user.name],
      );
      saved[`${storeIndex}-${monthIndex}`] = {
        g,
        m,
        s,
        note: "Import CSV",
        be: req.user.name,
        ts: new Date().toISOString(),
      };
    }

    await writeAudit(
      connection,
      req.user.id,
      "import",
      "realisation",
      `batch-${Date.now()}`,
      null,
      { rowCount: rows.length },
    );
    await connection.commit();
    res.json({ data: saved, count: rows.length });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get("/api/users", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.role,
        u.is_active AS isActive,
        GROUP_CONCAT(DISTINCT ub.brand_code ORDER BY ub.brand_code) AS brandCodes,
        GROUP_CONCAT(DISTINCT us.store_code ORDER BY us.store_code) AS storeCodes
       FROM users u
       LEFT JOIN user_brands ub ON ub.user_id = u.id
       LEFT JOIN user_stores us ON us.user_id = u.id
       GROUP BY u.id
       ORDER BY u.role, u.name`,
    );
    res.json({
      users: rows.map((user) => ({
        ...user,
        brandCodes: user.brandCodes
          ? String(user.brandCodes).split(",")
          : [],
        storeCodes: user.storeCodes
          ? String(user.storeCodes).split(",").map(Number)
          : [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res, next) => {
  const name = String(req.body.name || "").trim().slice(0, 120);
  const pin = String(req.body.pin || "").trim();
  const role = ["admin", "be", "viewer"].includes(req.body.role) ? req.body.role : "be";
  const brandCodes = normalizeBrandCodes(req.body.brandCodes);
  const storeCodes = normalizeStoreCodes(req.body.storeCodes);

  if (!name || !isValidPin(pin)) {
    return res.status(400).json({ message: "Nama dan PIN 4-6 digit wajib diisi." });
  }

  const [activeUsers] = await pool.query("SELECT pin_hash FROM users WHERE is_active = TRUE");
  for (const user of activeUsers) {
    if (await bcrypt.compare(pin, user.pin_hash)) {
      return res.status(409).json({ message: "PIN sudah digunakan pengguna lain." });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const pinHash = await bcrypt.hash(pin, 12);
    const [result] = await connection.query(
      "INSERT INTO users (name, role, pin_hash) VALUES (?, ?, ?)",
      [name, role, pinHash],
    );
    if (role === "be" && brandCodes.length > 0) {
      await connection.query(
        `INSERT INTO user_brands (user_id, brand_code) VALUES ?`,
        [brandCodes.map((brandCode) => [result.insertId, brandCode])],
      );
    }
    if (role !== "admin" && storeCodes.length > 0) {
      await connection.query(
        `INSERT INTO user_stores (user_id, store_code) VALUES ?`,
        [storeCodes.map((storeCode) => [result.insertId, storeCode])],
      );
    }
    await writeAudit(
      connection,
      req.user.id,
      "create",
      "user",
      result.insertId,
      null,
      { name, role, brandCodes, storeCodes },
    );
    await connection.commit();
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.patch("/api/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const userId = Number(req.params.id);
  const name = String(req.body.name || "").trim().slice(0, 120);
  const pin = String(req.body.pin || "").trim();
  const role = ["admin", "be", "viewer"].includes(req.body.role) ? req.body.role : "be";
  const isActive = req.body.isActive !== false;
  const brandCodes = normalizeBrandCodes(req.body.brandCodes);
  const storeCodes = normalizeStoreCodes(req.body.storeCodes);

  if (!Number.isInteger(userId) || !name || (pin && !isValidPin(pin))) {
    return res.status(400).json({ message: "Data pengguna tidak valid." });
  }
  if (userId === req.user.id && (!isActive || role !== "admin")) {
    return res.status(400).json({ message: "Admin tidak dapat menonaktifkan atau menurunkan peran akunnya sendiri." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[oldUser]] = await connection.query(
      "SELECT id, name, role, is_active AS isActive FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );
    if (!oldUser) {
      await connection.rollback();
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (pin) {
      const [otherUsers] = await connection.query(
        "SELECT id, pin_hash FROM users WHERE is_active = TRUE AND id <> ?",
        [userId],
      );
      for (const user of otherUsers) {
        if (await bcrypt.compare(pin, user.pin_hash)) {
          await connection.rollback();
          return res.status(409).json({ message: "PIN sudah digunakan pengguna lain." });
        }
      }
      await connection.query(
        "UPDATE users SET name = ?, role = ?, is_active = ?, pin_hash = ? WHERE id = ?",
        [name, role, isActive, await bcrypt.hash(pin, 12), userId],
      );
    } else {
      await connection.query(
        "UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?",
        [name, role, isActive, userId],
      );
    }

    await connection.query("DELETE FROM user_brands WHERE user_id = ?", [userId]);
    if (role === "be" && brandCodes.length > 0) {
      await connection.query(
        `INSERT INTO user_brands (user_id, brand_code) VALUES ?`,
        [brandCodes.map((brandCode) => [userId, brandCode])],
      );
    }
    await connection.query("DELETE FROM user_stores WHERE user_id = ?", [userId]);
    if (role !== "admin" && storeCodes.length > 0) {
      await connection.query(
        `INSERT INTO user_stores (user_id, store_code) VALUES ?`,
        [storeCodes.map((storeCode) => [userId, storeCode])],
      );
    }
    await writeAudit(
      connection,
      req.user.id,
      "update",
      "user",
      userId,
      oldUser,
      { name, role, isActive, brandCodes, storeCodes, pinChanged: Boolean(pin) },
    );
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

if (isProduction) {
  app.use("/public", express.static(path.join(rootDir, "public")));
  app.use(express.static(path.join(rootDir, "public")));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(rootDir, "public/index.html")));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Terjadi kesalahan pada server." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Dashboard EPI berjalan di http://localhost:${port}`);
});
