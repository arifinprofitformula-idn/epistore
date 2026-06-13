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

## Deployment Shared Hosting cPanel

Shared hosting harus menyediakan:

- **Setup Node.js App** atau **Application Manager**
- Node.js minimal `20.19` (disarankan Node.js 22)
- MySQL/MariaDB
- Git Version Control
- Terminal/SSH atau dukungan deployment `.cpanel.yml`

Hosting yang hanya menyediakan PHP dan upload file statis tidak dapat menjalankan backend Express aplikasi ini.

### 1. Buat Database

Melalui **MySQL Database Wizard**:

1. Buat database, misalnya `cpaneluser_dashboard_epis`.
2. Buat database user, misalnya `cpaneluser_dashboard`.
3. Hubungkan user ke database dan berikan **ALL PRIVILEGES**.
4. Catat nama database, username, password, dan host database.

Nama database dan user pada cPanel biasanya otomatis mendapat prefix username akun hosting.

### 2. Pastikan Repository Terhubung

Pada **Git Version Control**, repository aplikasi dapat berada misalnya di:

```text
/home/cpaneluser/repositories/dashboardepis
```

Gunakan folder repository tersebut langsung sebagai **Application Root**. Proyek sudah menyediakan:

- [.cpanel.yml](.cpanel.yml) sebagai deployment hook
- [deploy/cpanel-deploy.sh](deploy/cpanel-deploy.sh) sebagai skrip build
- [app.js](app.js) sebagai startup file Passenger

Untuk private repository, pasang SSH/deploy key milik server hosting pada penyedia Git.

### 3. Buat File `.env`

Di root repository pada server, buat `.env` berdasarkan
`deploy/.env.shared-hosting.example`:

```env
NODE_ENV=production
SESSION_SECRET=isi-random-minimal-32-karakter
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_dashboard_epis
DB_USER=cpaneluser_dashboard
DB_PASSWORD=password-database
DB_CONNECTION_LIMIT=5
DB_AUTO_CREATE=false
DEFAULT_ADMIN_PIN=9999
DEFAULT_BE_PIN=1234
```

`DB_AUTO_CREATE=false` wajib digunakan karena database sudah dibuat melalui cPanel dan user shared hosting biasanya tidak memiliki izin `CREATE DATABASE`.

File `.env` tidak ikut Git dan tidak akan terhapus ketika source diperbarui.

### 4. Daftarkan Aplikasi Node.js

Pada **Setup Node.js App**:

| Pengaturan | Nilai |
|---|---|
| Node.js version | `22` atau minimal `20.19` |
| Application mode | `Production` |
| Application root | path repository, contoh `repositories/dashboardepis` |
| Application URL | domain atau subdomain dashboard |
| Application startup file | `app.js` |

Jangan mengisi `PORT` secara manual. Passenger/cPanel akan memasukkan port internal melalui environment aplikasi.

### 5. Deployment Pertama

Pada **Git Version Control → Manage → Pull or Deploy**:

1. Klik **Update from Remote**.
2. Klik **Deploy HEAD Commit**.

Deployment menjalankan:

```text
npm ci
npm run db:init
npm run build
npm prune --omit=dev
touch tmp/restart.txt
```

`db:init` aman dijalankan berulang kali. Perintah ini membuat tabel yang belum tersedia dan hanya membuat akun serta data awal ketika tabel masih kosong.

Jika menu deploy tidak tersedia tetapi Terminal tersedia:

```bash
cd ~/repositories/dashboardepis
bash deploy/cpanel-deploy.sh
```

### 6. Deployment Update

Setelah perubahan baru masuk ke branch repository:

1. Buka **Git Version Control → Manage**.
2. Klik **Update from Remote**.
3. Klik **Deploy HEAD Commit**.

Skrip akan memasang dependency sesuai lockfile, memperbarui schema yang diperlukan, build frontend, dan me-restart aplikasi.

### Troubleshooting

- **`npm tidak ditemukan`**: aktifkan aplikasi Node.js terlebih dahulu atau minta provider mengaktifkan Node.js Selector.
- **`Access denied for user`**: periksa `DB_USER`, `DB_PASSWORD`, dan assignment user ke database.
- **`Unknown database`**: gunakan nama lengkap dengan prefix cPanel dan pastikan `DB_AUTO_CREATE=false`.
- **HTTP 503**: periksa startup file harus `app.js`, versi Node.js, log aplikasi, dan isi `.env`.
- **Deploy button tidak aktif**: pastikan `.cpanel.yml` berada di root repository dan working tree server tidak memiliki perubahan Git.

Dokumentasi resmi:

- [cPanel Git Version Control](https://docs.cpanel.net/cpanel/files/git-version-control/)
- [cPanel Git Deployment](https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-set-up-deployment/)
- [cPanel Node.js Application](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)

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
