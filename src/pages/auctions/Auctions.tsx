import {
  ArrowUturnLeftIcon,
  DocumentTextIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlayPauseIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ContentLayout } from "../../components/ContentLayout";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { TableTopBar } from "../../components/TableTopBar";
import { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "debounce";
import { format, isAfter, isToday, parseISO } from "date-fns";
import {
  AUCTION_STATUSES,
  AuctionStatus,
  auctionStatusBadgeClasses,
} from "../../helpers/auctionConstants";
import {
  handleDelete,
  handleCancel,
  handlePause,
  handleResume,
  handleRestore,
  handleInit,
} from "../../helpers/auctionActions";
import { es } from "date-fns/locale";
import { ControlledTextField } from "../../components/ControlledTextField";
import { PAGE_SIZE, provinces } from "../../helpers/Constants";
import { ControlledSelectField } from "../../components/ControlledSelectField";
import { TablePagination } from "../../components/TablePagination";

export type Auction = {
  id: number;
  name: string;
  province: string;
  city: string;
  date: string;
  status: AuctionStatus;
};

const filterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  province: z.string(),
  status: z.string(),
});
type FilterData = z.infer<typeof filterSchema>;

export const Auctions = () => {
  const { db, loading } = useDatabase();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "", province: "" },
  });
  const searchTerm = watch("name");
  const selectedProvince = watch("province");
  const selectedStatus = watch("status");

  const _filters = (query: string, provinceFilter: string, status: string) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (query) {
      paramsQuerySQL += " AND name LIKE ?";
      params.push(`%${query}%`);
    }

    if (provinceFilter) {
      paramsQuerySQL += " AND province = ?";
      params.push(provinceFilter);
    }

    if (status) {
      paramsQuerySQL += " AND status = ?";
      params.push(status);
    }
    return { params, paramsQuerySQL };
  };

  const loadAuctions = async (
    query: string,
    provinceFilter: string,
    status: string
  ) => {
    if (!db) return;
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;

      const { params, paramsQuerySQL } = _filters(
        query,
        provinceFilter,
        status
      );

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) as count FROM auction WHERE deleted = 0${paramsQuerySQL}`,
        params
      );
      const totalRecords = totalResult[0].count;
      setTotalPages(Math.ceil(totalRecords / PAGE_SIZE));

      const result: any[] = await db.select(
        `SELECT * FROM auction WHERE deleted = 0${paramsQuerySQL} LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, offset]
      );

      setAuctions(result);
    } catch (error) {
      console.error("Error al obtener remates:", error);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query, province, selectedStatus) => {
      loadAuctions(query, province, selectedStatus);
    }, 500),
    [db]
  );

  useEffect(() => {
    loadAuctions(searchTerm, selectedProvince, selectedStatus);
  }, [db, currentPage]);

  useEffect(() => {
    debouncedSearch(searchTerm, selectedProvince, selectedStatus);
  }, [searchTerm, selectedProvince, selectedStatus]);

  const handleIconClick = () => {
    resetField("name");
  };

  const handleClean = () => {
    resetField("name");
  };

  return (
    <ContentLayout>
      <TableTopBar
        name={"Remates"}
        buttonLink={"/add-auction"}
        buttonLabel={"Nuevo"}
      />
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledTextField
            control={control}
            label={""}
            placeholder="Busca por nombre"
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
          <ControlledSelectField
            control={control}
            name="status"
            options={Object.values(AUCTION_STATUSES)}
            placeholder="Selecciona un estado"
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
        ) : auctions.length > 0 ? (
          <>
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 rounded-tl-md">ID</th>
                  <th className="text-white px-4 py-2 text-left">Nombre</th>
                  <th className="text-white px-4 py-2 text-left">Provincia</th>
                  <th className="text-white px-4 py-2 text-left">Ciudad</th>
                  <th className="text-white px-4 py-2 text-left">Fecha</th>
                  <th className="text-white px-4 py-2 text-left">Estado</th>
                  <th className="text-white px-4 py-2 rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction, index) => (
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
                          index + 1 === auctions.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="text-black px-4 py-2">{auction.name}</td>
                    <td className="text-black px-4 py-2">{auction.province}</td>
                    <td className="text-black px-4 py-2">{auction.city}</td>
                    <td className="text-black px-4 py-2">
                      {format(parseISO(auction.date), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </td>
                    <td className="text-black px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          auctionStatusBadgeClasses[auction.status]
                        }`}
                      >
                        {auction.status}
                      </span>
                    </td>
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === auctions.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      <div className="flex gap-3 justify-center">
                        {auction.status === AUCTION_STATUSES.EN_CURSO && (
                          <button
                            className="cursor-pointer"
                            title="Pausar"
                            onClick={() =>
                              handlePause(
                                db,
                                auction.id,
                                loadAuctions,
                                searchTerm,
                                selectedProvince,
                                selectedStatus
                              )
                            }
                          >
                            <PauseIcon className="size-6 text-red-700" />
                          </button>
                        )}
                        {auction.status === AUCTION_STATUSES.PAUSADO && (
                          <button
                            className="cursor-pointer"
                            title="Reaundar"
                            onClick={() =>
                              handleResume(
                                db,
                                auction.id,
                                loadAuctions,
                                searchTerm,
                                selectedProvince,
                                selectedStatus
                              )
                            }
                          >
                            <PlayPauseIcon className="size-6 text-red-700" />
                          </button>
                        )}
                        {auction.status === AUCTION_STATUSES.CANCELADO &&
                          (isAfter(
                            auction.date,
                            new Date().toISOString().split("T")[0]
                          ) ||
                            isToday(parseISO(auction.date))) && (
                            <button
                              className="cursor-pointer"
                              title="Restaurar"
                              onClick={() =>
                                handleRestore(
                                  db,
                                  auction.id,
                                  loadAuctions,
                                  searchTerm,
                                  selectedProvince,
                                  selectedStatus
                                )
                              }
                            >
                              <ArrowUturnLeftIcon className="size-6 text-red-700" />
                            </button>
                          )}
                        {auction.status === AUCTION_STATUSES.PENDIENTE &&
                          isToday(parseISO(auction.date)) && (
                            <button
                              className="cursor-pointer"
                              title="Comenzar"
                              onClick={() =>
                                handleInit(
                                  db,
                                  auction.id,
                                  loadAuctions,
                                  searchTerm,
                                  selectedProvince,
                                  selectedStatus
                                )
                              }
                            >
                              <PlayIcon className="size-6 text-red-700" />
                            </button>
                          )}
                        <Link
                          title="Ver Lotes"
                          className="cursor-pointer"
                          to={`/auction-bundles/${auction.id}`}
                        >
                          <DocumentTextIcon className="size-6 text-red-700" />
                        </Link>
                        {auction.status === AUCTION_STATUSES.PENDIENTE && (
                          <Link
                            title="Editar"
                            className="cursor-pointer"
                            to={`/edit-auction/${auction.id}`}
                          >
                            <PencilIcon className="size-6 text-red-700" />
                          </Link>
                        )}
                        {auction.status === AUCTION_STATUSES.PENDIENTE &&
                          (isAfter(
                            auction.date,
                            new Date().toISOString().split("T")[0]
                          ) ||
                            isToday(parseISO(auction.date))) && (
                            <button
                              className="cursor-pointer"
                              title="Cancelar"
                              onClick={() =>
                                handleCancel(
                                  db,
                                  auction.id,
                                  loadAuctions,
                                  searchTerm,
                                  selectedProvince,
                                  selectedStatus
                                )
                              }
                            >
                              <XMarkIcon className="size-6 text-red-700" />
                            </button>
                          )}
                        {auction.status === AUCTION_STATUSES.CANCELADO && (
                          <button
                            className="cursor-pointer"
                            title="Eliminar"
                            onClick={() =>
                              handleDelete(
                                db,
                                auction.id,
                                loadAuctions,
                                searchTerm,
                                selectedProvince,
                                selectedStatus
                              )
                            }
                          >
                            <TrashIcon className="size-6 text-red-700" />
                          </button>
                        )}
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
          <p className="text-red-500 font-bold">No hay remates registrados.</p>
        )}
      </div>
      <Toaster />
    </ContentLayout>
  );
};
