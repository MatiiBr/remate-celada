import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { provinces } from "../../helpers/Constants";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { ControlledPhoneField } from "../../components/ControlledPhoneField";
import { ControlledSelectField } from "../../components/ControlledSelectField";
import { useEffect, useState } from "react";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ContentLayout } from "../../components/ContentLayout";

const clientSchema = z.object({
  company: z
    .string({ required_error: "El nombre de la empresa es obligatorio" })
    .nonempty({ message: "El nombre de la empresa es obligatorio" })
    .min(3, "El nombre de la empresa debe tener al menos 3 caracteres"),
  firstName: z.optional(z.string()),
  lastName: z.optional(z.string()),
  email: z
    .optional(z.string().email("Ingrese un correo válido"))
    .or(z.literal("")),
  phone: z
    .optional(z.string().min(9, "Ingrese un número de teléfono válido"))
    .or(z.literal("")),
  province: z.string({ required_error: "La provincia es obligatoria" }),
  city: z
    .string({ required_error: "La ciudad es obligatoria" })
    .min(3, "La ciudad debe tener al menos 3 caracteres"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const EditClient = () => {
  const { db } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    const fetchSeller = async () => {
      if (!db || !id) return;
      try {
        const result: any[] = await db.select(
          "SELECT * FROM client WHERE id = ?",
          [id]
        );
        if (result.length === 0) {
          toast.error("Comprador no encontrado");
          navigate("/clients");
          return;
        }
        const client = result[0];
        reset({
          company: client.company || "",
          firstName: client.first_name || "",
          lastName: client.last_name || "",
          email: client.email || "",
          phone: client.phone || "",
          province: client.province || "",
          city: client.city || "",
        });
      } catch (error) {
        console.error("Error al cargar comprador:", error);
        toast.error("Error al cargar comprador");
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [db, id, navigate, reset]);

  const onSubmit = async (data: ClientFormData) => {
    if (!db || !id) return;
    try {
      await db.execute(
        "UPDATE client SET company = ?, first_name = ?, last_name = ?, email = ?, phone = ?, province = ?, city = ? WHERE id = ?;",
        [
          data.company,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.province,
          data.city,
          id,
        ]
      );
      navigate("/clients");
      toast.success("Comprador actualizado correctamente", {
        id: "success-edit",
      });
    } catch (error) {
      console.error("Error al actualizar comprador:", error);
      toast.error("Error al actualizar comprador");
    }
  };

  return (
    <ContentLayout>
      {loading ? (
        <p className="text-center text-gray-500">
          Cargando datos del comprador...
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <PersistingTopBar to="/clients" isSubmitting={isSubmitting} />
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mt-4">
            <ControlledTextField
              className="col-span-2"
              control={control}
              label={
                <>
                  Razón social:<span className="text-red-600">*</span>
                </>
              }
              name="company"
            />
            <ControlledTextField
              control={control}
              label={"Nombre:"}
              name="firstName"
            />
            <ControlledTextField
              control={control}
              label={"Apellido:"}
              name="lastName"
            />
            <ControlledTextField
              control={control}
              label={"Email:"}
              name="email"
              type="email"
            />
            <ControlledPhoneField
              control={control}
              label={"Teléfono:"}
              name="phone"
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
