import { getCustomers } from "@/lib/api";
import CustomersClient from "./CustomersClient";

// Esta página carga los clientes desde el backend usando la función getCustomers.
// Después pasa esos datos al componente CustomersClient, que se encarga de la parte interactiva.
export default async function CustomersPage() {
  const customers = await getCustomers();

  return <CustomersClient initialCustomers={customers} />;
}