import Database from "@tauri-apps/plugin-sql";
import { Option } from "../../components/ControlledSearchSelectField";
import { AuctionTemplateData } from "./auctionSellerReport";
import { savePdfFromHtml } from "../savePDF";
import { auctionClientTemplate } from "../templates/auctionClientTemplate";

export const auctionClientReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedClient: Option
) => {
  if (!db || !selectedAuction || !selectedClient) return;

  try {
    const salesResult: any[] = await db.select(
      `WITH RankedDetails AS (
          SELECT 
              b.number,
              b.name,
              c.company AS company,
              s.id AS sale_id,
              s.total_price,
              s.deadline,
              a.date,
              sd.sale_id AS sale_detail_id,
              ROW_NUMBER() OVER (PARTITION BY sd.sale_id ORDER BY b.number ASC) AS row_num,
              COUNT(*) OVER (PARTITION BY sd.sale_id) AS total_rows
          FROM bundle b
          LEFT JOIN sales_details sd ON b.id = sd.bundle_id
          LEFT JOIN sales s ON s.id = sd.sale_id AND s.auction_id = b.auction_id
          LEFT JOIN client c ON s.client_id = c.id
          LEFT JOIN auction a ON b.auction_id = a.id
          WHERE b.auction_id = ? AND s.client_id = ?
      )
      SELECT 
          number,
          name,
          company,
          CASE 
              WHEN row_num = total_rows THEN total_price
              ELSE NULL
          END AS total_price,
          deadline,
          date,
          sale_id
      FROM RankedDetails
      ORDER BY sale_id, number ASC;
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
      auctionClientTemplate(formattedSalesResult),
      `CCR_${selectedAuction.value}_${formattedDate}`
    );
  } catch (error) {
    console.error("Error al generar el reporte de cliente:", error);
  }
};
