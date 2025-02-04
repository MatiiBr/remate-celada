import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { provinces } from "../../helpers/Constants";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { ControlledPhoneField } from "../../components/ControlledPhoneField";
import { ControlledSelectField } from "../../components/ControlledSelectField";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ContentLayout } from "../../components/ContentLayout";

const sellerSchema = z.object({
  company: z
    .string({ required_error: "El nombre de la empresa es obligatorio" })
    .nonempty({ message: "El nombre de la empresa es obligatorio" })
    .min(3, "El nombre de la empresa debe tener al menos 3 caracteres"),
  firstName: z.optional(z.string()),
  lastName: z.optional(z.string()),
  email: z.optional(z.string().email("Ingrese un correo válido")),
  phone: z.optional(z.string().min(9, "Ingrese un número de teléfono válido").or(z.literal(""))),
  province: z.string({ required_error: "La provincia es obligatoria" }),
  city: z
    .string({ required_error: "La ciudad es obligatoria" })
    .min(3, "La ciudad debe tener al menos 3 caracteres"),
});

type SellerFormData = z.infer<typeof sellerSchema>;

export const AddSeller = () => {
  const { db } = useDatabase();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
  });

  const onSubmit = async (data: SellerFormData) => {
    if (!db) return;
    try {
      await db.execute(
        "INSERT INTO seller (company, first_name, last_name, email, phone, province, city) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);",
        [
          data.company,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.province,
          data.city,
        ]
      );
      reset({
        company: "",
        firstName: "",
        lastName: "",
        email: undefined,
        phone: "",
        province: "",
        city: "",
      });
      toast.success("Vendedor creado", {
        duration: 3000,
        position: "bottom-center",
        style: {
          fontWeight: "600",
        },
      });
    } catch (error) {
      console.error("Error al agregar cliente:", error);
    }
  };

  return (
    <ContentLayout>
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log(errors))}>
        <PersistingTopBar to="/sellers" isSubmitting={isSubmitting}/>
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
      <Toaster />
    </ContentLayout>
  );
};
