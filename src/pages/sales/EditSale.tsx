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

export const EditSale = () => {
  const { db } = useDatabase();
  const { auctionId, id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Option[]>([]);
  const [bundles, setBundles] = useState<Option[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const loadFilters = async () => {
    if (!db || !auctionId) return;

    try {
      const clientsResult: any[] = await db.select(
        `SELECT id, company FROM client`
      );
      setClients(clientsResult.map((c) => ({ value: c.id, label: c.company })));
      const bundlesResult: any[] = await db.select(
        `SELECT b.id, b.number
         FROM bundle b
         LEFT JOIN sales_details sd ON b.id = sd.bundle_id
         LEFT JOIN sales s ON sd.sale_id = s.id AND s.auction_id = ?
         WHERE s.id IS NULL AND b.auction_id = ?
         ORDER BY b.number ASC`,
        [auctionId, auctionId]
      );
      setBundles(bundlesResult.map((c) => ({ value: c.id, label: c.number })));
    } catch (error) {
      console.error("Error al cargar filtros de vendedores:", error);
    }
  };

  useEffect(() => {
    const fetchSale = async () => {
      if (!db || !id) return;
      try {
        const result: any[] = await db.select(
          `SELECT 
                s.client_id, 
                c.company AS client_name, 
                s.total_price, 
                s.deadline,
                GROUP_CONCAT(b.id) AS bundle_ids,
                GROUP_CONCAT(b.number) AS bundle_numbers
             FROM sales s
             LEFT JOIN client c ON s.client_id = c.id
             LEFT JOIN sales_details sd ON s.id = sd.sale_id
             LEFT JOIN bundle b ON sd.bundle_id = b.id
             WHERE s.id = ?
             GROUP BY s.id`,
          [id]
        );
        if (result.length === 0) {
          toast.error("Remate no encontrado");
          navigate(`/auction-bundles/${auctionId}`);
          return;
        }
        const sale = result[0];

        const formattedBundles = sale.bundle_ids
          ? sale.bundle_ids
              .split(",")
              .map((bundleId: string, index: number) => ({
                value: parseInt(bundleId),
                label: parseInt(sale.bundle_numbers.split(",")[index]),
              }))
          : [];

        reset({
          client: sale.client_id
            ? { value: sale.client_id, label: sale.client_name }
            : undefined,
          bundles: formattedBundles,
          deadline:
            deadlines.find((d) => d.value === sale.deadline) || undefined,
          price: sale.total_price || "",
        });
      } catch (error) {
        toast.error("Error al cargar Reamte");
      } 
    };
    fetchSale();
  }, [db, id, navigate, reset]);

  useEffect(() => {
    loadFilters();
  }, [db, auctionId, navigate]);
  
  const onSubmit = async (data: FormData) => {
    if (!db || !id) return;

    try {
      await db.execute(
        `UPDATE sales 
         SET client_id = ?, total_price = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [data.client.value, data.price, data.deadline.value, id]
      );

      const existingBundlesResult: any[] = await db.select(
        `SELECT bundle_id FROM sales_details WHERE sale_id = ?`,
        [id]
      );
      const existingBundles = existingBundlesResult.map((row) => row.bundle_id);

      const newBundles = data.bundles.map((bundle) => bundle.value);

      const bundlesToAdd = newBundles.filter(
        (bundle) => !existingBundles.includes(bundle)
      );
      const bundlesToRemove = existingBundles.filter(
        (bundle) => !newBundles.includes(bundle)
      );

      if (bundlesToAdd.length > 0) {
        const values = bundlesToAdd.map(() => "(?, ?)").join(", ");
        const params = bundlesToAdd.flatMap((bundle) => [id, bundle]);

        await db.execute(
          `INSERT INTO sales_details (sale_id, bundle_id) VALUES ${values}`,
          params
        );
      }

      if (bundlesToRemove.length > 0) {
        const placeholders = bundlesToRemove.map(() => "?").join(", ");
        await db.execute(
          `DELETE FROM sales_details WHERE sale_id = ? AND bundle_id IN (${placeholders})`,
          [id, ...bundlesToRemove]
        );
      }

      toast.success("Venta actualizada correctamente");
      navigate(`/auction-bundles/${auctionId}`);
    } catch (error) {
      toast.error("Error al actualizar venta");
      console.error("Error al actualizar remate:", error);
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
