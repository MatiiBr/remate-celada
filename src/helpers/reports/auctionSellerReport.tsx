import Database from "@tauri-apps/plugin-sql";
import { saveExcel } from "../saveExcel";
import { Option } from "../../components/ControlledSearchSelectField";

export const auctionSellerReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedSeller: Option
) => {
  if (!db || !selectedAuction || !selectedSeller) return;

  try {
    const salesResult: any[] = await db.select(
      `SELECT 
            b.number AS Lote,
            b.name AS Producto,
            c.company AS Comprador,
            s.sold_price AS Precio
        FROM bundle b
        JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        JOIN client c ON s.client_id = c.id
        WHERE b.auction_id = ? AND b.seller_id = ?`,
      [selectedAuction.value, selectedSeller.value]
    );

    if (salesResult.length === 0) {
      alert(
        "No hay ventas registradas para este vendedor en el remate seleccionado."
      );
      return;
    }

    const totalSalesResult: any[] = await db.select(
      `SELECT SUM(s.sold_price) AS Total_Ventas 
        FROM bundle b
        JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        WHERE b.auction_id = ? AND b.seller_id = ?`,
      [selectedAuction.value, selectedSeller.value]
    );

    const totalSales = totalSalesResult[0]?.Total_Ventas || 0;

    salesResult.push({
      Lote: "",
      Producto: "Total Vendido",
      Comprador: "",
      Precio: totalSales,
    });

    await saveExcel(
      salesResult,
      "Reporte de Ventas",
      "Guardar Reporte de Ventas",
      "reporte_ventas"
    );
  } catch (error) {
    console.error("Error al generar el reporte de ventas:", error);
  }
};
