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
- **Brand Executive** dapat memilih seluruh EPI Store, tetapi hanya dapat mengubah realisasi brand yang ditugaskan: GOLDGRAM, MEEZAN GOLD, atau SILVERGRAM.
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
- BE demo: `1234`, ditugaskan ke brand GOLDGRAM

Segera ganti PIN akun awal melalui menu **Akses & PIN**.

## Struktur Database

- `users`: akun, peran, PIN hash, dan status aktif
- `stores`: master EPI Store dan target
- `user_brands`: penugasan pengguna ke GOLDGRAM, MEEZAN GOLD, atau SILVERGRAM
- `realisations`: realisasi bulanan per store
- `audit_logs`: histori perubahan penting
- `sessions`: sesi login Express

Kombinasi `store_id`, `year`, dan `month_index` pada realisasi bersifat unik sehingga satu periode tidak menghasilkan data duplikat.

## Build Produksi

```bash
npm run build
```

Frontend hasil build berada di `public/`. Folder ini harus ikut di-commit agar shared hosting tidak perlu menjalankan Node.js.

## Deployment Shared Hosting Tanpa Node.js

Konfigurasi yang digunakan:

- Domain: `https://dashboardepis.arvadigital.web.id`
- Document root: `/home/arvadigi/repositories/epistore`
- Backend: PHP 8.1+ dengan ekstensi PDO MySQL
- Database: MySQL/MariaDB
- Frontend: hasil build React pada folder `public/`

Node.js hanya diperlukan di komputer pengembangan untuk menghasilkan folder `public/`. Server shared hosting tidak menjalankan `app.js`, Express, PM2, atau Passenger.

### 1. Buat Database

Melalui **MySQL Database Wizard**:

1. Buat database, misalnya `arvadigi_dashboard_epis`.
2. Buat database user, misalnya `arvadigi_dashboard`.
3. Hubungkan user ke database dan berikan **ALL PRIVILEGES**.
4. Catat nama database, username, password, dan host database.

Nama database dan user pada cPanel biasanya otomatis mendapat prefix username akun hosting.

### 2. Buat Konfigurasi PHP

Buat file berikut melalui File Manager:

```text
/home/arvadigi/repositories/epistore/api/config.local.php
```

Salin isi [api/config.example.php](api/config.example.php), lalu sesuaikan:

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'arvadigi_dashboard_epis',
        'user' => 'arvadigi_dashboard',
        'password' => 'PASSWORD_DATABASE',
    ],
    'app' => [
        'install_key' => 'KUNCI_RANDOM_YANG_PANJANG',
        'default_admin_pin' => '9999',
        'default_be_pin' => '1234',
        'secure_cookie' => true,
    ],
];
```

`config.local.php` telah masuk `.gitignore`, sehingga kredensial server tidak tertimpa ketika repository diperbarui.

### 3. Build dan Push dari Komputer Lokal

```bash
npm install
npm run build
git add public api database .htaccess setup.html
git commit -m "Deploy PHP shared hosting"
git push
```

Folder `public/` sengaja disimpan di repository karena shared hosting tidak memiliki Node.js.

### 4. Tarik Source di Shared Hosting

Pada **Git Version Control → Manage**:

1. Klik **Update from Remote**.
2. Klik **Deploy HEAD Commit** bila tombol deployment tersedia.

Hook [.cpanel.yml](.cpanel.yml) hanya memverifikasi bahwa `public/index.html` dan `api/config.local.php` tersedia. Tidak ada perintah npm pada server.

### 5. Inisialisasi Database

Buka:

```text
https://dashboardepis.arvadigital.web.id/setup.html
```

Masukkan `install_key`. Installer membuat tabel, 28 store, data awal, admin `9999`, dan BE demo `1234`. Setelah berhasil, ganti `install_key` pada konfigurasi dan segera ubah PIN akun awal.

Installer juga menjalankan migrasi penugasan brand. Pengguna BE lama yang belum memiliki penugasan brand akan diberi GOLDGRAM sebagai nilai awal; administrator kemudian dapat menggantinya melalui menu **Akses & PIN**.

### 6. Update Berikutnya

Setiap perubahan frontend harus dibuild lokal:

```bash
npm run build
git add public
git commit -m "Update dashboard"
git push
```

Kemudian jalankan **Update from Remote** dan **Deploy HEAD Commit** di cPanel.

Jika update membawa perubahan schema, buka kembali `/setup.html` dan jalankan installer menggunakan `install_key`. Data realisasi yang sudah ada tidak dihapus.

### Troubleshooting

- **Halaman 403/404**: pastikan Apache mengizinkan `.htaccess` dan document root tepat `/home/arvadigi/repositories/epistore`.
- **API 500**: pastikan PHP memiliki ekstensi `pdo_mysql`, lalu periksa error log cPanel.
- **Konfigurasi belum tersedia**: buat `api/config.local.php`, bukan `.env`.
- **Access denied**: periksa nama database/user dengan prefix `arvadigi_` dan assignment ALL PRIVILEGES.
- **Frontend lama**: jalankan build lokal dan pastikan perubahan folder `public/` ikut di-push.

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
