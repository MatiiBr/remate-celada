import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Client = {
  id: number;
  name: string;
  email: string;
};

type Status = {
  message: string;
  type: "success" | "error";
};

const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingrese un correo válido"),
});

type ClientFormData = z.infer<typeof clientSchema>;

const Clients = () => {
  const [db, setDb] = useState<Database | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    async function initDb() {
      const database = await Database.load("sqlite:mydatabase.db");
      setDb(database);
      loadClients(database);
    }
    initDb();
  }, []);

  const loadClients = async (database: Database | null) => {
    if (!database) return;
    try {
      const result: any[] = await database.select("SELECT * FROM clients");

      const formattedClients = result.map((client) => ({
        id: Number(client.id),
        name: String(client.name),
        email: String(client.email),
      }));

      setClients(formattedClients);
      setClients(result as Client[]);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!db) return;
    try {
      await db.execute("INSERT INTO clients (name, email) VALUES (?1, ?2);", [
        data.name,
        data.email,
      ]);
      setStatus({
        message: "Cliente agregado correctamente.",
        type: "success",
      });
      reset();
      loadClients(db);
    } catch (error) {
      console.error("Error al agregar cliente:", error);
      setStatus({
        message: "Hubo un error al agregar el cliente.",
        type: "error",
      });
    }
  };
  useEffect(() => {
    loadClients(db);
  }, []);

  return (
    <div className="p-6 mx-auto h-svh bg-white shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-blue-500">Clientes</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex space-y-4 mb-0">
        <div className="flex gap-x-4">
          <div className="flex-1">
            <label className="block text-gray-700">Nombre:</label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-gray-700">Email:</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end ml-auto align-self-end h-50">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Guardando..." : "Agregar Cliente"}
          </button>
        </div>
      </form>
      {status && (
        <p
          className={`mb-4 text-center ${
            status.type == "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2 text-blue-500">
          Lista de Clientes
        </h2>
        {loading ? (
          <p>Cargando...</p>
        ) : clients.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-black border border-gray-300 px-4 py-2">
                  ID
                </th>
                <th className="text-black border border-gray-300 px-4 py-2">
                  Nombre
                </th>
                <th className="text-black border border-gray-300 px-4 py-2">
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="text-black border border-gray-300 px-4 py-2 text-center">
                    {index + 1}
                  </td>
                  <td className="text-black border border-gray-300 px-4 py-2">
                    {client.name}
                  </td>
                  <td className="text-black border border-gray-300 px-4 py-2">
                    {client.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-blue-500">No hay clientes registrados.</p>
        )}
      </div>
    </div>
  );
};

export default Clients;
