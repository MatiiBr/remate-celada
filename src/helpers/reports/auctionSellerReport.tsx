import Database from "@tauri-apps/plugin-sql";
import { Option } from "../../components/ControlledSearchSelectField";
import { auctionSellerTemplate } from "../templates/auctionSellerTemplate";
import { savePdfFromHtml } from "../savePDF";

export type AuctionTemplateData = {
  number: number;
  name: string;
  company: string;
  total_price: number;
  quantity: number;
  deadline: string;
  date: string;
  sale_id: number;
};

export const auctionSellerReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedSeller: Option
) => {
  if (!db || !selectedAuction || !selectedSeller) return;

  try {
    const salesResult: any[] = await db.select(
      `WITH RankedDetails AS (
          SELECT 
              b.number,
              b.name,
              cl.company AS company,
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
          LEFT JOIN client cl ON b.seller_id = cl.id
          LEFT JOIN auction a ON b.auction_id = a.id
          WHERE b.auction_id = ? AND b.seller_id = ?
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
      ORDER BY sale_id, number ASC;`,
      [selectedAuction.value, selectedSeller.value]
    );

    if (salesResult.length === 0) {
      alert(
        "No hay ventas registradas para este vendedor en el remate seleccionado."
      );
      return;
    }

    const formattedSalesResult: AuctionTemplateData[] = salesResult.map(
      (sale) => {
        return {
          quantity: 1,
          ...sale,
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
      auctionSellerTemplate(formattedSalesResult),
      `VVR_${selectedAuction.value}_${formattedDate}`
    );
  } catch (error) {
    console.error("Error al generar el reporte de ventas:", error);
  }
};
