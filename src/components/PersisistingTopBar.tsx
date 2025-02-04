import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  isSubmitting?: boolean;
  withoutSubmitButton?: boolean;
  children?: ReactNode;
  to: string;
}
export const PersistingTopBar = ({
  isSubmitting,
  to,
  children,
  withoutSubmitButton = false,
}: Props) => {
  return (
    <div className="p-6 flex justify-between items-center">
      <Link to={to}>
        <ArrowLeftIcon className="size-6 text-red-700" />
      </Link>
      {children}
      {!withoutSubmitButton && (
        <button
          className="px-3 py-2 bg-red-700 text-white font-semibold rounded cursor-pointer"
          type="submit"
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
      )}
    </div>
  );
};
