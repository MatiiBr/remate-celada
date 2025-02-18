import { Link } from "react-router-dom";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { useCallback, useEffect, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ControlledTextField } from "../../components/ControlledTextField";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "debounce";
import { ask } from "@tauri-apps/plugin-dialog";
import { Toaster } from "react-hot-toast";
import { TableTopBar } from "../../components/TableTopBar";
import { ContentLayout } from "../../components/ContentLayout";
import { PAGE_SIZE } from "../../helpers/Constants";
import {
  AsyncOption,
  ControlledAsyncSearchSelectField,
} from "../../components/ControlledAsyncSearchSelectField";
import { TablePagination } from "../../components/TablePagination";

export type Bundle = {
  id: number;
  number: number;
  name: string;
  observations: string;
  seller_company: string;
  auction_name: string;
};

const filterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  auction: z.object({
    value: z.number(),
    label: z.string(),
  }),
});
type FilterData = z.infer<typeof filterSchema>;

export const Bundles = () => {
  const { db, loading } = useDatabase();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "" },
  });
  const searchTerm = watch("name");
  const auctionField = watch("auction");

  const _filters = (query: string, auctionField: AsyncOption) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (query) {
      paramsQuerySQL += " AND (bundle.name LIKE ? OR bundle.number LIKE ?)";
      params.push(`%${query}%`, `%${query}%`);
    }

    if (auctionField) {
      paramsQuerySQL += " AND bundle.auction_id = ?";
      params.push(auctionField.value);
    }

    return { params, paramsQuerySQL };
  };

  const loadBundles = async (query: string, auctionField: AsyncOption) => {
    if (!db) return;
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;

      const { params, paramsQuerySQL } = _filters(query, auctionField);

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) as count FROM bundle WHERE deleted = 0${paramsQuerySQL}`,
        params
      );
      const totalRecords = totalResult[0].count;
      setTotalPages(Math.ceil(totalRecords / PAGE_SIZE));

      const result: any[] = await db.select(
        `SELECT 
          bundle.*, 
          client.company AS seller_company,
          auction.name AS auction_name
        FROM bundle
        JOIN client ON bundle.seller_id = client.id
        JOIN auction ON bundle.auction_id = auction.id
        WHERE bundle.deleted = 0${paramsQuerySQL}
        LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, offset]
      );

      setBundles(result);
    } catch (error) {
      console.error("Error al obtener lotes:", error);
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

  const debouncedSearch = useCallback(
    debounce((query, auctionField) => {
      loadBundles(query, auctionField);
    }, 500),
    [db]
  );

  useEffect(() => {
    loadBundles(searchTerm, auctionField);
  }, [db, currentPage]);

  useEffect(() => {
    debouncedSearch(searchTerm, auctionField);
  }, [searchTerm, auctionField]);

  const handleIconClick = () => {
    resetField("name");
  };

  const handleClean = () => {
    resetField("name");
  };

  const handleDelete = async (clientId: number) => {
    const hasToDelete = await ask("El lote va a ser eliminado.", {
      title: "Borrar lote",
      kind: "warning",
    });

    if (hasToDelete) {
      await db?.execute("UPDATE bundle SET deleted = 1 WHERE id = $1", [
        clientId,
      ]);
    }
    loadBundles(searchTerm, auctionField);
  };

  return (
    <ContentLayout>
      <TableTopBar
        name={"Lotes"}
        buttonLink={"/add-bundle"}
        buttonLabel={"Nuevo"}
      />
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledTextField
            control={control}
            label={""}
            placeholder="Busca por número de lote o nombre"
            name="name"
            icon={<XMarkIcon className="size-6 text-red-700" />}
            onIconClick={handleIconClick}
            inputClassName="min-w-xs"
          />
          <ControlledAsyncSearchSelectField
            className="col-span-2"
            control={control}
            name="auction"
            placeholder="Selecciona un remate"
            loadOptions={loadAuctions}
          />
          <button
            onClick={handleClean}
            className="py-2 px-3 ml-auto border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded"
          >
            Limpiar
          </button>
        </form>
      </div>
      <div className="p-6">
        {loading ? (
          <p>Cargando...</p>
        ) : bundles.length > 0 ? (
          <>
            <table className="table-auto w-full ">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 rounded-tl-md">ID</th>
                  <th className="text-white px-4 py-2 text-left">
                    Nro. de Lote
                  </th>
                  <th className="text-white px-4 py-2 text-left">Remate</th>
                  <th className="text-white px-4 py-2 text-left">Nombre</th>
                  <th className="text-white px-4 py-2 text-left">
                    Observación
                  </th>
                  <th className="text-white px-4 py-2 text-left">Vendedor</th>
                  <th className="text-white px-4 py-2 rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0
                        ? "bg-red-100 hover:bg-red-300"
                        : "bg-red-200 hover:bg-red-300"
                    }`}
                  >
                    <td
                      className={`text-black px-4 py-2 text-center ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="text-black px-4 py-2">{bundle.number}</td>
                    <td className="text-black px-4 py-2">
                      {bundle.auction_name}
                    </td>
                    <td className="text-black px-4 py-2">{bundle.name}</td>
                    <td className="text-black px-4 py-2">
                      {bundle.observations}
                    </td>
                    <td className="text-black px-4 py-2">
                      {bundle.seller_company}
                    </td>
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      <div className="flex gap-3 justify-center">
                        <Link
                          className="cursor-pointer"
                          to={`/edit-bundle/${bundle.id}`}
                        >
                          <PencilIcon className="size-6 text-red-700" />
                        </Link>
                        <button
                          className="cursor-pointer"
                          onClick={() => handleDelete(bundle.id)}
                        >
                          <TrashIcon className="size-6 text-red-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              prevPage={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              nextPage={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            />
          </>
        ) : (
          <p className="text-red-500 font-bold">No hay lotes registrados.</p>
        )}
      </div>
      <Toaster />
    </ContentLayout>
  );
};
