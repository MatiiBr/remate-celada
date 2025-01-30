import { Link, useLocation } from "react-router-dom";

export const Nav = () => {
  const location = useLocation(); 

  const getLinkClass = (path: string) =>
    location.pathname === path
      ? "rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
      : "rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0">
              <img
                className="size-8"
                src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
                alt="Your Company"
              />
            </div>
            <div className="block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className={getLinkClass("/")}
                  aria-current="page"
                >
                  Inicio
                </Link>
                <Link
                  to="/clients"
                  className={getLinkClass("/clients")}
                >
                  Clientes
                </Link>
                <Link
                  to="/bundles"
                  className={getLinkClass("/bundles")}
                >
                  Lotes
                </Link>
                <Link
                  to="/reports"
                  className={getLinkClass("/reports")}
                >
                  Reportes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
