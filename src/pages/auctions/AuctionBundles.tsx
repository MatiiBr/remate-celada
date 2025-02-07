import { Link, useNavigate, useParams } from "react-router-dom";
import { ContentLayout } from "../../components/ContentLayout";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Auction } from "./Auctions";
import { PAGE_SIZE, SALE_STATUSES } from "../../helpers/Constants";
import { TablePagination } from "../../components/TablePagination";
import { ControlledTextField } from "../../components/ControlledTextField";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControlledSelectField } from "../../components/ControlledSelectField";
import {
  ControlledSearchSelectField,
  Option,
} from "../../components/ControlledSearchSelectField";
import debounce from "debounce";
import {
  AUCTION_STATUSES,
  AuctionStatus,
  auctionStatusBadgeClasses,
} from "../../helpers/auctionConstants";

const filterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  status: z.string(),
  seller: z.object({
    value: z.string(),
    label: z.string(),
  }),
  client: z.object({
    value: z.string(),
    label: z.string(),
  }),
});
type FilterData = z.infer<typeof filterSchema>;

export const AuctionBundles = () => {
  const { db } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<any[]>([]);
  const [auction, setAuction] = useState<Auction>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sellerOptions, setSellerOptions] = useState<Option[]>();
  const [clientOptions, setClientOptions] = useState<Option[]>();
  const [totalSale, setTotalSale] = useState<number>();

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "" },
  });
  const nameField = watch("name");
  const statusField = watch("status");
  const sellerField = watch("seller");
  const clientField = watch("client");

  const _filters = (
    name: string,
    status: string,
    seller: Option,
    client: Option
  ) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (name) {
      paramsQuerySQL += " AND (b.name LIKE ? OR b.number LIKE ?)";
      params.push(`%${name}%`, `%${name}%`);
    }

    if (status) {
      paramsQuerySQL += " AND s.sold = ?";
      params.push(status === "VENDIDO" ? 1 : 0);
    }

    if (seller) {
      paramsQuerySQL += " AND b.seller_id = ?";
      params.push(seller.value);
    }

    if (client) {
      paramsQuerySQL += " AND s.client_id = ?";
      params.push(client.value);
    }

    return { params, paramsQuerySQL };
  };

  const loadFilters = async () => {
    if (!db || !id) return;

    try {
      const sellersResult: any[] = await db.select(
        `SELECT DISTINCT se.id, se.company AS seller_company
         FROM bundle b
         JOIN seller se ON b.seller_id = se.id
         WHERE b.auction_id = ?;`,
        [id]
      );

      const clientsResult: any[] = await db.select(
        `SELECT DISTINCT c.id, c.company AS client_company
         FROM sales s
         JOIN client c ON s.client_id = c.id
         WHERE s.auction_id = ?;`,
        [id]
      );

      const sellersOptions = sellersResult.map((seller) => ({
        value: seller.id,
        label: seller.seller_company,
      }));

      const clientsOptions = clientsResult.map((client) => ({
        value: client.id,
        label: client.client_company,
      }));

      setSellerOptions(sellersOptions);
      setClientOptions(clientsOptions);
    } catch (error) {
      console.error(
        "Error al cargar filtros de vendedores y compradores:",
        error
      );
    }
  };
  const fetchBundlesFromAuction = async (nameField: string) => {
    if (!db || !id) return;

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const { params, paramsQuerySQL } = _filters(
        nameField,
        statusField,
        sellerField,
        clientField
      );

      const bundlesResult: any[] = await db.select(
        `SELECT 
            b.*, 
            se.company AS seller_company, 
            c.company AS client_company, 
            s.sold_price, 
            s.sold AS sale_sold,
            s.deadline
        FROM bundle b
        JOIN seller se ON b.seller_id = se.id
        LEFT JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
        LEFT JOIN client c ON s.client_id = c.id
        WHERE b.auction_id = ? ${paramsQuerySQL}
        LIMIT ? OFFSET ?;`,
        [id, ...params, PAGE_SIZE, offset]
      );

      const totalResult: any[] = await db.select(
        `SELECT COUNT(*) AS count
          FROM bundle b
          LEFT JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
          LEFT JOIN client c ON s.client_id = c.id
          JOIN seller se ON b.seller_id = se.id
          WHERE b.auction_id = ? ${paramsQuerySQL};`,
        [id, ...params]
      );

      const totalSaleResult: any[] = await db.select(
        `SELECT SUM(s.sold_price) AS total_sales
         FROM bundle b
         LEFT JOIN sales s ON s.bundle_id = b.id AND s.auction_id = b.auction_id
         WHERE b.auction_id = ? ${paramsQuerySQL};`,
        [id, ...params]
      );

      setTotalPages(Math.ceil(totalResult[0].count / PAGE_SIZE));
      setTotalSale(totalSaleResult[0].total_sales || 0);
      setBundles(bundlesResult);
    } catch (error) {
      console.error("Error al cargar lotes del remate:", error);
      toast.error("Error al cargar lotes del remate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
    fetchBundlesFromAuction(nameField);
  }, [db, id, navigate, currentPage, statusField, sellerField, clientField]);

  useEffect(() => {
    const fetchAuction = async () => {
      if (!db || !id) return;
      try {
        const auctionResult: any[] = await db.select(
          "SELECT name, status FROM auction WHERE id = ?",
          [id]
        );
        setAuction(auctionResult[0]);
      } catch (error) {
        console.error("Error al cargar el remate:", error);
        toast.error("Error al cargar el remate");
      }
    };
    fetchAuction();
  }, [db, auction]);

  const debouncedSearch = useCallback(
    debounce((nameField) => {
      fetchBundlesFromAuction(nameField);
    }, 500),
    [db]
  );

  useEffect(() => {
    debouncedSearch(nameField);
  }, [nameField]);

  const handleIconClick = () => {
    resetField("name");
  };

  const handleClean = () => {
    resetField("name");
  };

  return (
    <ContentLayout>
      <PersistingTopBar to={"/auctions"} withoutSubmitButton>
        <p>
          Lotes del Remate:{" "}
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
            label={""}
            placeholder="Busca por nombre o numero de lote"
            name="name"
            icon={<XMarkIcon className="size-6 text-red-700" />}
            onIconClick={handleIconClick}
            inputClassName="min-w-xs"
          />
          <ControlledSelectField
            control={control}
            name="status"
            options={SALE_STATUSES}
            placeholder="Selecciona un estado"
          />
          <ControlledSearchSelectField
            control={control}
            name="seller"
            options={sellerOptions!}
            placeholder="Selecciona un vendedor"
          />

          <ControlledSearchSelectField
            control={control}
            name="client"
            options={clientOptions!}
            placeholder="Selecciona un comprador"
          />

          <div className="ml-auto flex gap-3">
            {auction?.status === AUCTION_STATUSES.EN_CURSO && (
              <Link
                to={`/sales/${id}`}
                className="py-2 px-3  border border-red-700 text-white cursor-pointer bg-red-700 hover:bg-white hover:text-red-700 font-semibold rounded"
              >
                Cargar ventas
              </Link>
            )}
            <button
              onClick={handleClean}
              className="py-2 px-3  border border-red-700 text-red-700 cursor-pointer hover:bg-red-700 hover:text-white font-semibold rounded"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
      <div className="p-6">
        {loading ? (
          <p className="text-gray-500">Cargando lotes...</p>
        ) : bundles.length > 0 ? (
          <>
            {Boolean(totalSale) && totalSale && (
              <h3 className="text-right mb-3">
                Total recaudado:{" "}
                <span className="text-red-500 font-semibold">
                  $
                  {totalSale.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </h3>
            )}
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 rounded-tl-md">Número</th>
                  <th className="text-white px-4 py-2 text-left">Nombre</th>
                  <th className="text-white px-4 py-2 text-left">
                    Observaciones
                  </th>
                  <th className="text-white px-4 py-2 text-left">Vendedor</th>
                  <th className="text-white px-4 py-2 text-left">Estado</th>
                  <th className="text-white px-4 py-2 text-left">Comprador</th>
                  <th className="text-white px-4 py-2 text-left">
                    Plazo
                  </th>
                  <th className="text-white px-4 py-2 text-left rounded-tr-md">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle, index) => (
                  <tr
                    key={bundle.id}
                    className={index % 2 === 0 ? "bg-red-100" : "bg-red-200"}
                  >
                    <td
                      className={`text-black px-4 py-2 text-center ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {bundle.number}
                    </td>
                    <td className="text-black px-4 py-2">{bundle.name}</td>
                    <td className="text-black px-4 py-2">
                      {bundle.observations || "Sin observaciones"}
                    </td>
                    <td className="text-black px-4 py-2">
                      {bundle.seller_company}
                    </td>
                    <td className="text-black px-4 py-2">
                      {bundle.sale_sold ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                          VENDIDO
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset">
                          EN VENTA
                        </span>
                      )}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {bundle.client_company || "-"}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {bundle.deadline || "-"}
                    </td>
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === bundles.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      {bundle.sold_price
                        ? `$${bundle.sold_price.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
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
          <p className="text-red-500">No hay lotes asignados a este remate.</p>
        )}
      </div>
    </ContentLayout>
  );
};
