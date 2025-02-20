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
import { ControlledSelectField } from "../../components/ControlledSelectField";
import { PAGE_SIZE, provinces } from "../../helpers/Constants";
import { ask } from "@tauri-apps/plugin-dialog";
import { Toaster } from "react-hot-toast";
import { TableTopBar } from "../../components/TableTopBar";
import { ContentLayout } from "../../components/ContentLayout";
import { TablePagination } from "../../components/TablePagination";

export type Seller = {
  id: number;
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
};

const filterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  province: z.string(),
});
type FilterData = z.infer<typeof filterSchema>;

export const Sellers = () => {
  const { db, loading } = useDatabase();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "", province: "" },
  });
  const searchTerm = watch("name");
  const selectedProvince = watch("province");

  const _filters = (query: string, provinceFilter: string) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (query) {
      paramsQuerySQL +=
        " AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ?)";
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (provinceFilter) {
      paramsQuerySQL += " AND province = ?";
      params.push(provinceFilter);
    }
    return { params, paramsQuerySQL };
  };

  const loadSellers = async (query: string, provinceFilter: string) => {
    if (!db) return;
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;

      const { params, paramsQuerySQL } = _filters(query, provinceFilter);

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) as count FROM seller WHERE deleted = 0${paramsQuerySQL}`,
        params
      );
      const totalRecords = totalResult[0].count;
      setTotalPages(Math.ceil(totalRecords / PAGE_SIZE));

      const result: any[] = await db.select(
        `SELECT * FROM seller WHERE deleted = 0${paramsQuerySQL} LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, offset]
      );

      setSellers(result);
    } catch (error) {
      console.error("Error al obtener vendedores:", error);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query, province) => {
      loadSellers(query, province);
    }, 500),
    [db]
  );

  useEffect(() => {
    loadSellers(searchTerm, selectedProvince);
  }, [db, currentPage]);

  useEffect(() => {
    debouncedSearch(searchTerm, selectedProvince);
  }, [searchTerm, selectedProvince]);

  const handleIconClick = () => {
    resetField("name");
  };

  const handleClean = () => {
    resetField("name");
    resetField("province");
  };

  const handleDelete = async (sellerId: number) => {
    const hasToDelete = await ask("El vendedor va a ser eliminado.", {
      title: "Borrar vendedor",
      kind: "warning",
    });

    if (hasToDelete) {
      await db?.execute("UPDATE seller SET deleted = 1 WHERE id = $1", [
        sellerId,
      ]);
    }
    loadSellers(searchTerm, selectedProvince);
  };

  return (
    <ContentLayout>
      <TableTopBar
        name={"Vendedores"}
        buttonLink={"/add-seller"}
        buttonLabel={"Nuevo"}
      />
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledTextField
            control={control}
            label={""}
            placeholder="Busca por razón social, nombre o apellido"
            name="name"
            icon={<XMarkIcon className="size-6 text-red-700" />}
            onIconClick={handleIconClick}
            inputClassName="min-w-xs"
          />
          <ControlledSelectField
            control={control}
            name="province"
            options={provinces}
            placeholder="Selecciona una provincia"
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
        ) : sellers.length > 0 ? (
          <>
            <table className="table-auto w-full ">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 rounded-tl-md">ID</th>
                  <th className="text-white px-4 py-2 text-left">
                    Razón social
                  </th>
                  <th className="text-white px-4 py-2 text-left">Nombre</th>
                  <th className="text-white px-4 py-2 text-left">Apellido</th>
                  <th className="text-white px-4 py-2 text-left">Email</th>
                  <th className="text-white px-4 py-2 text-left">Teléfono</th>
                  <th className="text-white px-4 py-2 text-left">Provincia</th>
                  <th className="text-white px-4 py-2 text-left">Ciudad</th>
                  <th className="text-white px-4 py-2 rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller, index) => (
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
                          index + 1 === sellers.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="text-black px-4 py-2">{seller.company}</td>
                    <td className="text-black px-4 py-2">
                      {seller.first_name}
                    </td>
                    <td className="text-black px-4 py-2">{seller.last_name}</td>
                    <td className="text-black px-4 py-2">{seller.email}</td>
                    <td className="text-black px-4 py-2">{seller.phone}</td>
                    <td className="text-black px-4 py-2">{seller.province}</td>
                    <td className="text-black px-4 py-2">{seller.city}</td>
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === sellers.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      <div className="flex gap-3 justify-center">
                        <Link
                          className="cursor-pointer"
                          to={`/edit-seller/${seller.id}`}
                        >
                          <PencilIcon className="size-6 text-red-700" />
                        </Link>
                        <button
                          className="cursor-pointer"
                          onClick={() => handleDelete(seller.id)}
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
          <p className="text-red-500 font-bold">
            No hay vendedores registrados.
          </p>
        )}
      </div>
      <Toaster />
    </ContentLayout>
  );
};
