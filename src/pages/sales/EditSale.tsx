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
                s.buyer_id AS client_id, 
                c.company AS client_name, 
                s.total_price, 
                s.deadline
             FROM sales s
             LEFT JOIN client c ON s.buyer_id = c.id
             LEFT JOIN sales_details sd ON s.id = sd.sale_id
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
        

        reset({
          client: sale.client_id
            ? { value: sale.client_id, label: sale.client_name }
            : undefined,
          deadline:
            deadlines.find((d) => d.value === sale.deadline) || undefined,
          price: sale.total_price || "",
        });
      } catch (error) {
        toast.error("Error al cargar remate");
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
         SET buyer_id = ?, total_price = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [data.client.value, data.price, data.deadline.value, id]
      );

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
