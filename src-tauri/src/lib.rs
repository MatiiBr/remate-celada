// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{ Migration, MigrationKind };

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
                    deleted INTEGER DEFAULT(0),
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (seller_id) REFERENCES seller(id) ON DELETE CASCADE ON UPDATE CASCADE
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

                INSERT INTO bundle (number, name, observations, seller_id)
                VALUES 
                    (201, 'Tractor John Deere 5075E', '75HP, transmisión sincronizada, 4x4', 1),
                    (202, 'Cosechadora Case IH Axial-Flow 7150', 'Modelo 2023, motor 400HP, plataforma de 30 pies', 2),
                    (203, 'Sembradora Agrometal TX Mega 12', 'Siembra directa, 12 surcos, fertilización incorporada', 3),
                    (204, 'Pulverizadora PLA MAP 3', 'Pulverización inteligente, 30 metros de ancho, tecnología de precisión', 4);
                
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
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder
        ::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder
                ::default()
                .add_migrations("sqlite:mydatabase.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
