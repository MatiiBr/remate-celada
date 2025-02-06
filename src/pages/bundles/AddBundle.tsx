import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { AsyncOption } from "../../components/ControlledAsyncSearchSelectField";
import { ControlledTextAreaField } from "../../components/ControlledTextAreaField";
import { ControlledAsyncSearchSelectField } from "../../components/ControlledAsyncSearchSelectField";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ControlledNumberField } from "../../components/ControlledNumberField";
import { ContentLayout } from "../../components/ContentLayout";

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
  auction: z.object({
    value: z.number(),
    label: z.string(),
  }),
});

type BundleFormData = z.infer<typeof bundleSchema>;

export const AddBundle = () => {
  const { db } = useDatabase();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema),
  });

  const loadSellers = async (
    inputValue: string = ""
  ): Promise<AsyncOption[]> => {
    if (!db) return [];
    try {
      const result: any[] = await db.select(
        "SELECT id, company FROM seller WHERE company LIKE ? ",
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

  const loadAuctions = async (
    inputValue: string = ""
  ): Promise<AsyncOption[]> => {
    if (!db) return [];
    try {
      const result: any[] = await db.select(
        "SELECT id, name FROM auction WHERE name LIKE ? ",
        [`%${inputValue}%`]
      );

      return result.map((auction) => ({
        value: auction.id,
        label: auction.name,
      }));
    } catch (error) {
      console.error("Error al obtener remates:", error);
      return [];
    }
  };

  const onSubmit = async (data: BundleFormData) => {
    if (!db) return;
    try {
      console.log("DATA", data);
      await db.execute(
        "INSERT INTO bundle (number, name, observations, seller_id, auction_id) VALUES (?1, ?2, ?3, ?4, ?5);",
        [
          data.number,
          data.name,
          data.observations,
          data.seller.value,
          data.auction.value,
        ]
      );

      reset({
        number: data.number + 1,
        seller: data.seller,
        auction: data.auction,
        name: "",
        observations: "",
      });

      toast.success("Lote creado correctamente", {
        duration: 3000,
        position: "bottom-center",
        style: {
          fontWeight: "600",
        },
      });
    } catch (error) {
      console.error("Error al agregar lote:", error);
      toast.error("Error al agregar lote");
    }
  };
  return (
    <ContentLayout>
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log(errors))}>
        <PersistingTopBar to="/bundles" isSubmitting={isSubmitting} />
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mt-4">
          <ControlledAsyncSearchSelectField
            className="col-span-2"
            control={control}
            name="auction"
            label={
              <>
                Remate:<span className="text-red-600">*</span>
              </>
            }
            placeholder="Selecciona un remate"
            loadOptions={loadAuctions}
          />
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
      <Toaster />
    </ContentLayout>
  );
};
