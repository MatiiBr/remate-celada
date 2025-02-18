// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{ Migration, MigrationKind };

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations =
        vec![
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
                    FOREIGN KEY (seller_id) REFERENCES client(id) ON DELETE CASCADE ON UPDATE CASCADE
                    FOREIGN KEY (auction_id) REFERENCES auction(id) ON DELETE CASCADE ON UPDATE CASCADE
                    UNIQUE (number, auction_id)
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
                    auction_id INTEGER NOT NULL,
                    buyer_id INTEGER NOT NULL,
                    total_price REAL NOT NULL DEFAULT 0,
                    deadline TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (auction_id) REFERENCES auction(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (buyer_id) REFERENCES client(id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS sales_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    bundle_id INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    UNIQUE (sale_id, bundle_id)
                );

                CREATE TRIGGER IF NOT EXISTS update_client_timestamp
                AFTER UPDATE ON client
                FOR EACH ROW
                    BEGIN
                        UPDATE client SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
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
                
                CREATE TRIGGER IF NOT EXISTS update_sales_details_timestamp
                AFTER UPDATE ON sales_details
                FOR EACH ROW
                    BEGIN
                        UPDATE sales_details SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_transactions_table",
            sql: "
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    auction_id INTEGER NOT NULL,
                    client_id INTEGER NOT NULL,
                    amount REAL NOT NULL CHECK(amount >= 0),
                    type TEXT CHECK(type IN ('PAGO', 'COBRO')) NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (auction_id) REFERENCES auction(id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE ON UPDATE CASCADE
                );
                
                CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp
                AFTER UPDATE ON transactions
                FOR EACH ROW
                    BEGIN
                        UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
                    END;
            ",
            kind: MigrationKind::Up
        }
    ];

    tauri::Builder
        ::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder
                ::default()
                .add_migrations("sqlite:remateagricola.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
