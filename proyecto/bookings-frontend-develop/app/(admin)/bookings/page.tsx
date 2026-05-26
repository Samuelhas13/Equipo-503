import { Suspense } from "react";
import BookingsClient from "./BookingsClient";
import { getAppointments } from "@/lib/api";

// 1. Tipado explícito (si usas TypeScript)
export const revalidate = 0; // Opcional: fuerza a que no se cachee si los datos cambian constantemente

async function BookingsData() {
  // 2. Manejo de errores básico a nivel de fetch
  try {
    const bookings = await getAppointments();
    
    if (!bookings || bookings.length === 0) {
      return <p className="text-center p-4">No se encontraron reservas.</p>;
    }

    return <BookingsClient initialBookings={bookings} />;
  } catch (error) {
    console.error("Error cargando las reservas:", error);
    return (
      <div className="p-4 text-red-500 border border-red-200 rounded-md bg-red-50">
        <h3 className="font-bold">Error al cargar las reservas</h3>
        <p>Por favor, inténtalo de nuevo más tarde.</p>
      </div>
    );
  }
}

export default function BookingsPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>
      
      {/* 3. UX Mejorada: Estado de carga mientras el servidor responde */}
      <Suspense fallback={<BookingsSkeleton />}>
        <BookingsData />
      </Suspense>
    </main>
  );
}

// Un simple esqueleto de carga para que la pantalla no parpadee en blanco
function BookingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-16 bg-gray-200 rounded-md w-full" />
      ))}
    </div>
  );
}