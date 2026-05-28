"use client";

import { useEffect, useState } from "react";
import BookingsClient from "./BookingsClient";
import { getAppointments } from "@/lib/api";
import type { Booking } from "@/lib/types";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAppointments()
      .then(setBookings)
      .catch((err) => {
        console.error("Error cargando las reservas:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>
      
      {loading ? (
        <BookingsSkeleton />
      ) : error ? (
        <div className="p-4 text-red-500 border border-red-200 rounded-md bg-red-50">
          <h3 className="font-bold">Error al cargar las reservas</h3>
          <p>Por favor, inténtalo de nuevo más tarde.</p>
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center p-4">No se encontraron reservas.</p>
      ) : (
        <BookingsClient initialBookings={bookings} />
      )}
    </main>
  );
}

function BookingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-16 bg-gray-200 rounded-md w-full" />
      ))}
    </div>
  );
}