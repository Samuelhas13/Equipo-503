"use client";



import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
  Service,
  RewardRedemption,
} from "@/lib/types";
import {
  createAppointment,
  deleteAppointment,
  getCustomerById,
  updateAppointment,
  getServices,
  getMyRedemptions,
} from "@/lib/api";

const BUSINESS_NAMES: Record<number, string> = {
  1: "Peluquería Nova",
  2: "Restaurante Marea",
  3: "Barber Studio",
  4: "Gimnasio Fit",
  5: "Clínica Dental",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    pending:   "Pendiente",
    confirmed: "Confirmada",
    paid:      "Pagada",
    canceled:  "Cancelada",
    completed: "Completada",
  };
  return <span className={`badge badge--${status}`}>{map[status] ?? status}</span>;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

interface KpiCardColor {
  bar: string;
  trendBg: string;
  trendText: string;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  color: KpiCardColor;
  activity: number[];
}

function KpiCard({ title, value, trend, color, activity }: KpiCardProps) {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;

    const container = barsRef.current;
    const max = Math.max(...activity);

    const bars = container.querySelectorAll<HTMLDivElement>(".kpi-d__dot");
    setTimeout(() => {
      bars.forEach((bar, i) => {
        const v = activity[i] ?? 0;
        const heightPx = Math.round((v / max) * 24 + 4);
        const opacity = v === max ? 1 : v > max * 0.7 ? 0.65 : 0.3;
        bar.style.height = `${heightPx}px`;
        bar.style.opacity = String(opacity);
      });
    }, 150);
  }, [activity]);

  return (
    <div className="kpi-card kpi-card--variant-d">
      <div
        className="kpi-card__accent"
        style={{ background: color.bar }}
        aria-hidden="true"
      />

      <div className="kpi-card__head" style={{ justifyContent: "flex-end" }}>
        <span
          className="kpi-card__trend-badge"
          style={{ background: color.trendBg, color: color.trendText }}
        >
          {trend}
        </span>
      </div>

      <p className="kpi-card__label">{title}</p>
      <p className="kpi-card__value">{value}</p>

      <div className="kpi-card__dots" ref={barsRef} aria-hidden="true">
        {activity.map((_, i) => (
          <div
            key={i}
            className="kpi-d__dot"
            style={{
              background: color.bar,
              opacity: 0.25,
              height: "4px",
              flex: 1,
              borderRadius: "2px 2px 0 0",
              transition: "height 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const KPI_COLORS: Record<string, KpiCardColor> = {
  teal: {
    bar:       "#1D9E75",
    trendBg:   "#E1F5EE",
    trendText: "#085041",
  },
  amber: {
    bar:       "#EF9F27",
    trendBg:   "#FAEEDA",
    trendText: "#412402",
  },
  green: {
    bar:       "#22C55E",
    trendBg:   "#DCFCE7",
    trendText: "#14532D",
  },
  purple: {
    bar:       "#7F77DD",
    trendBg:   "#EEEDFE",
    trendText: "#26215C",
  },
};

const ACTIVITY_DATA = {
  total:     [50, 65, 55, 75, 60, 85, 70, 90, 75, 95, 80, 100, 90, 110],
  pending:   [60, 40, 70, 30, 50, 20, 40, 35, 55, 25, 45, 30, 50, 20],
  confirmed: [40, 55, 35, 70, 60, 80, 75, 90, 65, 85, 70, 95, 80, 100],
  paid:      [30, 45, 20, 55, 40, 65, 50, 70, 45, 60, 55, 80, 65, 90],
};

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const texts = {
    es: {
      title: "Panel de Reservas",
      subtitle: "Gestiona las citas, clientes y estados de tu negocio.",
      newBooking: "Nueva reserva",
      totalBookings: "Total reservas",
      availableRecords: "registros disponibles",
      pending: "Pendientes",
      needsFollowUp: "requiere seguimiento",
      confirmed: "Confirmadas",
      activeStatus: "citas activas",
      paid: "Pagadas",
      closedBookings: "transacciones completadas",
      date: "Fecha",
      time: "Hora",
      status: "Estado",
      customerId: "ID Cliente",
      businessId: "ID Negocio",
      business: "Comercio",
      people: "Personas (1-5)",
      service: "Servicio",
      customerFound: "Cliente encontrado",
      name: "Nombre",
      phone: "Teléfono",
      editBookingTitle: "Editar reserva",
      cancel: "Cancelar",
      pendingOption: "Pendiente",
      confirmedOption: "Confirmada",
      paidOption: "Pagada",
      edit: "Editar",
      searchPlaceholder: "Buscar reserva...",
      showing: "Mostrando",
      to: "a",
      of: "de",
      records: "registros",
      previous: "Anterior",
      next: "Siguiente",
      visitedBusinesses: "Comercios visitados",
      distinctBusinesses: "comercios distintos",
      myRequestedAppointments: "mis citas solicitadas",
      awaitingApproval: "en espera de aprobación",
      scheduledAppointments: "citas programadas",
    },
    en: {
      title: "Bookings Dashboard",
      subtitle: "Manage your business appointments, customers, and statuses.",
      newBooking: "New Booking",
      totalBookings: "Total Bookings",
      availableRecords: "available records",
      pending: "Pending",
      needsFollowUp: "needs follow-up",
      confirmed: "Confirmed",
      activeStatus: "active appointments",
      paid: "Paid",
      closedBookings: "completed transactions",
      date: "Date",
      time: "Time",
      status: "Status",
      customerId: "Customer ID",
      businessId: "Business ID",
      business: "Business",
      people: "People (1-5)",
      service: "Service",
      customerFound: "Customer found",
      name: "Name",
      phone: "Phone",
      editBookingTitle: "Edit Booking",
      cancel: "Cancel",
      pendingOption: "Pending",
      confirmedOption: "Confirmed",
      paidOption: "Paid",
      edit: "Edit",
      searchPlaceholder: "Search booking...",
      showing: "Showing",
      to: "to",
      of: "of",
      records: "records",
      previous: "Previous",
      next: "Next",
      visitedBusinesses: "Businesses visited",
      distinctBusinesses: "distinct businesses",
      myRequestedAppointments: "my requested appointments",
      awaitingApproval: "awaiting approval",
      scheduledAppointments: "scheduled appointments",
    },
  };

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const emptyForm: CreateBookingDto = {
    date: "",
    time: "",
    status: "pending",
    customerId: 1,
    businessId: 1,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [searchedCustomer, setSearchedCustomer] = useState<{
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [createPersons, setCreatePersons] = useState<number>(1);
  const [editPersons, setEditPersons] = useState<number>(1);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function loadServices() {
      try {
        const list = await getServices();
        setServices(list);
      } catch (err) {
        console.error("Error loading services for appointments:", err);
      }
    }
    loadServices();
  }, [user]);

  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);

  useEffect(() => {
    if (user?.role === "usuario") {
      getMyRedemptions()
        .then(setMyRedemptions)
        .catch((err) => console.error("Error loading redemptions:", err));
    }
  }, [user]);

  const filteredServices = useMemo(() => {
    if (user?.role === "empresa") {
      return services.filter((s) => s.businessId === user.businessId || (s as any).business?.id === user.businessId);
    } else {
      const selectedBId = createForm.businessId;
      return services.filter((s) => s.businessId === selectedBId || (s as any).business?.id === selectedBId);
    }
  }, [services, user, createForm.businessId]);

  const filteredServicesForEdit = useMemo(() => {
    const selectedBId = editForm.businessId;
    return services.filter((s) => s.businessId === selectedBId || (s as any).business?.id === selectedBId);
  }, [services, editForm.businessId]);

  async function findCustomer(id: number) {
    if (!id || isNaN(id)) return;
    setSearchingCustomer(true);
    setSearchedCustomer(null);
    setErrorMessage("");
    try {
      const customer = await getCustomerById(id);
      setSearchedCustomer(customer);
    } catch (err) {
      console.error("Error buscando cliente:", err);
      setErrorMessage("No se encontró ningún cliente con ese ID en el sistema.");
    } finally {
      setSearchingCustomer(false);
    }
  }

  // 2. Creamos las referencias para los contenedores de los formularios
  const createFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const roleFilteredBookings = useMemo(() => {
    if (user?.role === "empresa") {
      return bookings.filter((b) => b.businessId === user.businessId);
    } else if (user?.role === "usuario") {
      return bookings.filter((b) => b.userId === user.id);
    }
    return bookings;
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    let result = roleFilteredBookings;
    if (statusFilter !== "all") {
      result = result.filter((booking) => booking.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((booking) => {
        const idStr = String(booking.id).toLowerCase();
        const dateStr = formatDate(booking.date ?? "").toLowerCase();
        const timeStr = String(booking.time ?? "").toLowerCase();
        const serviceStr = String(booking.serviceName ?? "").toLowerCase();
        const customerIdStr = String(booking.customerId ?? "").toLowerCase();
        const businessName = (BUSINESS_NAMES[booking.businessId ?? 0] || `#${booking.businessId ?? "?"}`).toLowerCase();
        
        const map: Record<BookingStatus, string> = {
          pending:   "pendiente",
          confirmed: "confirmada",
          paid:      "pagada",
          canceled:  "cancelada",
          completed: "completada",
        };
        const statusStr = (map[booking.status as BookingStatus] || booking.status || "").toLowerCase();
        
        return (
          idStr.includes(q) ||
          dateStr.includes(q) ||
          timeStr.includes(q) ||
          serviceStr.includes(q) ||
          customerIdStr.includes(q) ||
          businessName.includes(q) ||
          statusStr.includes(q)
        );
      });
    }
    return result;
  }, [roleFilteredBookings, statusFilter, search]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    if (!sortField) return sorted;
    sorted.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      switch (sortField) {
        case "id":
          valA = a.id;
          valB = b.id;
          break;
        case "date":
          valA = a.date ?? "";
          valB = b.date ?? "";
          break;
        case "time":
          valA = a.time ?? "";
          valB = b.time ?? "";
          break;
        case "serviceName":
          valA = a.serviceName ?? "";
          valB = b.serviceName ?? "";
          break;
        case "customerId":
          valA = a.customerId ?? 0;
          valB = b.customerId ?? 0;
          break;
        case "businessId":
          valA = BUSINESS_NAMES[a.businessId ?? 0] || `#${a.businessId ?? "?"}`;
          valB = BUSINESS_NAMES[b.businessId ?? 0] || `#${b.businessId ?? "?"}`;
          break;
        case "status":
          valA = a.status ?? "";
          valB = b.status ?? "";
          break;
        default:
          return 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredBookings, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredBookings.length / 30) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * 30;
    return sortedBookings.slice(start, start + 30);
  }, [sortedBookings, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) {
      pages.push("...");
    }
    if (currentPage > 2) {
      pages.push(currentPage - 1);
    }
    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push(currentPage);
    }
    if (currentPage < totalPages - 1) {
      pages.push(currentPage + 1);
    }
    if (currentPage < totalPages - 2) {
      pages.push("...");
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  };

  const totalCount = roleFilteredBookings.length;
  const pendingCount = roleFilteredBookings.filter((b) => b.status === "pending").length;
  const confirmedCount = roleFilteredBookings.filter((b) => b.status === "confirmed").length;
  const paidCount = roleFilteredBookings.filter((b) => b.status === "paid").length;
  const visitedBusinessesCount = useMemo(() => {
    return new Set(roleFilteredBookings.map((b) => b.businessId).filter(Boolean)).size;
  }, [roleFilteredBookings]);

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetCreateForm() { setCreateForm(emptyForm); }
  function resetEditForm()   { setEditForm(emptyForm); }

  // 3. Modificamos la apertura para añadir el scroll
  function openCreateForm() {
    setSuccessMessage("");
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setIsCreateOpen(true);

    // Auto-asignamos los identificadores reales que vienen del token/auth
    const initialCustomerId = user?.role === "usuario" ? (user.customerId || 1) : 1;
    const initialBusinessId = user?.role === "empresa" ? (user.businessId || 1) : 1;

    setCreateForm({
      date: getTodayString(),
      time: getCurrentTimeString(),
      status: "pending",
      customerId: initialCustomerId,
      businessId: initialBusinessId,
      serviceName: "",
    });

    // El setTimeout asegura que el DOM ya se actualizó y el elemento existe
    setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    let cleanServiceName = booking.serviceName ?? "";
    let parsedPersons = 1;
    const match = (booking.serviceName ?? "").match(/(.*) \((\d+) personas?\)/);
    if (match) {
      cleanServiceName = match[1].trim();
      parsedPersons = Number(match[2]);
    }

    setEditPersons(parsedPersons);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: cleanServiceName,
      serviceId: typeof booking.service === "object" ? booking.service?.id : (typeof booking.service === "number" ? booking.service : undefined),
    });

    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() { setDeleteTargetId(null); }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Check for pending coupons for this business
    const matchingRedemptions = myRedemptions.filter((r) => {
      if (r.status !== "pending") return false;
      const alreadyApplied = bookings.some((b) => b.couponCode === r.code);
      if (alreadyApplied) return false;

      const rBizId = r.reward && typeof r.reward === "object"
        ? (r.reward.business && typeof r.reward.business === "object" ? r.reward.business.id : r.reward.business)
        : undefined;
      return Number(rBizId) === Number(createForm.businessId);
    });

    let couponCode: string | undefined = undefined;
    if (matchingRedemptions.length > 0) {
      const firstRedemption = matchingRedemptions[0];
      const prizeTitle = firstRedemption.reward && typeof firstRedemption.reward === "object"
        ? firstRedemption.reward.title
        : (language === "en" ? "a reward" : "un premio");
        
      const msg = language === "en"
        ? `You have a pending reward coupon for this business: "${prizeTitle}" (${firstRedemption.code}). Do you want to apply it to make this reservation free?`
        : `Tienes un cupón de premio pendiente para este comercio: "${prizeTitle}" (${firstRedemption.code}). ¿Quieres aplicarlo para que esta reserva sea gratis?`;
        
      if (window.confirm(msg)) {
        couponCode = firstRedemption.code;
      }
    }

    try {
      const finalServiceName = `${createForm.serviceName} (${createPersons} ${createPersons === 1 ? 'persona' : 'personas'})`;
      const payload = {
        ...createForm,
        serviceName: finalServiceName,
        couponCode,
      };

      const created = await createAppointment(payload);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
      setCreatePersons(1);
      setSearchedCustomer(null);
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa los datos o el backend.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingBookingId) return;

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const finalServiceName = `${editForm.serviceName} (${editPersons} ${editPersons === 1 ? 'persona' : 'personas'})`;
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        serviceName: finalServiceName,
        serviceId: editForm.serviceId,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      setBookings((prev) =>
        prev.map((booking) => booking.id === editingBookingId ? updated : booking)
      );

      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) closeEditForm();

      setSuccessMessage("Reserva personalizada eliminada con éxito.");
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <div className="booking-page page-stack">
      <section className="page-hero booking-hero">
        <div>
          <h2>{texts[language].title}</h2>
          <p>{texts[language].subtitle}</p>
        </div>

        {user?.role !== "empresa" && (
          <button className="primary-btn" type="button" onClick={user?.role === "usuario" ? () => router.push("/empresas") : openCreateForm}>
            {texts[language].newBooking}
          </button>
        )}
      </section>

      <section className="kpi-grid">
        {user?.role === "usuario" ? (
          <>
            <KpiCard
              title={texts[language].totalBookings}
              value={totalCount}
              trend={texts[language].myRequestedAppointments}
              color={KPI_COLORS.teal}
              activity={ACTIVITY_DATA.total}
            />

            <KpiCard
              title={texts[language].pending}
              value={pendingCount}
              trend={texts[language].awaitingApproval}
              color={KPI_COLORS.amber}
              activity={ACTIVITY_DATA.pending}
            />

            <KpiCard
              title={texts[language].confirmed}
              value={confirmedCount}
              trend={texts[language].scheduledAppointments}
              color={KPI_COLORS.green}
              activity={ACTIVITY_DATA.confirmed}
            />

            <KpiCard
              title={texts[language].visitedBusinesses}
              value={visitedBusinessesCount}
              trend={texts[language].distinctBusinesses}
              color={KPI_COLORS.purple}
              activity={ACTIVITY_DATA.paid}
            />
          </>
        ) : (
          <>
            <KpiCard
              title={texts[language].totalBookings}
              value={totalCount}
              trend={texts[language].availableRecords}
              color={KPI_COLORS.teal}
              activity={ACTIVITY_DATA.total}
            />

            <KpiCard
              title={texts[language].pending}
              value={pendingCount}
              trend={texts[language].needsFollowUp}
              color={KPI_COLORS.amber}
              activity={ACTIVITY_DATA.pending}
            />

            <KpiCard
              title={texts[language].confirmed}
              value={confirmedCount}
              trend={texts[language].activeStatus}
              color={KPI_COLORS.green}
              activity={ACTIVITY_DATA.confirmed}
            />

            <KpiCard
              title={texts[language].paid}
              value={paidCount}
              trend={texts[language].closedBookings}
              color={KPI_COLORS.purple}
              activity={ACTIVITY_DATA.paid}
            />
          </>
        )}
      </section>

      {isCreateOpen && (
        <section ref={createFormRef} className="section-card booking-form-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Nueva reserva</h3>
            <button type="button" className="secondary-btn" onClick={closeCreateForm}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].date}</label>
                <input
                  className="input"
                  type="date"
                  min={getTodayString()}
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].time}</label>
                <input
                  className="input"
                  type="time"
                  value={createForm.time}
                  onChange={(e) => updateCreateForm("time", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].status}</label>
                <select
                  className="select"
                  value={createForm.status}
                  onChange={(e) =>
                    updateCreateForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
              </div>
              
              {user?.role !== "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].customerId}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={createForm.customerId}
                      onChange={(e) => {
                        updateCreateForm("customerId", Number(e.target.value));
                        setSearchedCustomer(null);
                      }}
                      placeholder="Customer ID"
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="secondary-btn"
                                      onClick={() => findCustomer(createForm.customerId ?? 0)}
                      disabled={searchingCustomer}
                      style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                    >
                      {searchingCustomer ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                </div>
              )}

              {user?.role === "admin" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].businessId}</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.businessId}
                    onChange={(e) =>
                      updateCreateForm("businessId", Number(e.target.value))
                    }
                    placeholder="Business ID"
                    required
                  />
                </div>
              )}

              {user?.role === "usuario" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].business}</label>
                  <select
                    className="select"
                    value={createForm.businessId}
                    onChange={(e) => updateCreateForm("businessId", Number(e.target.value))}
                    required
                    style={{ padding: "13px 16px" }}
                  >
                    {Object.entries(BUSINESS_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].people}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.max(1, prev - 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    -
                  </button>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    value={createPersons}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 5) val = 5;
                      setCreatePersons(val);
                    }}
                    style={{ width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                    required
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setCreatePersons(prev => Math.min(5, prev + 1))}
                    style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="input--full" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{texts[language].service}</label>
                <select
                  className="select"
                  value={createForm.serviceId || ""}
                  onChange={(e) => {
                    const sId = Number(e.target.value);
                    const selectedService = filteredServices.find((s) => s.id === sId);
                    updateCreateForm("serviceId", sId);
                    updateCreateForm("serviceName", selectedService ? selectedService.nombre : "");
                  }}
                  required
                  style={{ padding: "13px 16px" }}
                >
                  <option value="">{language === "es" ? "Selecciona un servicio" : "Select a service"}</option>
                  {filteredServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.precio} €)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {searchedCustomer && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(46, 204, 113, 0.08)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  color: '#27ae60',
                  fontSize: '13px'
            }}>
                  <strong style={{ fontSize: "14px", color: "#219653" }}>
                    ✓ {texts[language].customerFound}
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    <span><strong>{texts[language].name}:</strong> {searchedCustomer.name ?? "-"}</span>
                    <span><strong>Email:</strong> {searchedCustomer.email ?? "-"}</span>
                    <span><strong>{texts[language].phone}:</strong> {searchedCustomer.phone ?? "-"}</span>
                  </div>
                </div>
            )}

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingBookingId !== null && (
        <section ref={editFormRef} className="section-card booking-form-card">
  <div className="panel-title-row">
    <h3 className="panel-title">
      {texts[language].editBookingTitle} #{editingBookingId}
    </h3>

    <button type="button" className="secondary-btn" onClick={closeEditForm}>
      {texts[language].cancel}
    </button>
  </div>
          <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 16 }}>
            <div className="form-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].date}
        </label>
        <input
          className="input"
          type="date"
          min={getTodayString()}
          value={editForm.date}
          onChange={(e) => updateEditForm("date", e.target.value)}
          required
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].time}
        </label>
        <input
          className="input"
          type="time"
          value={editForm.time}
          onChange={(e) => updateEditForm("time", e.target.value)}
          required
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].status}
        </label>
        <select
          className="select"
          value={editForm.status}
          onChange={(e) =>
            updateEditForm("status", e.target.value as BookingStatus)
          }
          disabled={user?.role === "usuario"}
        >
          <option value="pending">{texts[language].pendingOption}</option>
          <option value="confirmed">{texts[language].confirmedOption}</option>
          <option value="paid">{texts[language].paidOption}</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].customerId}
        </label>
        <input
          className="input"
          type="number"
          min={1}
          value={editForm.customerId}
          placeholder={texts[language].customerId}
          disabled
          title="El Customer ID no se puede modificar una vez creada la reserva"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].businessId}
        </label>
        <input
          className="input"
          type="number"
          min={1}
          value={editForm.businessId}
          placeholder={texts[language].businessId}
          disabled
          title="El Business ID no se puede modificar una vez creada la reserva"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].people}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setEditPersons((prev) => Math.max(1, prev - 1))}
            style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
          >
            -
          </button>

          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={editPersons}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val < 1) val = 1;
              if (val > 5) val = 5;
              setEditPersons(val);
            }}
            style={{ width: "60px", textAlign: "center", fontWeight: "bold" }}
            required
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={() => setEditPersons((prev) => Math.min(5, prev + 1))}
            style={{ padding: "8px 16px", fontSize: "16px", fontWeight: "bold" }}
          >
            +
          </button>
        </div>
      </div>

      <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          {texts[language].service}
        </label>
        <select
          className="select"
          value={editForm.serviceId || ""}
          onChange={(e) => {
            const sId = Number(e.target.value);
            const selectedService = filteredServicesForEdit.find((s) => s.id === sId);
            updateEditForm("serviceId", sId);
            updateEditForm("serviceName", selectedService ? selectedService.nombre : "");
          }}
          required
          style={{ padding: "13px 16px" }}
        >
          <option value="">{language === "es" ? "Selecciona un servicio" : "Select a service"}</option>
          {filteredServicesForEdit.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} ({s.precio} €)
            </option>
          ))}
        </select>
      </div>
    </div>

            {errorMessage ? <div className="message-error">{errorMessage}</div> : null}

            <div className="message-row">
              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {deleteTargetId !== null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}>
          <div className="modal-card">
            <div className="modal-icon">!</div>
            <h3 className="modal-title">
              {user?.role === "usuario" ? "Cancelar reserva" : "Eliminar reserva"}
            </h3>
            <p className="modal-text">
              {user?.role === "usuario"
                ? `¿Seguro que quieres cancelar la reserva #${deleteTargetId}?`
                : `¿Seguro que quieres eliminar la reserva #${deleteTargetId}?`}
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeDeleteModal}>Cancelar</button>
              <button type="button" className="danger-btn" onClick={confirmDelete} disabled={deletingBookingId === deleteTargetId}>
                {deletingBookingId === deleteTargetId
                  ? (user?.role === "usuario" ? "Cancelando..." : "Eliminando...")
                  : (user?.role === "usuario" ? "Cancelar" : "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.role === "usuario" && roleFilteredBookings.length === 0 ? (
        <section className="section-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", gap: "16px" }}>
          <span style={{ fontSize: "48px" }}>📅</span>
          <h3 className="panel-title" style={{ margin: 0, fontSize: "20px" }}>No tienes ninguna reserva registrada</h3>
          <p style={{ color: "var(--muted)", margin: 0, maxWidth: "400px" }}>
            Aún no has solicitado ninguna cita. Encuentra un comercio y realiza tu primera reserva hoy mismo.
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => router.push("/empresas")}
            style={{ marginTop: "8px" }}
          >
            Hacer mi primera reserva
          </button>
        </section>
      ) : (
        <>
          <section className="section-card">
            <div className="search-row">
          <input
            className="input"
            placeholder={texts[language].searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </section>

      <section className="section-card booking-table-card">
        <div className="panel-title-row">
          <h3 className="panel-title">
            {user?.role === "usuario" ? "Mis Citas Solicitadas" : "Reservas registradas"}
          </h3>
          <div className="filter-row">
            {(["all", "pending", "confirmed", "paid"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-pill ${statusFilter === f ? "filter-pill--active" : ""}`}
                aria-pressed={statusFilter === f}
                onClick={() => {
                  setStatusFilter(f);
                  setCurrentPage(1);
                }}
              >
                {{ all: "Todas", pending: "Pendientes", confirmed: "Confirmadas", paid: "Pagadas" }[f]}
              </button>
            ))}
          </div>
        </div>

        {successMessage ? <div className="message-success" style={{ marginBottom: 12 }}>{successMessage}</div> : null}
        {errorMessage   ? <div className="message-error"   style={{ marginBottom: 12 }}>{errorMessage}</div>   : null}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("id")}>
                    ID{sortField === "id" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("date")}>
                    Fecha{sortField === "date" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("time")}>
                    Hora{sortField === "time" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("serviceName")}>
                    Servicio{sortField === "serviceName" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("customerId")}>
                    Customer{sortField === "customerId" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("businessId")}>
                    Comercio{sortField === "businessId" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("status")}>
                    Estado{sortField === "status" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600 }}>{booking.id}</td>
                  <td>{formatDate(booking.date ?? "")}</td>
                  <td>{booking.time}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.customerId}</td>
                  <td>{BUSINESS_NAMES[booking.businessId ?? 0] || `#${booking.businessId ?? "?"}`}</td>
                  <td><StatusBadge status={(booking.status as BookingStatus) ?? "pending"} /></td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openEditForm(booking)}
                      >
                        {texts[language].edit}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openDeleteModal(booking.id)}
                      >
                        {user?.role === "usuario" ? "Cancelar" : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">
              {texts[language].showing} {(currentPage - 1) * 30 + 1}-{Math.min(filteredBookings.length, currentPage * 30)} {texts[language].of} {filteredBookings.length} {texts[language].records}
            </span>
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous"
                >
                  ←
                </button>
                {getPageNumbers().map((page, idx) => {
                  if (page === "...") {
                    return (
                      <span key={`dots-${idx}`} style={{ padding: "0 8px", color: "var(--muted)", fontWeight: 600 }}>
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`pagination-btn ${currentPage === page ? "pagination-btn--active" : ""}`}
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </section>
      </>)}
    </div>
  );
}