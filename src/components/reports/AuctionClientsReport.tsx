import { z } from "zod";
import {
  ControlledSearchSelectField,
  Option,
} from "../ControlledSearchSelectField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { auctionClientReport } from "../../helpers/reports/auctionClientReport";
import toast from "react-hot-toast";

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
export const AuctionClientsReport = ({ db }: Prop) => {
  const { control, watch } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
  });

  const [auctionOptions, setAuctionOptions] = useState<Option[]>([]);
  const [clientOptions, setClientOptions] = useState<Option[]>([]);

  const selectedAuction = watch("auction");
  const selectedClient = watch("client");

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
    const fetchClients = async () => {
      const clients: any[] = await db.select(
        `SELECT DISTINCT cl.id, cl.company AS client_company
          FROM sales s
          JOIN sales_details sd ON s.id = sd.sale_id
          JOIN bundle b ON sd.bundle_id = b.id
          JOIN client cl ON s.buyer_id = cl.id 
          WHERE b.auction_id = ?;`,
        [selectedAuction.value]
      );

      setClientOptions(
        clients.map((c) => ({ value: c.id, label: c.client_company }))
      );
    };
    fetchClients();
  }, [db, selectedAuction]);

  const handleAuctionSellerReport = async () => {
    try {
      await auctionClientReport(db, selectedAuction, selectedClient);
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
      <p className="font-medium">Reporte de Ventas segun remate y comprador</p>
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
            name="client"
            options={clientOptions}
            placeholder="Selecciona un comprador"
          />
          <button
            type="button"
            disabled={!selectedAuction || !selectedClient}
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
