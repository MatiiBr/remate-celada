import Database from "@tauri-apps/plugin-sql";
import { Option } from "../../components/ControlledSearchSelectField";
import toast from "react-hot-toast";
import { auctionBundlesTemplate } from "../templates/auctionBundlesTemplate";
import { savePdfFromHtml } from "../savePDF";

export const auctionBundlesReport = async (
  db: Database | null,
  selectedAuction: Option
) => {
  if (!db || !selectedAuction) return;

  try {
    const bundlesResult: any[] = await db.select(
      `SELECT 
            b.number AS Lote,
            b.name AS Producto,
            se.company AS Vendedor
        FROM bundle b
        JOIN seller se ON b.seller_id = se.id
        WHERE b.auction_id = ?
        ORDER BY b.number ASC;
      `,
      [selectedAuction.value]
    );

    if (bundlesResult.length === 0) {
      alert("No hay lotes registrados para el remate seleccionado.");
      return;
    }
    
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${now.getFullYear()}_${String(now.getHours()).padStart(
      2,
      "0"
    )}${String(now.getMinutes()).padStart(2, "0")}`;

    await savePdfFromHtml(
      auctionBundlesTemplate(bundlesResult, selectedAuction.label),
      `LDR_${selectedAuction.value}_${formattedDate}`
    );

    toast.success("Reporte generado", {
      duration: 3000,
      position: "bottom-center",
      style: {
        fontWeight: "600",
      },
    });
  } catch (error) {
    toast.error("Error al momento de generar el reporte", {
      duration: 3000,
      position: "bottom-center",
      style: {
        fontWeight: "600",
      },
    });
    console.error("Error al generar el reporte de cliente:", error);
  }
};
