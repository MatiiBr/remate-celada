import { useNavigate, useParams } from "react-router-dom";
import { useDatabase } from "../../helpers/hooks/useDatabase";
import { ContentLayout } from "../../components/ContentLayout";
import { PersistingTopBar } from "../../components/PersisistingTopBar";
import {
  auctionStatusBadgeClasses,
  AuctionStatus,
  AUCTION_STATUSES,
} from "../../helpers/auctionConstants";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Auction } from "./Auctions";
import { PAGE_SIZE } from "../../helpers/Constants";
import { TablePagination } from "../../components/TablePagination";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";

export const AuctionClients = () => {
  const { db } = useDatabase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction>();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEarned, setTotalEarned] = useState(0);

  const fetchClientsFromAuction = async () => {
    if (!db || !id) return;
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;

      const clientsResult: any[] = await db.select(
        `SELECT DISTINCT
            c.id AS client_id,
            c.company AS client_name,
            COALESCE(
                (
                    SELECT SUM(sv.total_price) 
                    FROM sales sv 
                    WHERE sv.id IN (
                        SELECT DISTINCT sd.sale_id
                        FROM sales_details sd
                        JOIN bundle b ON b.id = sd.bundle_id
                        WHERE b.seller_id = c.id AND b.auction_id = ?
                )
            ), 0) AS total_sold,
            COALESCE(
                (
                    SELECT SUM(sc.total_price)
                    FROM sales sc
                    WHERE sc.buyer_id = c.id AND sc.auction_id = ?
                ), 
            0) AS total_spent,
            COALESCE(
                (
                    SELECT SUM(t.amount) 
                    FROM transactions t
                    WHERE t.client_id = c.id AND t.auction_id = ?
                ), 
            0) AS total_paid
          FROM client c
          LEFT JOIN bundle b ON b.seller_id = c.id
          LEFT JOIN sales_details sd_vendedor ON b.id = sd_vendedor.bundle_id
          LEFT JOIN sales s_vendedor ON s_vendedor.id = sd_vendedor.sale_id AND s_vendedor.auction_id = b.auction_id
          LEFT JOIN sales s_comprador ON s_comprador.buyer_id = c.id AND s_comprador.auction_id = b.auction_id
          WHERE EXISTS (
            SELECT 1 FROM bundle b WHERE b.seller_id = c.id AND b.auction_id = ?
          ) OR EXISTS (
            SELECT 1 FROM sales s WHERE s.buyer_id = c.id AND s.auction_id = ?
          )
          GROUP BY c.id
          ORDER BY c.id ASC
          LIMIT ? OFFSET ?;`,
        [id, id, id, id, id, PAGE_SIZE, offset]
      );
      const totalEarnedResult: any[] = await db.select(
        `WITH TotalSales AS (
            SELECT SUM(s.total_price) AS total_sold
            FROM sales s
            WHERE s.auction_id = ?
        ),
        TotalPurchases AS (
            SELECT SUM(s2.total_price) AS total_spent
            FROM sales s2
            WHERE s2.auction_id = ?
        )
        SELECT 
            COALESCE(ts.total_sold * 0.1, 0) AS total_sold_commission,
            COALESCE(tp.total_spent * 0.1, 0) AS total_spent_commission
        FROM TotalSales ts
        CROSS JOIN TotalPurchases tp;`,
        [id, id]
      );
      
      const totalSoldCommission = totalEarnedResult[0]?.total_sold_commission ?? 0;
      const totalSpentCommission = totalEarnedResult[0]?.total_spent_commission ?? 0;
      const totalEarnedValue = totalSoldCommission + totalSpentCommission;
      
      setTotalEarned(totalEarnedValue);

      const clientsWithBalance = clientsResult.map((client) => {
        const soldComission = client.total_sold * 0.1;
        const spentComission = client.total_spent * 0.1;
        const soldWithComission = client.total_sold - soldComission;
        const spentWithComission = client.total_spent + spentComission;
        const subtotal = Math.abs(spentWithComission - soldWithComission);
        const isToPay = spentWithComission - soldWithComission <= 0;
        const comission = soldComission + spentComission;
        const isPaid = client.total_paid > 0;


        return {
          ...client,
          subtotal,
          isToPay: isToPay,
          comission,
          isPaid,
        };
      });

      const totalResult: any[] = await db.select(
        `SELECT COUNT(DISTINCT c.id) AS count
         FROM client c
         LEFT JOIN bundle b ON c.id = b.seller_id AND b.auction_id = ?
         LEFT JOIN sales s ON c.id = s.buyer_id AND s.auction_id = ?
         WHERE b.id IS NOT NULL OR s.id IS NOT NULL;`,
        [id, id]
      );

      setTotalPages(Math.ceil(totalResult[0].count / PAGE_SIZE));
      setClients(clientsWithBalance);
    } catch (error) {
      console.error("Error al cargar los clientes del remate:", error);
      toast.error("Error al cargar los clientes del remate");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchClientsFromAuction();
  }, [db, id, navigate, currentPage]);

  const handleRegisterTransaction = async (
    clientId: number,
    amount: number,
    type: "PAGO" | "COBRO"
  ) => {
    if (!db || !id) return;
    try {
      await db.execute(
        `INSERT INTO transactions (auction_id, client_id, amount, type) 
         VALUES (?, ?, ?, ?)`,
        [id, clientId, amount, type]
      );

      toast.success("Transacción registrada correctamente");
      fetchClientsFromAuction();
    } catch (error) {
      console.error("Error al registrar transacción:", error);
      toast.error("Error al registrar transacción");
    }
  };

  return (
    <ContentLayout>
      <PersistingTopBar to={`/auctions`} withoutSubmitButton>
        <p>
          Clientes del Remate:{" "}
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

      <div className="px-6 flex justify-end">
        Total Ganado:&nbsp;
        <span className="font-bold text-green-700">
          $
          {totalEarned.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>
      <div className="p-6">
        {loading ? (
          <p className="text-gray-500">Cargando clientes...</p>
        ) : clients.length > 0 ? (
          <>
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-red-900">
                  <th className="text-white px-4 py-2 text-left rounded-tl-md">
                    ID
                  </th>
                  <th className="text-white px-4 py-2 text-left">Cliente</th>
                  <th className="text-white px-4 py-2 text-left">Vendido</th>
                  <th className="text-white px-4 py-2 text-left">Gastado</th>
                  <th className="text-white px-4 py-2 text-left"></th>
                  <th className="text-white px-4 py-2 text-left">Subtotal</th>
                  <th className="text-white px-4 py-2 text-left">Comision</th>
                  <th className="text-white px-4 py-2 text-left rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr
                    key={client.client_id}
                    className="odd:bg-red-100 even:bg-red-200"
                  >
                    <td
                      className={`text-black px-4 py-2 ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === clients.length) &&
                        "rounded-bl-md"
                      }`}
                    >
                      {client.client_id}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {client.client_name || "-"}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {client.total_sold
                        ? `$${client.total_sold.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td className={`text-black px-4 py-2`}>
                      {client.total_spent
                        ? `$${client.total_spent.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td
                      className={`px-4 py-2 font-medium ${
                        (client.total_spent > 0 || client.total_sold > 0) &&
                        (client.isToPay ? "text-red-600" : "text-green-600")
                      }`}
                    >
                      {client.isPaid ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset bg-gray-700 text-white ring-gray-600/10`}
                        >
                          SALDADO
                        </span>
                      ) : client.total_spent > 0 || client.total_sold > 0 ? (
                        client.isToPay ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset bg-red-700 text-white ring-red-600/10`}
                          >
                            SALDO A PAGAR
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset bg-green-700 text-white ring-green-600/10`}
                          >
                            SALDO A COBRAR
                          </span>
                        )
                      ) : (
                        " - "
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 font-medium ${
                        client.subtotal > 0 &&
                        !client.isPaid &&
                        (client.isToPay
                          ? "font-bold text-red-600"
                          : "font-bold text-green-600")
                      }`}
                    >
                      {client.subtotal
                        ? `$${client.subtotal.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td
                      className={`px-4 py-2 font-medium ${
                        client.balance > 0 &&
                        (client.isToPay ? "text-red-600" : "text-green-600")
                      }`}
                    >
                      {client.comission
                        ? `$${client.comission.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td
                      className={`text-black px-4 py-2  ${
                        (index + 1 === PAGE_SIZE ||
                          index + 1 === clients.length) &&
                        "rounded-br-md"
                      }`}
                    >
                      {client.subtotal > 0 &&
                        !client.isPaid &&
                        auction?.status === AUCTION_STATUSES.FINALIZADO && (
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleRegisterTransaction(
                                  client.client_id,
                                  client.subtotal,
                                  client.isToPay ? "PAGO" : "COBRO"
                                )
                              }
                              className="cursor-pointer"
                              title="Pagar"
                            >
                              <CurrencyDollarIcon className="size-6 text-red-700" />
                            </button>
                          </div>
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
          </>
        ) : (
          <p className="text-red-500">
            No hay clientes registrados en este remate.
          </p>
        )}
      </div>
      <Toaster />
    </ContentLayout>
  );
};
