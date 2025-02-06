import { useNavigate, useParams } from "react-router-dom";
import { ContentLayout } from "../../components/ContentLayout";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Auction } from "../auctions/Auctions";
import {
  AuctionStatus,
  auctionStatusBadgeClasses,
} from "../../helpers/auctionConstants";
import {
  ControlledSearchSelectField,
  Option,
} from "../../components/ControlledSearchSelectField";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CloudArrowUpIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ControlledPriceField } from "../../components/ControlledPriceField";
import { TablePagination } from "../../components/TablePagination";
import { ControlledTextField } from "../../components/ControlledTextField";
import debounce from "debounce";

const salesSchema = z.object({
  bundles: z.array(
    z.object({
      client: z
        .object({
          value: z.number(),
          label: z.string(),
        })
        .optional(),
      price: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
    })
  ),
});

const filterSchema = z.object({
  name: z.string().min(3),
  client: z.object({
    value: z.number(),
    label: z.string(),
  }),
});

type FilterData = z.infer<typeof filterSchema>;
type SalesFormData = z.infer<typeof salesSchema>;

export const Sales = () => {
  const { db } = useDatabase();
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState<Auction>();
  const [bundles, setBundles] = useState<any[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 12;

  const { control: saleControl, getValues, setValue } = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema),
    defaultValues: { bundles: [] },
  });

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "" },
  });

  const searchTerm = watch("name");
  const selectedClient = watch("client");

  const _filters = (query: string) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (query) {
      paramsQuerySQL += " AND (b.name LIKE ? OR b.number LIKE ?)";
      params.push(`%${query}%`, `%${query}%`);
    }

    if (selectedClient) {
      paramsQuerySQL += " AND c.id = ?";
      params.push(selectedClient.value);
    }

    return { params, paramsQuerySQL };
  };

  const loadFilters = async () => {
    if (!db || !auctionId) return;

    try {
      const clientsResult: any[] = await db.select(
        `SELECT id, company FROM client`
      );
      setClients(clientsResult.map((c) => ({ value: c.id, label: c.company })));
    } catch (error) {
      console.error("Error al cargar filtros de vendedores:", error);
    }
  };

  const fetchBundles = async (query: string) => {
    if (!db || !auctionId) return;

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const { params, paramsQuerySQL } = _filters(query);
      console.log("PARAMS", paramsQuerySQL);
      const auctionResult: any[] = await db.select(
        "SELECT name, status FROM auction WHERE id = ?",
        [auctionId]
      );
      setAuction(auctionResult[0]);

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) AS count 
         FROM bundle b
         LEFT JOIN sales s ON s.bundle_id = b.id AND s.auction_id = ?
         LEFT JOIN client c ON s.client_id = c.id
         WHERE b.auction_id = ? ${paramsQuerySQL}`,
        [auctionId, auctionId, ...params]
      );
      setTotalPages(Math.ceil(totalResult[0].count / PAGE_SIZE));

      const bundlesResult: any[] = await db.select(
        `SELECT 
          b.id, b.number, b.name, 
          s.sold_price, s.client_id, c.company AS client_name, 
          se.company AS seller_company
         FROM bundle b
         JOIN seller se ON b.seller_id = se.id
         LEFT JOIN sales s ON s.bundle_id = b.id AND s.auction_id = ?
         LEFT JOIN client c ON s.client_id = c.id
         WHERE b.auction_id = ? ${paramsQuerySQL}
         ORDER BY b.number ASC
         LIMIT ? OFFSET ?`,
        [auctionId, auctionId, ...params, PAGE_SIZE, offset]
      );

      setBundles(bundlesResult);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
      toast.error("Error al cargar lotes");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => {
      fetchBundles(query);
    }, 500),
    [db]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    loadFilters();
    fetchBundles(searchTerm);
  }, [db, auctionId, navigate, currentPage, selectedClient]);

  const handleSaveSale = async (bundleIndex: number, bundleId: number) => {
    if (!db) return;

    const client = getValues(`bundles.${bundleIndex}.client`);
    const price = getValues(`bundles.${bundleIndex}.price`);

    if (!client || !price) {
      toast.error("Debe seleccionar un comprador y un precio", {
        position: "top-center",
      });
      return;
    }

    try {
      await db.execute(
        `INSERT INTO sales (bundle_id, auction_id, client_id, sold_price, sold) 
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(bundle_id, auction_id) DO UPDATE SET client_id = ?, sold_price = ?`,
        [bundleId, auctionId, client.value, price, client.value, price]
      );

      toast.success("Venta guardada correctamente");
      setEditMode((prev) => ({ ...prev, [bundleId]: false }));
      fetchBundles(searchTerm);
    } catch (error) {
      console.error("Error al guardar venta:", error);
      toast.error("Error al guardar venta");
    }
  };

  const handleIconClick = () => {
    resetField("name");
  };

  const handleClean = () => {
    resetField("name");
  };

  const handleEnableEdition = (bundleId: number, bundleIndex: number) => {
    setEditMode((prev) => ({ ...prev, [bundleId]: true }));
    const existingClient = bundles[bundleIndex]?.client_id
      ? {
          value: bundles[bundleIndex]?.client_id,
          label: bundles[bundleIndex]?.client_name,
        }
      : undefined;

    console.log("EX", existingClient);

    setValue(`bundles.${bundleIndex}.client`, existingClient);
    setValue(`bundles.${bundleIndex}.price`, bundles[bundleIndex]?.sold_price || "");
  };

  const handleCancelEdition = (bundleId: number) => {
    setEditMode((prev) => ({ ...prev, [bundleId]: false }));
  };

  return (
    <ContentLayout>
      <PersistingTopBar to={`/auction-bundles/${auctionId}`}>
        <p>
          Ventas del Remate:{" "}
          <span className="text-red-500 font-semibold">{auction?.name}</span> -{" "}
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              auctionStatusBadgeClasses[auction?.status as AuctionStatus]
            }`}
          >
            {auction?.status}
          </span>
        </p>
      </PersistingTopBar>
      <div className="flex p-6 justify-between items-center">
        <form className="flex gap-5 w-full">
          <ControlledTextField
            control={control}
            placeholder="Busca por número de lote o nombre"
            name="name"
            icon={<XMarkIcon className="size-6 text-red-700" />}
            onIconClick={handleIconClick}
            inputClassName="min-w-xs"
          />
          <ControlledSearchSelectField
            control={control}
            name="client"
            options={clients!}
            placeholder="Seleccionar comprador"
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
          <p className="text-gray-500">Cargando lotes...</p>
        ) : bundles.length > 0 ? (
          <form>
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 rounded-tl-md">Lote</th>
                  <th className="text-white px-4 py-2 text-left">Nombre</th>
                  <th className="text-white px-4 py-2 text-left">Vendedor</th>
                  <th className="text-white px-4 py-2 text-left">Comprador</th>
                  <th className="text-white px-4 py-2 text-left">Precio</th>
                  <th className="text-white px-4 py-2 text-left w-min rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle, index) => (
                  <tr key={bundle.id} className="bg-red-100 hover:bg-red-200">
                    <td
                      className={`text-black px-4 py-2 text-center ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {bundle.number}
                    </td>
                    <td className="px-4 py-2">{bundle.name}</td>
                    <td className="px-4 py-2">{bundle.seller_company}</td>
                    <td className="px-4 py-2">
                      {bundle.client_name &&
                        !editMode[bundle.id] &&
                        bundle.client_name}
                      {!bundle.client_name && !editMode[bundle.id] && (
                        <ControlledSearchSelectField
                          control={saleControl}
                          name={`bundles.${index}.client`}
                          options={clients}
                          placeholder="Seleccionar comprador"
                        />
                      )}
                      {bundle.client_name && editMode[bundle.id] && (
                        <ControlledSearchSelectField
                          control={saleControl}
                          name={`bundles.${index}.client`}
                          options={clients}
                          placeholder="Seleccionar comprador"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {bundle.sold_price &&
                        !editMode[bundle.id] &&
                        `$${bundle.sold_price.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                      {!bundle.sold_price && !editMode[bundle.id] && (
                        <ControlledPriceField
                          name={`bundles.${index}.price`}
                          control={saleControl}
                        />
                      )}
                      {bundle.sold_price && editMode[bundle.id] && (
                        <ControlledPriceField
                          name={`bundles.${index}.price`}
                          control={saleControl}
                        />
                      )}
                    </td>
                    <td
                      className={`text-black w-min whitespace-nowrap px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      {!editMode[bundle.id] && !bundle.sold_price && (
                        <button
                          type="button"
                          onClick={() => handleSaveSale(index, bundle.id)}
                          className="px-4 py-2 border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded *:text-red-700 hover:*:text-white"
                        >
                          <CloudArrowUpIcon className="size-6" />
                        </button>
                      )}
                      {!editMode[bundle.id] && bundle.sold_price && (
                        <button
                          type="button"
                          onClick={() => handleEnableEdition(bundle.id, index)}
                          className="px-4 py-2 border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded *:text-red-700 hover:*:text-white"
                        >
                          <PencilIcon className="size-6" />
                        </button>
                      )}
                      {editMode[bundle.id] && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveSale(index, bundle.id)}
                            className="px-4 py-2 mr-2 border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded *:text-red-700 hover:*:text-white"
                          >
                            <CloudArrowUpIcon className="size-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelEdition(bundle.id)}
                            className="px-4 py-2 border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded *:text-red-700 hover:*:text-white"
                          >
                            <XMarkIcon className="size-6" />
                          </button>
                        </>
                      )}
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
          </form>
        ) : (
          <p className="text-red-500">No hay lotes asignados a este remate.</p>
        )}
      </div>
    </ContentLayout>
  );
};
