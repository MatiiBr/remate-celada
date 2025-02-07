import { auctionBundlesReport } from "../../helpers/reports/auctionBundlesReport";
import { zodResolver } from "@hookform/resolvers/zod";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    ControlledSearchSelectField,
    Option,
} from "../ControlledSearchSelectField";
import toast from "react-hot-toast";
import { z } from "zod";

const filterSchema = z.object({
  auction: z.object({
    value: z.string(),
    label: z.string(),
  }),
  client: z.object({
    value: z.string(),
    label: z.string(),
  }),
});
type FilterData = z.infer<typeof filterSchema>;

interface Prop {
  db: Database | null;
}
export const AuctionBundlesReport = ({ db }: Prop) => {
  const { control, watch } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
  });

  const [auctionOptions, setAuctionOptions] = useState<Option[]>([]);

  const selectedAuction = watch("auction");

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

  const handleAuctionSellerReport = async () => {
    try {
      await auctionBundlesReport(db, selectedAuction);
      
    } catch {
      toast.error("Error al intentar guardar el reporte");
    }
  };

  return (
    <div className="flex flex-col p-6 justify-between items-center border-b border-red-500">
      <p className="font-medium">Reporte de Lotes del Remate</p>
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledSearchSelectField
            control={control}
            name="auction"
            options={auctionOptions}
            placeholder="Selecciona un remate"
          />
          <button
            type="button"
            disabled={!selectedAuction}
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
