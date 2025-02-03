import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { useEffect, useState } from "react";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { AsyncOption, ControlledAsyncSearchSelectField } from "../../components/ControlledAsyncSearchSelectField";
import { ControlledNumberField } from "../../components/ControlledNumberField";
import { ControlledTextAreaField } from "../../components/ControlledTextAreaField";

const bundleSchema = z.object({
  number: z.coerce
    .number({ required_error: "El número de lote es obligatorio" })
    .min(1, "El número de lote debe ser mayor a 0"),
  name: z.string({ required_error: "El nombre es obligatorio" }),
  observations: z.optional(z.string()),
  seller: z.object({
    value: z.number(),
    label: z.string(),
  }),
});

type BundleFormData = z.infer<typeof bundleSchema>;

export const EditBundle = () => {
  const { db } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema),
  });

  const loadSellers = async (inputValue: string = ""): Promise<AsyncOption[]> => {
    if (!db) return [];
    try {
      const result: any[] = await db.select(
        "SELECT id, company FROM seller WHERE company LIKE ?",
        [`%${inputValue}%`]
      );

      return result.map((seller) => ({
        value: seller.id,
        label: seller.company,
      }));
    } catch (error) {
      console.error("Error al obtener vendedores:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchBundle = async () => {
      if (!db || !id) return;
      try {
        const result: any[] = await db.select(
          `SELECT bundle.*, seller.id as seller_id, seller.company as seller_company 
           FROM bundle 
           JOIN seller ON bundle.seller_id = seller.id 
           WHERE bundle.id = ?`,
          [id]
        );

        if (result.length === 0) {
          toast.error("Lote no encontrado");
          navigate("/bundles");
          return;
        }

        const bundle = result[0];

        // 🔹 Cargar los datos en el formulario
        reset({
          number: bundle.number,
          name: bundle.name,
          observations: bundle.observations || "",
          seller: {
            value: bundle.seller_id,
            label: bundle.seller_company,
          },
        });
      } catch (error) {
        console.error("Error al cargar lote:", error);
        toast.error("Error al cargar lote");
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [db, id, navigate, reset]);


  const onSubmit = async (data: BundleFormData) => {
    if (!db || !id) return;
    try {
      await db.execute(
        "UPDATE bundle SET number = ?, name = ?, observations = ?, seller_id = ? WHERE id = ?",
        [data.number, data.name, data.observations, data.seller.value, id]
      );

      navigate("/bundles");
      toast.success("Lote actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar lote:", error);
      toast.error("Error al actualizar lote");
    }
  };
  return (
    <div
      className="p-6 mx-auto bg-white shadow-md"
      style={{ height: "calc(100vh - 60px)" }}
    >
      {loading ? (
        <p className="text-center text-gray-500">Cargando datos del lote...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <PersistingTopBar to="/bundles" isSubmitting={isSubmitting} />
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mt-4">
            <ControlledNumberField
              control={control}
              label={
                <>
                  Número de lote:<span className="text-red-600">*</span>
                </>
              }
              name="number"
            />
            <ControlledAsyncSearchSelectField
              control={control}
              name="seller"
              label="Vendedor"
              placeholder="Selecciona un vendedor"
              loadOptions={loadSellers}
            />
            <ControlledTextField
              control={control}
              label={
                <>
                  Nombre:<span className="text-red-600">*</span>
                </>
              }
              className="col-span-2"
              name="name"
            />
            <ControlledTextAreaField
              control={control}
              label={
                <>
                  Observaciones:<span className="text-red-600">*</span>
                </>
              }
              className="col-span-2"
              name="observations"
            />
          </div>
        </form>
      )}
      <Toaster />
    </div>
  );
};
