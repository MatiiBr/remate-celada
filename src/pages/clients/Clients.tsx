import { Link } from "react-router-dom";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { useCallback, useEffect, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
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

type Client = {
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

export const Clients = () => {
  const { db, loading } = useDatabase();
  const [clients, setClients] = useState<Client[]>([]);
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

  const loadClients = async (query: string, provinceFilter: string) => {
    if (!db) return;
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;

      const { params, paramsQuerySQL } = _filters(query, provinceFilter);

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) as count FROM client WHERE deleted = 0${paramsQuerySQL}`,
        params
      );
      const totalRecords = totalResult[0].count;
      setTotalPages(Math.ceil(totalRecords / PAGE_SIZE));

      const result: any[] = await db.select(
        `SELECT * FROM client WHERE deleted = 0${paramsQuerySQL} LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, offset]
      );

      setClients(result);
    } catch (error) {
      console.error("Error al obtener compradores:", error);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query, province) => {
      loadClients(query, province);
    }, 500),
    [db]
  );

  useEffect(() => {
    loadClients(searchTerm, selectedProvince);
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

  const handleDelete = async (clientId: number) => {
    const hasToDelete = await ask("El comprador va a ser eliminado.", {
      title: "Borrar comprador",
      kind: "warning",
    });

    if (hasToDelete) {
      await db?.execute("UPDATE client SET deleted = 1 WHERE id = $1", [
        clientId,
      ]);
    }
    loadClients(searchTerm, selectedProvince);
  };

  return (
    <ContentLayout>
      <TableTopBar
        name={"Compradores"}
        buttonLink={"/add-client"}
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
        ) : clients.length > 0 ? (
          <>
            <table className="table-auto w-full">
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
                {clients.map((client, index) => (
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
                          index + 1 === clients.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="text-black px-4 py-2">{client.company}</td>
                    <td className="text-black px-4 py-2">
                      {client.first_name}
                    </td>
                    <td className="text-black px-4 py-2">{client.last_name}</td>
                    <td className="text-black px-4 py-2">{client.email}</td>
                    <td className="text-black px-4 py-2">{client.phone}</td>
                    <td className="text-black px-4 py-2">{client.province}</td>
                    <td className="text-black px-4 py-2">{client.city}</td>
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === clients.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      <div className="flex gap-3 justify-center">
                        <Link
                          className="cursor-pointer"
                          to={`/edit-client/${client.id}`}
                        >
                          <PencilIcon className="size-6 text-red-700" />
                        </Link>
                        <button
                          className="cursor-pointer"
                          onClick={() => handleDelete(client.id)}
                        >
                          <TrashIcon className="size-6 text-red-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-3">
              <p className="block text-sm text-red-700 font-medium">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  className="rounded cursor-pointer border border-red-300 py-2.5 px-3 text-center text-xs font-semibold text-red-600 transition-all hover:opacity-75 focus:ring focus:ring-red-700 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <ChevronLeftIcon className="size-6" />
                </button>
                <button
                  className="rounded cursor-pointer border border-red-300 py-2.5 px-3 text-center text-xs font-semibold text-red-600 transition-all hover:opacity-75 focus:ring focus:ring-red-700 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  <ChevronRightIcon className="size-6" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-red-500 font-bold">
            No hay compradores registrados.
          </p>
        )}
      </div>
      <Toaster />
    </ContentLayout>
  );
};
