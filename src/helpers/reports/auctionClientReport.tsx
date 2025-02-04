import Database from "@tauri-apps/plugin-sql";
import { saveExcel } from "../saveExcel";
import { Option } from "../../components/ControlledSearchSelectField";

export const auctionClientReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedClient: Option
) => {
  if (!db || !selectedAuction || !selectedClient) return;

  try {
    const salesResult: any[] = await db.select(
      `SELECT 
            b.number AS Lote,
            b.name AS Producto,
            se.company AS Vendedor, 
            c.company AS Comprador,
            s.sold_price AS Precio
        FROM bundle b
        JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        JOIN client c ON s.client_id = c.id
        JOIN seller se ON b.seller_id = se.id
        WHERE b.auction_id = ? AND s.client_id = ?;`,
      [selectedAuction.value, selectedClient.value]
    );

    if (salesResult.length === 0) {
      alert(
        "No hay compras registradas para este cliente en el remate seleccionado."
      );
      return;
    }

    const totalSalesResult: any[] = await db.select(
      `SELECT SUM(s.sold_price) AS Total_Compras
        FROM sales s
        JOIN bundle b ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        WHERE b.auction_id = ? AND s.client_id = ?;`,
      [selectedAuction.value, selectedClient.value]
    );

    const totalSales = totalSalesResult[0]?.Total_Ventas || 0;

    salesResult.push({
      Lote: "",
      Producto: "Total Comprado",
      Vendedor: "",
      Comprador: "",
      Precio: totalSales.toFixed(2), 
    });

    await saveExcel(
      salesResult,
      "Reporte de Compras",
      "Guardar Reporte de Compras",
      `reporte_compras_${selectedClient.label}`
    );
  } catch (error) {
    console.error("Error al generar el reporte de cliente:", error);
  }
};
