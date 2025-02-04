import { Toaster } from "react-hot-toast";
import { ContentLayout } from "../components/ContentLayout";
import { useDatabase } from "../helpers/hooks/useDatabase";
import { TableTopBar } from "../components/TableTopBar";
import { AuctionSellersReport } from "../components/reports/AuctionSellersReport";
import { AuctionClientsReport } from "../components/reports/AuctionClientsReport";

export const Reports = () => {
  const { db } = useDatabase();

  return (
    <ContentLayout>
      <TableTopBar name={"Reportes"} />
      <AuctionSellersReport db={db} />
      <AuctionClientsReport db={db} />
      <Toaster />
    </ContentLayout>
  );
};
