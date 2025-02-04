import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface Props {
  currentPage: number;
  totalPages: number;
  prevPage: () => void;
  nextPage: () => void;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  prevPage,
  nextPage,
}: Props) => {
  return (
    <div className="flex items-center justify-between p-3">
      <p className="block text-sm text-red-700 font-medium">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          className="rounded cursor-pointer border border-red-300 py-2.5 px-3 text-center text-xs font-semibold text-red-600 transition-all hover:opacity-75 focus:ring focus:ring-red-700 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
          disabled={currentPage === 1}
          onClick={prevPage}
        >
          <ChevronLeftIcon className="size-6" />
        </button>
        <button
          className="rounded cursor-pointer border border-red-300 py-2.5 px-3 text-center text-xs font-semibold text-red-600 transition-all hover:opacity-75 focus:ring focus:ring-red-700 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
          disabled={currentPage === totalPages}
          onClick={nextPage}
        >
          <ChevronRightIcon className="size-6" />
        </button>
      </div>
    </div>
  );
};
