import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { useEffect, useState } from "react";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ContentLayout } from "../../components/ContentLayout";
import { provinces } from "../../helpers/Constants";
import { ControlledDateField } from "../../components/ControlledDateField";
import { ControlledSelectField } from "../../components/ControlledSelectField";

const auctionSchema = z.object({
  name: z
    .string({ required_error: "El nombre del remate es obligatorio" })
    .nonempty({ message: "El nombre del remate es obligatorio" })
    .min(3, "El nombre del remate debe tener al menos 3 caracteres"),
  province: z.string({ required_error: "La provincia es obligatoria" }),
  city: z
    .string({ required_error: "La ciudad es obligatoria" })
    .min(3, "La ciudad debe tener al menos 3 caracteres"),
  date: z.string({ required_error: "La fecha es obligatoria" }),
});

type AuctionFormData = z.infer<typeof auctionSchema>;

export const EditAuction = () => {
  const { db } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
  });

  useEffect(() => {
    const fetchAuction = async () => {
      if (!db || !id) return;
      try {
        const result: any[] = await db.select(
          "SELECT * FROM auction WHERE id = ?",
          [id]
        );
        if (result.length === 0) {
          toast.error("Remate no encontrado");
          navigate("/auctions");
          return;
        }
        const client = result[0];
        reset({
          name: client.name || "",
          date: client.date || "",
          province: client.province || "",
          city: client.city || "",
        });
      } catch (error) {
        toast.error("Error al cargar Reamte");
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [db, id, navigate, reset]);

  const onSubmit = async (data: AuctionFormData) => {
    if (!db || !id) return;
    try {
      await db.execute(
        "UPDATE auction SET name = ?, date = ?, province = ?, city = ? WHERE id = ?;",
        [data.name, data.date, data.province, data.city, id]
      );
      navigate("/auctios");
      toast.success("Remate actualizado correctamente", {
        id: "success-edit",
      });
    } catch (error) {
      console.error("Error al actualizar remate:", error);
      toast.error("Error al actualizar remate");
    }
  };

  return (
    <ContentLayout>
      {loading ? (
        <p className="text-center text-gray-500">
          Cargando datos del remate...
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <PersistingTopBar to="/auctions" isSubmitting={isSubmitting} />
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mt-4">
            <ControlledTextField
              control={control}
              label={
                <>
                  Nombre:<span className="text-red-600">*</span>
                </>
              }
              name="name"
            />
            <ControlledDateField
              control={control}
              label={
                <>
                  Fecha:<span className="text-red-600">*</span>
                </>
              }
              name="date"
            />
            <ControlledSelectField
              label={
                <>
                  Provincia:<span className="text-red-600">*</span>
                </>
              }
              name="province"
              control={control}
              placeholder="Selecciona una provincia"
              options={provinces}
            />
            <ControlledTextField
              control={control}
              label={
                <>
                  Ciudad:<span className="text-red-600">*</span>
                </>
              }
              name="city"
            />
          </div>
        </form>
      )}
      <Toaster />
    </ContentLayout>
  );
};
