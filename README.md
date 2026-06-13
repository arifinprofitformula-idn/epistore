# Dashboard EPI Store

Aplikasi multi-user untuk input realisasi, dashboard performa, perhitungan reward, impor CSV, dan pengelolaan akses Brand Executive.

## Stack

- React + Vite
- Express
- MySQL atau MariaDB
- Session tersimpan di MySQL
- PIN di-hash dengan bcrypt
- PM2 + Nginx untuk produksi

## Model Akses

- **Administrator** dapat melihat seluruh data, mengimpor CSV, serta membuat dan mengubah akun.
- **Brand Executive** hanya dapat menyimpan realisasi untuk EPI Store yang ditugaskan.
- Identitas submitter diambil dari sesi server, bukan dari data browser.
- Perubahan realisasi dan akun dicatat pada tabel `audit_logs`.

## Menjalankan Lokal dengan Laragon

1. Jalankan MySQL/MariaDB dari Laragon.
   Pastikan port `3306` aktif sebelum menjalankan perintah inisialisasi.
2. Buat konfigurasi lokal:

```powershell
Copy-Item .env.example .env
```

3. Sesuaikan `.env`. Konfigurasi standar Laragon biasanya:

```env
PORT=3000
SESSION_SECRET=ganti-dengan-rangkaian-acak-yang-panjang
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dashboard_epis
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
DEFAULT_ADMIN_PIN=9999
DEFAULT_BE_PIN=1234
```

4. Instal dependency dan inisialisasi database:

```bash
npm install
npm run db:init
npm run dev
```

Buka `http://localhost:5173`.

Database, tabel, 28 EPI Store, dan data awal dibuat otomatis. Akun awal hanya dibuat ketika tabel pengguna masih kosong:

- Admin: `9999`
- BE demo: `1234`, ditugaskan ke EPIS Tangerang

Segera ganti PIN akun awal melalui menu **Akses & PIN**.

## Struktur Database

- `users`: akun, peran, PIN hash, dan status aktif
- `stores`: master EPI Store dan target
- `user_stores`: penugasan pengguna ke EPI Store
- `realisations`: realisasi bulanan per store
- `audit_logs`: histori perubahan penting
- `sessions`: sesi login Express

Kombinasi `store_id`, `year`, dan `month_index` pada realisasi bersifat unik sehingga satu periode tidak menghasilkan data duplikat.

## Build Produksi

```bash
npm run build
```

Frontend hasil build berada di `dist/`. Dalam mode produksi, Express menyajikan frontend dan API dari port yang sama.

## Deployment VPS Ubuntu

Prasyarat: Node.js 22+, MySQL 8 atau MariaDB 10.6+, Nginx, PM2, dan domain yang mengarah ke VPS.

Buat database user khusus:

```sql
CREATE USER 'dashboard_epis'@'127.0.0.1' IDENTIFIED BY 'password-yang-kuat';
GRANT ALL PRIVILEGES ON dashboard_epis.* TO 'dashboard_epis'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Deploy aplikasi:

```bash
git clone URL_REPOSITORY dashboardepis
cd dashboardepis
npm ci
cp .env.example .env
npm run db:init
npm run build
set -a
source .env
set +a
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Isi `.env` VPS dengan kredensial database dan `SESSION_SECRET` acak minimal 32 karakter.

Salin `deploy/nginx.conf.example` ke `/etc/nginx/sites-available/dashboardepis`, ubah `server_name`, lalu:

```bash
sudo ln -s /etc/nginx/sites-available/dashboardepis /etc/nginx/sites-enabled/dashboardepis
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d dashboard.example.com
```

HTTPS wajib digunakan pada produksi karena cookie sesi dikonfigurasi `secure`.

## Backup

Backup harian database:

```cron
0 2 * * * mysqldump --single-transaction -u dashboard_epis -pPASSWORD dashboard_epis | gzip > /var/backups/dashboardepis-$(date +\%F).sql.gz
```

Simpan password backup melalui `mysql_config_editor` atau file konfigurasi yang hanya dapat dibaca oleh user backup, bukan langsung di cron pada sistem produksi.

## Update Aplikasi

```bash
git pull
npm ci
npm run db:init
npm run build
pm2 restart dashboard-epis --update-env
```
# epistore
