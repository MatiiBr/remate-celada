import "./App.css";
import { Nav } from "./components/Nav";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Bundles from "./pages/Bundles";
import Reports from "./pages/Reports";

function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/bundles" element={<Bundles />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </>
  );
}

export default App;
