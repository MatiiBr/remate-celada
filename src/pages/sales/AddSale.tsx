import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ContentLayout } from "../../components/ContentLayout";
import { useNavigate, useParams } from "react-router-dom";
import {
  ControlledSearchSelectField,
  Option,
} from "../../components/ControlledSearchSelectField";
import { useEffect, useState } from "react";
import { ControlledPriceField } from "../../components/ControlledPriceField";

const formSchema = z.object({
  client: z.object({
    value: z.number(),
    label: z.string(),
  }),
  seller: z.optional(
    z.object({
      value: z.number(),
      label: z.string(),
    })
  ),
  bundles: z.array(
    z.object({
      value: z.number(),
      label: z.number(),
    })
  ),
  deadline: z.object({
    value: z.string(),
    label: z.string(),
  }),
  price: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
});

type FormData = z.infer<typeof formSchema>;

const deadlines: Option[] = [
  { label: "0 - 30 DIAS", value: "0 - 30 DIAS" },
  { label: "6 CHEQUES", value: "6 CHEQUES" },
  { label: "8 CHEQUES", value: "8 CHEQUES" },
  { label: "10 CHEQUES", value: "10 CHEQUES" },
  { label: "12 CHEQUES", value: "12 CHEQUES" },
];

export const AddSale = () => {
  const { db } = useDatabase();
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Option[]>([]);
  const [sellers, setSellers] = useState<Option[]>([]);
  const [bundles, setBundles] = useState<Option[]>([]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    resetField,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const selectedSeller = watch("seller");
  const loadFilters = async () => {
    if (!db || !auctionId) return;

    try {
      const clientsResult: any[] = await db.select(
        `SELECT id, company FROM client`
      );
      setClients(clientsResult.map((c) => ({ value: c.id, label: c.company })));
      const sellersResult: any[] = await db.select(
        `SELECT DISTINCT c.id, c.company
         FROM client c
         JOIN bundle b ON c.id = b.seller_id
         WHERE b.auction_id = ?
         ORDER BY c.company ASC`,
        [auctionId]
      );
      setSellers(sellersResult.map((s) => ({ value: s.id, label: s.company })));
    } catch (error) {
      console.error("Error al cargar filtros de vendedores:", error);
    }
  };

  useEffect(() => {
    if (!db || !selectedSeller) return;
    resetField("bundles", { defaultValue: [] });
    const fetchBundles = async () => {
      let bundlesQuery = `
      SELECT b.id, b.number
      FROM bundle b
      LEFT JOIN sales_details sd ON b.id = sd.bundle_id
      LEFT JOIN sales s ON sd.sale_id = s.id AND s.auction_id = ?
      WHERE s.id IS NULL AND b.auction_id = ?`;

      const queryParams = [auctionId, auctionId];

      if (selectedSeller) {
        bundlesQuery += ` AND b.seller_id = ?`;
        queryParams.push(selectedSeller.value.toString());
      }

      bundlesQuery += ` ORDER BY b.number ASC`;

      const bundlesResult: any[] = await db.select(bundlesQuery, queryParams);

      setBundles(bundlesResult.map((b) => ({ value: b.id, label: b.number })));
    };
    fetchBundles();
  }, [db, selectedSeller]);

  useEffect(() => {
    loadFilters();
  }, [db, auctionId, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!db) return;
    let saleId: number;
    try {
      const insertedSale = await db.execute(
        `INSERT INTO sales (auction_id, buyer_id, total_price, deadline) 
       VALUES (?, ?, ?, ?)`,
        [auctionId, data.client.value, data.price, data.deadline.value]
      );

      if (!insertedSale.lastInsertId) {
        throw new Error("No se pudo obtener el ID de la venta");
      }

      saleId = insertedSale.lastInsertId;

      const values = data.bundles.map(() => "(?, ?)").join(", ");
      const params = data.bundles.flatMap((bundleId) => [
        saleId,
        bundleId.value,
      ]);

      await db.execute(
        `INSERT INTO sales_details (sale_id, bundle_id) 
         VALUES ${values}
         ON CONFLICT(sale_id, bundle_id) DO NOTHING`,
        params
      );

      toast.success("Venta guardada correctamente");
      navigate(`/auction-bundles/${auctionId}`);
    } catch (error) {
      toast.error("Error al guardar venta");
      console.error("Error al agregar remate:", error);
    }
  };
  return (
    <ContentLayout>
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log(errors))}>
        <PersistingTopBar
          to={`/auction-bundles/${auctionId}`}
          isSubmitting={isSubmitting}
        />
        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4 mt-4">
          <ControlledSearchSelectField
            control={control}
            name="seller"
            options={sellers!}
            placeholder="Seleccionar vendedor"
          />
          <ControlledSearchSelectField
            control={control}
            name="bundles"
            options={bundles!}
            placeholder="Seleccionar lote/s"
            isMulti
          />
          <ControlledSearchSelectField
            control={control}
            name="client"
            options={clients!}
            placeholder="Seleccionar comprador"
          />

          <ControlledPriceField name={"price"} control={control} />
          <ControlledSearchSelectField
            control={control}
            name={"deadline"}
            options={deadlines}
            placeholder="Seleccionar plazo"
          />
        </div>
      </form>
      <Toaster />
    </ContentLayout>
  );
};
