"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/api";
import CustomersClient from "./CustomersClient";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center p-4">Cargando...</p>;
  if (error) return <p className="text-center p-4 text-red-500">Error al cargar los clientes.</p>;

  return <CustomersClient initialCustomers={customers} />;
}