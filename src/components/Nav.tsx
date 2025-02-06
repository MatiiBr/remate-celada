import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

export const Nav = () => {
  const location = useLocation();

  const getLinkClass = (paths: string[]) =>
    paths.includes(location.pathname.split("/")[1])
      ? "rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white"
      : "rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-red-500 hover:text-white";

  return (
    <nav className="relative bg-red-300 mx-auto py-3 px-6 flex items-baseline space-x-4">
      <Link to="/" className={getLinkClass([""])} aria-current="page">
        Inicio
      </Link>
      <Link
        to="/auctions"
        className={getLinkClass([
          "auctions",
          "add-auction",
          "edit-auction",
          "auction-bundles",
          "sales"
        ])}
      >
        Remates
      </Link>
      <Link
        to="/sellers"
        className={getLinkClass(["sellers", "add-seller", "edit-seller"])}
      >
        Vendedores
      </Link>
      <Link
        to="/clients"
        className={getLinkClass(["clients", "add-client", "edit-client"])}
      >
        Compradores
      </Link>
      <Link
        to="/bundles"
        className={getLinkClass(["bundles", "add-bundle", "edit-bundle"])}
      >
        Lotes
      </Link>
      <Link to="/reports" className={getLinkClass(["reports"])}>
        Reportes
      </Link>
      <Logo />
    </nav>
  );
};
