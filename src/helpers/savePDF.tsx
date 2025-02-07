import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";


export const savePdfFromHtml = async (htmlContent: string, name: string) => {
    try {
      const savePath = await save({
        title: "Guardar HTML del Reporte",
        defaultPath: `${name}.html`,
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
  
      if (savePath) {
        const htmlBuffer = new TextEncoder().encode(htmlContent);
        await writeFile(savePath, htmlBuffer);
        console.log("📂 HTML guardado en:", savePath);
  
        await invoke("convert_html_to_pdf", { htmlPath: savePath });
      }
    } catch (error) {
      console.error("Error al generar el HTML:", error);
    }
  };
  