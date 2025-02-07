import Database from "@tauri-apps/plugin-sql";
import { Option } from "../../components/ControlledSearchSelectField";
import { auctionSalesTemplate } from "../templates/auctionSellerTemplate";
import { savePdfFromHtml } from "../savePDF";

export type AuctionTemplateData = {
  number: number;
  name: string;
  company: string;
  sold_price: number;
  quantity: number;
  deadline: string;
  date: string;
};

export const auctionSellerReport = async (
  db: Database | null,
  selectedAuction: Option,
  selectedSeller: Option
) => {
  if (!db || !selectedAuction || !selectedSeller) return;

  try {
    const salesResult: any[] = await db.select(
      `SELECT 
            b.number,
            b.name,
            se.company,
            s.sold_price,
            a.date
        FROM bundle b
        JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        LEFT JOIN seller se ON b.seller_id = se.id
        LEFT JOIN auction a ON b.auction_id = a.id
        WHERE b.auction_id = ? AND b.seller_id = ?
        ORDER BY b.number ASC;
      `,
      [selectedAuction.value, selectedSeller.value]
    );

    if (salesResult.length === 0) {
      alert(
        "No hay ventas registradas para este vendedor en el remate seleccionado."
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
      auctionSalesTemplate(formattedSalesResult, 'seller'),
      `VVR_${selectedAuction.value}_${formattedDate}`
    );
  } catch (error) {
    console.error("Error al generar el reporte de ventas:", error);
  }
};
