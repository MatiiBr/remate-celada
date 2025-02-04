import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { provinces } from "../../helpers/Constants";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import toast, { Toaster } from "react-hot-toast";
import { ControlledTextField } from "../../components/ControlledTextField";
import { ControlledSelectField } from "../../components/ControlledSelectField";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { ContentLayout } from "../../components/ContentLayout";
import { ControlledDateField } from "../../components/ControlledDateField";
import { useNavigate } from "react-router-dom";
import { AUCTION_STATUSES } from "../../helpers/auctionConstants";

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

export const AddAuction = () => {
  const { db } = useDatabase();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
  });

  const onSubmit = async (data: AuctionFormData) => {
    if (!db) return;
    try {
      await db.execute(
        "INSERT INTO auction (name, province, city, date, status) VALUES (?1, ?2, ?3, ?4, ?5);",
        [
          data.name,
          data.province,
          data.city,
          data.date,
          AUCTION_STATUSES.PENDIENTE,
        ]
      );

      toast.success("Remate creado", {
        duration: 3000,
        position: "bottom-center",
        style: {
          fontWeight: "600",
        },
      });
      navigate("/auctions")
    } catch (error) {
      console.error("Error al agregar remate:", error);
    }
  };

  return (
    <ContentLayout>
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log(errors))}>
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
      <Toaster />
    </ContentLayout>
  );
};
