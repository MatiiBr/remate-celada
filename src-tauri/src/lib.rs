// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS client (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company TEXT UNIQUE NOT NULL,
                    first_name TEXT,
                    last_name TEXT,
                    email TEXT,
                    phone TEXT,
                    province TEXT NOT NULL,
                    city TEXT NOT NULL,
                    deleted INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS seller (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company TEXT UNIQUE NOT NULL,
                    first_name TEXT,
                    last_name TEXT,
                    email TEXT,
                    phone TEXT,
                    province TEXT NOT NULL,
                    city TEXT NOT NULL,
                    deleted INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS bundle (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    number INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    observations TEXT,
                    seller_id INTEGER NOT NULL,
                    auction_id INTEGER NOT NULL,
                    deleted INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (seller_id) REFERENCES seller(id) ON DELETE CASCADE ON UPDATE CASCADE
                    FOREIGN KEY (auction_id) REFERENCES auction(id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS auction (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    province TEXT NOT NULL,
                    city TEXT NOT NULL,
                    date TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT('PENDIENTE'),
                    deleted INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bundle_id INTEGER NOT NULL,
                    auction_id INTEGER NOT NULL,
                    client_id INTEGER,
                    sold_price REAL,
                    sold INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (auction_id) REFERENCES auction(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE SET NULL ON UPDATE CASCADE
                );

                INSERT INTO seller (company, first_name, last_name, email, phone, province, city)
                VALUES 
                    ('AgroVentas S.A.', 'Juan', 'Pérez', 'juan.perez@agroventas.com', '3412345678', 'Buenos Aires', 'La Plata'),
                    ('CampoSur Ltda.', 'María', 'Gómez', 'maria.gomez@camposur.com', '3519876543', 'Córdoba', 'Villa María'),
                    ('Granos del Norte', 'Carlos', 'Fernández', 'carlos.fernandez@granosnorte.com', '3815674321', 'Salta', 'Salta'),
                    ('AgroAndes', 'Ana', 'Martínez', 'ana.martinez@agroandes.com', '2613456789', 'Mendoza', 'Mendoza');

                INSERT INTO client (company, first_name, last_name, email, phone, province, city)
                VALUES 
                    ('Distribuidora Rural', 'Roberto', 'López', 'roberto.lopez@distribuidorural.com', '3425671234', 'Santa Fe', 'Rosario'),
                    ('El Buen Campo', 'Lucía', 'Ramírez', 'lucia.ramirez@elbuencampo.com', '3626784321', 'Chaco', 'Resistencia'),
                    ('Productos del Agro', 'Federico', 'Santos', 'federico.santos@productosagro.com', '3812349876', 'Tucumán', 'San Miguel de Tucumán'),
                    ('Ganadería del Sur', 'Carolina', 'Herrera', 'carolina.herrera@ganaderiasur.com', '2615678765', 'Mendoza', 'San Rafael');

                INSERT INTO auction (name, province, city, date, status)
                    VALUES 
                        ('Remate de Maquinaria Agrícola - Buenos Aires', 'Buenos Aires', 'Pergamino', '2025-03-15', 'PENDIENTE'),
                        ('Subasta de Tractores - Córdoba', 'Córdoba', 'Villa María', '2025-04-20', 'CANCELADO'),
                        ('Liquidación de Equipos - Santa Fe', 'Santa Fe', 'Rosario', '2025-05-10', 'EN CURSO'),
                        ('Remate Especial - Mendoza', 'Mendoza', 'Mendoza', '2025-06-05', 'FINALIZADO');

                INSERT INTO bundle (number, name, observations, seller_id, auction_id)
                    VALUES 
                        (201, 'Tractor John Deere 5075E', '75HP, transmisión sincronizada, 4x4', 1, 1),
                        (202, 'Cosechadora Case IH Axial-Flow 7150', 'Modelo 2023, motor 400HP, plataforma de 30 pies', 2, 2),
                        (203, 'Sembradora Agrometal TX Mega 12', 'Siembra directa, 12 surcos, fertilización incorporada', 3, 3),
                        (204, 'Pulverizadora PLA MAP 3', 'Pulverización inteligente, 30 metros de ancho, tecnología de precisión', 4, 4);

                CREATE TRIGGER IF NOT EXISTS update_client_timestamp
                AFTER UPDATE ON client
                FOR EACH ROW
                    BEGIN
                        UPDATE client SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;

                CREATE TRIGGER IF NOT EXISTS update_seller_timestamp
                AFTER UPDATE ON seller
                FOR EACH ROW
                    BEGIN
                        UPDATE seller SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;

                CREATE TRIGGER IF NOT EXISTS update_bundle_timestamp
                AFTER UPDATE ON bundle
                FOR EACH ROW
                    BEGIN
                        UPDATE bundle SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;

                CREATE TRIGGER IF NOT EXISTS update_auction_timestamp
                AFTER UPDATE ON auction
                FOR EACH ROW
                    BEGIN
                        UPDATE auction SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;

                
                CREATE TRIGGER IF NOT EXISTS update_sales_timestamp
                AFTER UPDATE ON sales
                FOR EACH ROW
                    BEGIN
                        UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
