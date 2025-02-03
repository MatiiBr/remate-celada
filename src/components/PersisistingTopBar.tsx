import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

interface Props {
  isSubmitting: boolean;
  to: string;
}
export const PersistingTopBar = ({ isSubmitting, to }: Props) => {
  return (
    <div className="flex justify-between items-center">
      <Link to={to}>
        <ArrowLeftIcon className="size-6 text-red-700" />
      </Link>
      <button
        className="px-3 py-2 bg-red-700 text-white font-semibold rounded cursor-pointer"
        type="submit"
      >
        {isSubmitting ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
};
