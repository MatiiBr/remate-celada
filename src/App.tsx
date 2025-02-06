import "./App.css";
import { Nav } from "./components/Nav";
import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Reports } from "./pages/Reports";
import { Sellers } from "./pages/sellers/Sellers";
import { Clients } from "./pages/clients/Clients";
import { AddSeller } from "./pages/sellers/AddSeller";
import { EditSeller } from "./pages/sellers/EditSeller";
import { AddClient } from "./pages/clients/AddClient";
import { EditClient } from "./pages/clients/EditClient";
import { Bundles } from "./pages/bundles/Bundles";
import { AddBundle } from "./pages/bundles/AddBundle";
import { EditBundle } from "./pages/bundles/EditBundle";
import { Auctions } from "./pages/auctions/Auctions";
import { AddAuction } from "./pages/auctions/AddAuction";
import { EditAuction } from "./pages/auctions/EditAuction";
import { AuctionBundles } from "./pages/auctions/AuctionBundles";
import { Sales } from "./pages/sales/Sales";

function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/add-auction" element={<AddAuction />} />
        <Route path="/edit-auction/:id" element={<EditAuction />} />
        <Route path="/auction-bundles/:id" element={<AuctionBundles />} />
        <Route path="/sales/:auctionId" element={<Sales />} />
        <Route path="/sellers" element={<Sellers />} />
        <Route path="/add-seller" element={<AddSeller />} />
        <Route path="/edit-seller/:id" element={<EditSeller />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/add-client" element={<AddClient />} />
        <Route path="/edit-client/:id" element={<EditClient />} />
        <Route path="/bundles" element={<Bundles />} />
        <Route path="/add-bundle" element={<AddBundle />} />
        <Route path="/edit-bundle/:id" element={<EditBundle />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </>
  );
}

export default App;
