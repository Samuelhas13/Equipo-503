import { getBusinesses } from "@/lib/api";
import BusinessesClient from "./BusinessesClient";

// Esta página carga las empresas desde el backend usando la función getBusinesses.
// Después pasa esos datos al componente BusinessesClient, que se encarga de la parte interactiva (CRUD).
export default async function BusinessesPage() {
  const businesses = await getBusinesses();

  return <BusinessesClient initialBusinesses={businesses} />;
}
