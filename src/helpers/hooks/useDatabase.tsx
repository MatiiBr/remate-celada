import Database from "@tauri-apps/plugin-sql";
import { useState, useEffect } from "react";

export const useDatabase = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDb() {
      try {
        const database = await Database.load("sqlite:remateagricola.db");
        setDb(database);
      } catch (err) {
        setError("Error al conectar con la base de datos.");
        console.error("DB Error:", err);
      } finally {
        setLoading(false);
      }
    }

    initDb();
  }, []);

  return { db, loading, error };
};
