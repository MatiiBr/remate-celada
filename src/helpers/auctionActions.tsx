import { ask } from "@tauri-apps/plugin-dialog";
import { AUCTION_STATUSES } from "./auctionConstants";

const executeUpdate = async (db: any, query: string, params: any[], reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  try {
    await db?.execute(query, params);
    reload(searchTerm, selectedProvince, selectedStatus);
  } catch (error) {
    console.error("Error al actualizar remate:", error);
  }
};

export const handleDelete = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser eliminado.", { title: "Borrar remate", kind: "warning" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET deleted = 1 WHERE id = ?", [id], reload, searchTerm, selectedProvince, selectedStatus);
};

export const handleCancel = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser cancelado.", { title: "Cancelar remate", kind: "warning" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET status = ? WHERE id = ?", [AUCTION_STATUSES.CANCELADO, id], reload, searchTerm, selectedProvince, selectedStatus);
};

export const handlePause = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser pausado.", { title: "Pausar remate", kind: "warning" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET status = ? WHERE id = ?", [AUCTION_STATUSES.PAUSADO, id], reload, searchTerm, selectedProvince, selectedStatus);
};

export const handleResume = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser reanudado.", { title: "Reanudar remate", kind: "warning" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET status = ? WHERE id = ?", [AUCTION_STATUSES.EN_CURSO, id], reload, searchTerm, selectedProvince, selectedStatus);
};

export const handleRestore = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser restaurado.", { title: "Restaurar remate", kind: "warning" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET status = ? WHERE id = ?", [AUCTION_STATUSES.PENDIENTE, id], reload, searchTerm, selectedProvince, selectedStatus);
};

export const handleInit = async (db: any, id: number, reload: (query: string, provinceFilter: string, selectedStatus: string) => void, searchTerm: string, selectedProvince: string, selectedStatus: string) => {
  const confirm = await ask("El remate va a ser iniciado.", { title: "Comenzar remate", kind: "info" });
  if (confirm) await executeUpdate(db, "UPDATE auction SET status = ? WHERE id = ?", [AUCTION_STATUSES.EN_CURSO, id], reload, searchTerm, selectedProvince, selectedStatus);
};