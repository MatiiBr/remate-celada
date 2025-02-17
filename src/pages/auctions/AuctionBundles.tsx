import { Link, useNavigate, useParams } from "react-router-dom";
import { ContentLayout } from "../../components/ContentLayout";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Auction } from "./Auctions";
import { PAGE_SIZE } from "../../helpers/Constants";
import { TablePagination } from "../../components/TablePagination";
import { ControlledTextField } from "../../components/ControlledTextField";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ask } from "@tauri-apps/plugin-dialog";

const filterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
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
  const [sales, setSales] = useState<any[]>([]);
  const [auction, setAuction] = useState<Auction>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clientOptions, setClientOptions] = useState<Option[]>();
  const [totalSale, setTotalSale] = useState<number>();

  const { control, watch, resetField } = useForm<FilterData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { name: "" },
  });
  const nameField = watch("name");
  const clientField = watch("client");

  const _filters = (name: string, client: Option) => {
    let paramsQuerySQL = "";
    let params: any[] = [];

    if (name) {
      paramsQuerySQL += ` AND EXISTS (SELECT 1 FROM sales_details sd2 
                          JOIN bundle b2 ON sd2.bundle_id = b2.id 
                          WHERE sd2.sale_id = s.id AND b2.number LIKE ?)`;
      params.push(`%${name}%`);
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
      const clientsResult: any[] = await db.select(
        `SELECT DISTINCT c.id, c.company AS client_company
         FROM sales s
         JOIN client c ON s.client_id = c.id
         WHERE s.auction_id = ?;`,
        [id]
      );

      const clientsOptions = clientsResult.map((client) => ({
        value: client.id,
        label: client.client_company,
      }));

      setClientOptions(clientsOptions);
    } catch (error) {
      console.error(
        "Error al cargar filtros de vendedores y compradores:",
        error
      );
    }
  };
  const fetchSalesFromAuction = async (nameField: string) => {
    if (!db || !id) return;

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const { params, paramsQuerySQL } = _filters(nameField, clientField);

      const salesResult: any[] = await db.select(
        `SELECT 
            s.id AS sale_id,
            s.auction_id,
            s.client_id,
            c.company AS client_company,
            s.total_price,
            s.deadline,
            GROUP_CONCAT(b.number, ', ') AS bundle_numbers
          FROM sales s
          LEFT JOIN client c ON s.client_id = c.id
          LEFT JOIN sales_details sd ON s.id = sd.sale_id
          LEFT JOIN bundle b ON sd.bundle_id = b.id
          LEFT JOIN seller se ON b.seller_id = se.id
          WHERE s.auction_id = ? ${paramsQuerySQL}
          GROUP BY s.id
          ORDER BY s.id DESC
          LIMIT ? OFFSET ?;`,
        [id, ...params, PAGE_SIZE, offset]
      );

      const totalResult: any[] = await db.select(
        `SELECT COUNT(DISTINCT s.id) AS count
         FROM sales s
         LEFT JOIN client c ON s.client_id = c.id
         LEFT JOIN sales_details sd ON s.id = sd.sale_id
         LEFT JOIN bundle b ON sd.bundle_id = b.id
         LEFT JOIN seller se ON b.seller_id = se.id
         WHERE s.auction_id = ? ${paramsQuerySQL};`,
        [id, ...params]
      );

      const totalSaleResult: any[] = await db.select(
        `SELECT SUM(s.total_price) AS total_sales
         FROM sales s
         WHERE s.auction_id = ? ${paramsQuerySQL};`,
        [id, ...params]
      );

      setTotalPages(Math.ceil(totalResult[0].count / PAGE_SIZE));
      setTotalSale(totalSaleResult[0].total_sales || 0);
      setSales(salesResult);
    } catch (error) {
      console.error("Error al cargar lotes del remate:", error);
      toast.error("Error al cargar lotes del remate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
    fetchSalesFromAuction(nameField);
  }, [db, id, navigate, currentPage, clientField]);

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
      fetchSalesFromAuction(nameField);
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

  const handleEdit = (saleId: string, auctionId: string) => {
    navigate(`/edit-sale/${auctionId}/${saleId}`);
  };
  const handleCancel = async (saleId: string) => {
    if (!db) return;

    const confirm = await ask("La venta va a ser cancelada.", {
      title: "Cancelar venta",
      kind: "warning",
    });

    if (confirm) {
      try {
        await db.execute(`DELETE FROM sales_details WHERE sale_id = ?`, [
          saleId,
        ]);

        await db.execute(`DELETE FROM sales WHERE id = ?`, [saleId]);

        toast.success("Venta eliminada correctamente");
        fetchSalesFromAuction(nameField);
      } catch (error) {
        await db.execute("ROLLBACK");
        toast.error("Error al eliminar la venta");
        console.error("Error al eliminar venta:", error);
      }
    }
  };

  return (
    <ContentLayout>
      <PersistingTopBar to={`/auction-bundles/${id}`} withoutSubmitButton>
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
          <ControlledSearchSelectField
            control={control}
            name="client"
            options={clientOptions!}
            placeholder="Selecciona un comprador"
          />

          <div className="ml-auto flex gap-3">
            {auction?.status === AUCTION_STATUSES.EN_CURSO && (
              <Link
                to={`/add-sale/${id}`}
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
          <p className="text-gray-500">Cargando ventas...</p>
        ) : sales.length > 0 ? (
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
                  <th className="text-white px-4 py-2 text-left rounded-tl-md">
                    Lote
                  </th>
                  <th className="text-white px-4 py-2 text-left">Comprador</th>
                  <th className="text-white px-4 py-2 text-left">Plazo</th>
                  <th className="text-white px-4 py-2 text-left">Precio</th>
                  <th className="text-white px-4 py-2 text-left rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr
                    key={sale.sale_id}
                    className="odd:bg-red-100 even:bg-red-200"
                  >
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === sales.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {sale.bundle_numbers}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {sale.client_company || "-"}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {sale.deadline || "-"}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {sale.total_price
                        ? `$${sale.total_price.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td
                      className={`text-black px-4 py-2 flex gap-4 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === sales.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(sale.sale_id, sale.auction_id)
                        }
                        className="cursor-pointer"
                        title="Editar venta"
                      >
                        <PencilIcon className="size-6 text-red-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(sale.sale_id)}
                        className="cursor-pointer"
                        title="Cancelar venta"
                      >
                        <TrashIcon className="size-6 text-red-700" />
                      </button>
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
      <Toaster />
    </ContentLayout>
  );
};
