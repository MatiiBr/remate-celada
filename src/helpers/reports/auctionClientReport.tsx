import Database from "@tauri-apps/plugin-sql";
import { Option } from "../../components/ControlledSearchSelectField";
import { AuctionTemplateData } from "./auctionSellerReport";
import { savePdfFromHtml } from "../savePDF";
import { auctionSalesTemplate } from "../templates/auctionSellerTemplate";

export const auctionClientReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedClient: Option
) => {
  if (!db || !selectedAuction || !selectedClient) return;

  try {
    const salesResult: any[] = await db.select(
      `SELECT 
            b.number,
            b.name,
            c.company,
            s.sold_price,
            a.date
        FROM bundle b
        JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        JOIN client c ON s.client_id = c.id
        LEFT JOIN auction a ON b.auction_id = a.id
        WHERE b.auction_id = ? AND s.client_id = ?
        ORDER BY b.number ASC;
      `,
      [selectedAuction.value, selectedClient.value]
    );

    if (salesResult.length === 0) {
      alert(
        "No hay compras registradas para este cliente en el remate seleccionado."
      );
      return;
    }

    const formattedSalesResult: AuctionTemplateData[] = salesResult.map(
      (res) => {
        return {
          quantity: 1,
          deadline: "12 CTAS",
          ...res,
        };
      }
    );

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${now.getFullYear()}_${String(now.getHours()).padStart(
      2,
      "0"
    )}${String(now.getMinutes()).padStart(2, "0")}`;

    await savePdfFromHtml(
      auctionSalesTemplate(formattedSalesResult, "client"),
      `CCR_${selectedAuction.value}_${formattedDate}`
    );
  } catch (error) {
    console.error("Error al generar el reporte de cliente:", error);
  }
};
