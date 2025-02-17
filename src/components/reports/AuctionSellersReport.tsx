import { z } from "zod";
import {
  ControlledSearchSelectField,
  Option,
} from "../ControlledSearchSelectField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { auctionSellerReport } from "../../helpers/reports/auctionSellerReport";
import Database from "@tauri-apps/plugin-sql";
import toast from "react-hot-toast";

const filterSchema = z.object({
  auction: z.object({
    value: z.string(),
    label: z.string(),
  }),
  seller: z.object({
    value: z.string(),
    label: z.string(),
  }),
});
type FilterData = z.infer<typeof filterSchema>;

interface Prop {
  db: Database | null;
}
export const AuctionSellersReport = ({ db }: Prop) => {
  const { control, watch } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
  });

  const [auctionOptions, setAuctionOptions] = useState<Option[]>([]);
  const [sellerOptions, setSellerOptions] = useState<Option[]>([]);

  const selectedAuction = watch("auction");
  const selectedSeller = watch("seller");

  useEffect(() => {
    if (!db) return;

    const fetchFilters = async () => {
      try {
        const auctions: any[] = await db.select(
          `SELECT id, name FROM auction WHERE deleted = 0`
        );

        setAuctionOptions(
          auctions.map((a) => ({ value: a.id, label: a.name }))
        );
      } catch (error) {
        console.error("Error al cargar filtros:", error);
      }
    };

    fetchFilters();
  }, [db]);

  useEffect(() => {
    if (!db || !selectedAuction) return;
    const fetchSellers = async () => {
      const sellers: any[] = await db.select(
        `SELECT DISTINCT se.id, se.company AS seller_company
          FROM sales s
          JOIN sales_details sd ON s.id = sd.sale_id
          JOIN bundle b ON sd.bundle_id = b.id
          JOIN seller se ON b.seller_id = se.id
          WHERE s.auction_id = ?;`,
        [selectedAuction.value]
      );
      console.log("SELLERS", sellers);
      setSellerOptions(
        sellers.map((s) => ({ value: s.id, label: s.seller_company }))
      );
    };
    fetchSellers();
  }, [db, selectedAuction]);

  const handleAuctionSellerReport = async () => {
    try {
      await auctionSellerReport(db, selectedAuction, selectedSeller);
      toast.success("Reporte generado", {
        duration: 3000,
        position: "bottom-center",
        style: {
          fontWeight: "600",
        },
      });
    } catch {
      toast.error("Error al intentar guardar el reporte");
    }
  };

  return (
    <div className="flex flex-col p-6 justify-between items-center border-b border-red-500">
      <p className="font-medium">Reporte de Ventas segun remate y vendedor</p>
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledSearchSelectField
            control={control}
            name="auction"
            options={auctionOptions}
            placeholder="Selecciona un remate"
          />
          <ControlledSearchSelectField
            control={control}
            name="seller"
            options={sellerOptions}
            placeholder="Selecciona un vendedor"
          />
          <button
            type="button"
            disabled={!selectedAuction || !selectedSeller}
            onClick={handleAuctionSellerReport}
            className="disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-red-700 disabled:cursor-not-allowed py-2 px-3 border cursor-pointer ml-auto border-red-700 text-red-700 hover:bg-red-700 hover:text-white font-semibold rounded"
          >
            Descargar Reporte
          </button>
        </form>
      </div>
    </div>
  );
};
