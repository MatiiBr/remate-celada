import * as XLSX from "xlsx";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";

export const saveExcel = async (
  data: any[],
  sheetName: string | undefined,
  dialogTitle: any,
  path: any
) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = new Uint8Array(
    XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  );

  const savePath = await save({
    title: dialogTitle,
    defaultPath: `${path}.xlsx`,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });

  if (savePath) {
    await writeFile(savePath, excelBuffer);
    console.log("📂 Reporte guardado correctamente en:", savePath);
  }
};
