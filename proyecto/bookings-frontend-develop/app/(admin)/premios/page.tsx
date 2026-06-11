"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Reward, RewardRedemption, Customer, Business } from "@/lib/types";
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  claimReward,
  getMyRedemptions,
  getBusinessRedemptions,
  validateRedemptionCode,
  getCustomerById,
  getBusinesses,
  getMyPoints,
} from "@/lib/api";

export default function PremiosPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // States for Business
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"discount" | "gift">("discount");
  const [formDiscount, setFormDiscount] = useState<number>(10);
  const [formPoints, setFormPoints] = useState<number>(100);
  const [actionLoading, setActionLoading] = useState(false);

  // States for Customer
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [businessesList, setBusinessesList] = useState<Business[]>([]);
  const [globalPoints, setGlobalPoints] = useState<number>(0);
  const [successClaim, setSuccessClaim] = useState<string | null>(null);
  const [errorClaim, setErrorClaim] = useState<string | null>(null);

  const texts = {
    es: {
      title: "Premios y Puntos",
      subtitle: "Gestiona y canjea premios basados en puntos de reservas.",
      pointsText: "Tus puntos acumulados",
      pointsDesc: "Equivalente a 10 puntos por cada 1 € pagado.",
      unlockedRewards: "Premios Desbloqueados",
      lockedRewards: "Premios Bloqueados",
      noRewards: "No hay premios disponibles para esta empresa.",
      claimButton: "Canjear Premio",
      pointsRequired: "puntos requeridos",
      needPoints: "Te faltan {n} puntos",
      myCoupons: "Mis Cupones / Historial de Canjes",
      codeLabel: "Código",
      statusPending: "Pendiente de uso",
      statusUsed: "Utilizado",
      selectBusiness: "Selecciona una empresa para ver sus premios",
      couponDesc: "Presenta este código en el local para recibir tu premio.",
      
      // Business texts
      adminTitle: "Gestión de Premios y Fidelización",
      createRewardBtn: "Crear Nuevo Premio",
      editRewardTitle: "Editar Premio",
      validateCouponTitle: "Validar Cupón de Cliente",
      couponInputPlaceholder: "Ej: PREM-XYZ123",
      validateBtn: "Validar Código",
      activeRewards: "Premios Configurados",
      receivedClaims: "Canjes Solicitados por Clientes",
      titleLabel: "Título",
      descLabel: "Descripción",
      typeLabel: "Tipo de Premio",
      discountOption: "Descuento",
      giftOption: "Regalo físico / servicio gratis",
      pointsLabel: "Puntos Necesarios",
      discountValLabel: "Valor de Descuento (%)",
      saveBtn: "Guardar Premio",
      cancelBtn: "Cancelar",
      customerLabel: "Cliente",
      dateLabel: "Fecha",
      statusLabel: "Estado",
      actionsLabel: "Acciones",
      markAsUsedBtn: "Marcar como Utilizado",
      rewardGift: "Regalo",
      rewardDiscount: "Descuento del {v}%",
      deleteConfirm: "¿Estás seguro de que quieres eliminar este premio?",
    },
    en: {
      title: "Rewards & Points",
      subtitle: "Manage and claim rewards based on booking points.",
      pointsText: "Your accumulated points",
      pointsDesc: "Equivalent to 10 points for each €1 paid.",
      unlockedRewards: "Unlocked Rewards",
      lockedRewards: "Locked Rewards",
      noRewards: "No rewards available for this company.",
      claimButton: "Claim Reward",
      pointsRequired: "points required",
      needPoints: "You need {n} more points",
      myCoupons: "My Coupons / Claim History",
      codeLabel: "Code",
      statusPending: "Pending use",
      statusUsed: "Used",
      selectBusiness: "Select a company to view their rewards",
      couponDesc: "Show this code at the store to receive your reward.",
      
      // Business texts
      adminTitle: "Rewards & Loyalty Management",
      createRewardBtn: "Create New Reward",
      editRewardTitle: "Edit Reward",
      validateCouponTitle: "Validate Customer Coupon",
      couponInputPlaceholder: "Ex: PREM-XYZ123",
      validateBtn: "Validate Code",
      activeRewards: "Configured Rewards",
      receivedClaims: "Customer Claims Received",
      titleLabel: "Title",
      descLabel: "Description",
      typeLabel: "Reward Type",
      discountOption: "Discount",
      giftOption: "Physical gift / free service",
      pointsLabel: "Required Points",
      discountValLabel: "Discount Value (%)",
      saveBtn: "Save Reward",
      cancelBtn: "Cancel",
      customerLabel: "Customer",
      dateLabel: "Date",
      statusLabel: "Status",
      actionsLabel: "Actions",
      markAsUsedBtn: "Mark as Used",
      rewardGift: "Gift",
      rewardDiscount: "{v}% Discount",
      deleteConfirm: "Are you sure you want to delete this reward?",
    },
  };

  const currentTexts = texts[language === "es" ? "es" : "en"];

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    setError(false);
    try {
      if (user?.role === "empresa") {
        // Fetch rewards and claims for this business
        const fetchedRewards = await getRewards();
        const fetchedClaims = await getBusinessRedemptions();
        setRewards(fetchedRewards);
        setRedemptions(fetchedClaims);
      } else if (user?.role === "usuario") {
        // Fetch client's global points
        const pointsData = await getMyPoints();
        setGlobalPoints(pointsData.points);

        // Fetch all businesses
        const businesses = await getBusinesses();
        setBusinessesList(businesses);

        // Pre-select the first business, if any
        if (businesses.length > 0) {
          const defaultBusiness = businesses[0];
          setSelectedBusinessId(defaultBusiness.id);
          const fetchedRewards = await getRewards(defaultBusiness.id);
          setRewards(fetchedRewards);
        }

        // Fetch redemptions
        const claims = await getMyRedemptions();
        setMyRedemptions(claims);
      }
    } catch (err) {
      console.error("Error fetching rewards data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Handle selected business change for customer
  async function handleBusinessChange(bId: number) {
    setSelectedBusinessId(bId);
    setLoading(true);
    try {
      const fetchedRewards = await getRewards(bId);
      setRewards(fetchedRewards);
    } catch (err) {
      console.error("Error changing business rewards:", err);
    } finally {
      setLoading(false);
    }
  }

  // Claim reward (Customer)
  async function handleClaim(rewardId: number) {
    setErrorClaim(null);
    setSuccessClaim(null);
    try {
      const result = await claimReward(rewardId);
      setSuccessClaim(language === "es" ? `¡Premio canjeado! Código: ${result.code}` : `Reward claimed! Code: ${result.code}`);
      
      // Refresh points and redemptions
      const pointsData = await getMyPoints();
      setGlobalPoints(pointsData.points);

      const claims = await getMyRedemptions();
      setMyRedemptions(claims);
    } catch (err: any) {
      setErrorClaim(err.message || "Error al canjear el premio.");
    }
  }

  // Validate from table button (Business)
  async function handleMarkAsUsed(code: string) {
    try {
      await validateRedemptionCode(code);
      const fetchedClaims = await getBusinessRedemptions();
      setRedemptions(fetchedClaims);
    } catch (err: any) {
      alert(err.message || "Error al validar el canje.");
    }
  }

  // Open creation modal/form (Business)
  function openCreateForm() {
    setEditingReward(null);
    setFormTitle("");
    setFormDesc("");
    setFormType("discount");
    setFormDiscount(10);
    setFormPoints(100);
    setIsFormOpen(true);
  }

  // Open edit modal/form (Business)
  function openEditForm(reward: Reward) {
    setEditingReward(reward);
    setFormTitle(reward.title);
    setFormDesc(reward.description || "");
    setFormType(reward.type);
    setFormDiscount(Number(reward.discountValue) || 10);
    setFormPoints(reward.requiredPoints);
    setIsFormOpen(true);
  }

  // Save reward form (Business)
  async function handleSaveReward(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        type: formType,
        discountValue: formType === "discount" ? formDiscount : undefined,
        requiredPoints: formPoints,
        businessId: user?.businessId,
      };

      if (editingReward) {
        await updateReward(editingReward.id, payload);
      } else {
        await createReward(payload);
      }

      setIsFormOpen(false);
      // Refresh list
      const fetchedRewards = await getRewards();
      setRewards(fetchedRewards);
    } catch (err: any) {
      alert(err.message || "Error al guardar el premio.");
    } finally {
      setActionLoading(false);
    }
  }

  // Delete reward (Business)
  async function handleDeleteReward(id: number) {
    if (!confirm(currentTexts.deleteConfirm)) return;
    try {
      await deleteReward(id);
      setRewards(rewards.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar el premio.");
    }
  }

  if (loading && rewards.length === 0 && myRedemptions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
        Error al cargar los datos del sistema de fidelización.
      </div>
    );
  }

  return (
    <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .premios-grid-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 992px) {
          .premios-grid-layout {
            grid-template-columns: 340px 1fr;
          }
        }
        .loyalty-card {
          padding: 24px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .loyalty-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
        }
        .loyalty-card--selected {
          background: linear-gradient(135deg, var(--purple-600) 0%, var(--purple-900) 100%);
          color: #ffffff !important;
          border-color: transparent;
          transform: translateY(-2px) scale(1.01);
          box-shadow: var(--shadow-md);
        }
        .loyalty-card--selected .text-muted-card {
          color: var(--purple-100) !important;
        }
        .loyalty-card--selected .text-points-label {
          color: var(--purple-200) !important;
        }
        .loyalty-card .text-muted-card {
          color: var(--muted);
        }
        .loyalty-card .text-points-label {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .loyalty-card .circle-decor {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 90px;
          height: 90px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 50%;
          pointer-events: none;
        }
        .reward-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .reward-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .reward-card {
          padding: 20px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .reward-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent);
        }
        .reward-card--unlocked {
          border-color: var(--purple-200);
          background: var(--surface);
        }
        .reward-card--locked {
          opacity: 0.8;
          background: var(--surface-2);
        }
        .progress-bar-container {
          width: 100%;
          background: var(--border);
          height: 6px;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-bar-fill {
          background: var(--accent);
          height: 100%;
          transition: width 0.4s ease;
        }
        .coupon-card {
          padding: 20px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--surface);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
        }
        .coupon-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .coupon-card--used {
          opacity: 0.65;
          background: var(--bg);
        }
        .ticket-cut-left, .ticket-cut-right {
          position: absolute;
          top: 50%;
          width: 16px;
          height: 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 50%;
          margin-top: -8px;
          z-index: 5;
        }
        .ticket-cut-left {
          left: -9px;
        }
        .ticket-cut-right {
          right: -9px;
        }
      `}</style>

      {/* HEADER PAGE */}
      <section className="section-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 className="admin-header__title" style={{ fontSize: "24px" }}>
            {user?.role === "empresa" ? currentTexts.adminTitle : currentTexts.title}
          </h2>
          <p className="admin-header__subtitle" style={{ fontSize: "14px", marginTop: "4px" }}>{currentTexts.subtitle}</p>
        </div>
        {user?.role === "empresa" && (
          <button onClick={openCreateForm} className="primary-btn">
            {currentTexts.createRewardBtn}
          </button>
        )}
      </section>

      {/* ==================================================== */}
      {/* VISTA DE EMPRESA                                     */}
      {/* ==================================================== */}
      {user?.role === "empresa" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="premios-grid-layout">
          {/* Columna Izquierda: Validar y Premios */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Formulario Crear/Editar */}
            {isFormOpen && (
              <form onSubmit={handleSaveReward} className="section-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 className="panel-title">
                  {editingReward ? currentTexts.editRewardTitle : currentTexts.createRewardBtn}
                </h3>
                <div className="form-grid">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{currentTexts.titleLabel}</label>
                    <input
                      type="text"
                      className="input"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{currentTexts.typeLabel}</label>
                    <select
                      className="select"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as "discount" | "gift")}
                    >
                      <option value="discount">{currentTexts.discountOption}</option>
                      <option value="gift">{currentTexts.giftOption}</option>
                    </select>
                  </div>
                  {formType === "discount" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{currentTexts.discountValLabel}</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="input"
                        value={formDiscount}
                        onChange={(e) => setFormDiscount(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{currentTexts.pointsLabel}</label>
                    <input
                      type="number"
                      min={10}
                      className="input"
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="input--full" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{currentTexts.descLabel}</label>
                    <textarea
                      className="input"
                      style={{ height: "80px", padding: "10px" }}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="secondary-btn">
                    {currentTexts.cancelBtn}
                  </button>
                  <button type="submit" disabled={actionLoading} className="primary-btn">
                    {actionLoading ? "..." : currentTexts.saveBtn}
                  </button>
                </div>
              </form>
            )}

            {/* Listado de premios activos */}
            <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 className="panel-title">{currentTexts.activeRewards}</h3>
              {rewards.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>{currentTexts.noRewards}</p>
              ) : (
                <div className="reward-grid">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="reward-card">
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <span className="badge badge--confirmed">
                            {reward.type === "discount" 
                              ? currentTexts.rewardDiscount.replace("{v}", String(reward.discountValue))
                              : currentTexts.rewardGift}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>
                            ⭐ {reward.requiredPoints} pts
                          </span>
                        </div>
                        <h4 style={{ margin: "12px 0 6px 0", fontSize: "16px", fontWeight: 700 }}>{reward.title}</h4>
                        {reward.description && (
                          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{reward.description}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--border)" }}>
                        <button onClick={() => openEditForm(reward)} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          {currentTexts.saveBtn.split(" ")[0]}
                        </button>
                        <button onClick={() => handleDeleteReward(reward.id)} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px", color: "var(--error)", borderColor: "var(--error)" }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Canjes recibidos */}
          <div>
            <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 className="panel-title">{currentTexts.receivedClaims}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                {redemptions.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "14px" }}>No se han registrado canjes todavía.</p>
                ) : (
                  redemptions.map((red) => (
                    <div key={red.id} className="coupon-card" style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", margin: 0 }}>
                            {red.customer && typeof red.customer === "object"
                              ? `${(red.customer as Customer).nombre} ${(red.customer as Customer).apellido}`
                              : `Cliente #${red.customer}`}
                          </p>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0" }}>
                            {red.reward && typeof red.reward === "object" ? (red.reward as Reward).title : "Premio"}
                          </h4>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--accent)", background: "var(--surface-2)", padding: "2px 6px", borderRadius: "4px" }}>
                            {red.code}
                          </span>
                        </div>
                        <span className={`badge ${red.status === 'used' ? 'badge--pending' : 'badge--confirmed'}`} style={{ fontSize: "10px" }}>
                          {red.status === "used" ? currentTexts.statusUsed : currentTexts.statusPending}
                        </span>
                      </div>
                      {red.status === "pending" && (
                        <button
                          onClick={() => handleMarkAsUsed(red.code)}
                          className="primary-btn"
                          style={{ width: "100%", marginTop: "12px", padding: "8px", fontSize: "12px" }}
                        >
                          {currentTexts.markAsUsedBtn}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VISTA DE CLIENTE / USUARIO                           */}
      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* VISTA DE CLIENTE / USUARIO                           */}
      {/* ==================================================== */}
      {user?.role === "usuario" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="premios-grid-layout">
          {/* Columna Izquierda: Tarjeta de fidelidad global */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="panel-title">{language === "es" ? "Mi Estado de Puntos" : "My Points Status"}</h3>
            
            <div className="loyalty-card loyalty-card--selected" style={{ cursor: "default" }}>
              <div className="circle-decor" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <span className="text-points-label">
                    {language === "es" ? "Tarjeta de Socio Global" : "Global Loyalty Card"}
                  </span>
                  <h4 style={{ margin: "4px 0 2px 0", fontSize: "18px", fontWeight: 800 }}>
                    {user?.name || "Cliente"}
                  </h4>
                  <p className="text-muted-card" style={{ fontSize: "12px", margin: 0 }}>
                    {user?.email}
                  </p>
                </div>
                <span style={{ fontSize: "24px" }}>💳</span>
              </div>
              <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                <div>
                  <span className="text-points-label" style={{ display: "block" }}>
                    {language === "es" ? "PUNTOS ACUMULADOS" : "ACCUMULATED POINTS"}
                  </span>
                  <span style={{ fontSize: "24px", fontWeight: 900 }}>{globalPoints} pts</span>
                </div>
                <span style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  textTransform: "uppercase"
                }}>
                  {language === "es" ? "Miembro Activo" : "Active Member"}
                </span>
              </div>
            </div>

            {/* Selector de Negocio */}
            <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
                {language === "es" ? "Selecciona una empresa para ver sus premios" : "Select a business to view its rewards"}
              </label>
              <select
                className="select"
                value={selectedBusinessId || ""}
                onChange={(e) => handleBusinessChange(Number(e.target.value))}
                style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
              >
                <option value="" disabled>
                  {language === "es" ? "-- Selecciona una empresa --" : "-- Select a business --"}
                </option>
                {businessesList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
 
          {/* Columna Derecha: Premios y Cupones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Feedback Banners */}
            {successClaim && (
              <div className="message-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0 }}>
                <span>{successClaim}</span>
                <button onClick={() => setSuccessClaim(null)} style={{ background: "none", border: "none", color: "inherit", fontWeight: "bold", cursor: "pointer" }}>✕</button>
              </div>
            )}
            {errorClaim && (
              <div className="message-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0 }}>
                <span>{errorClaim}</span>
                <button onClick={() => setErrorClaim(null)} style={{ background: "none", border: "none", color: "inherit", fontWeight: "bold", cursor: "pointer" }}>✕</button>
              </div>
            )}
 
            {/* Listado de Premios del Negocio */}
            <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 className="panel-title">Premios de la Empresa</h3>
 
              {!selectedBusinessId ? (
                <p style={{ color: "var(--muted)" }}>{currentTexts.selectBusiness}</p>
              ) : rewards.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>{currentTexts.noRewards}</p>
              ) : (
                <div className="reward-grid">
                  {rewards.map((reward) => {
                    const currentPoints = globalPoints;
                    const hasPoints = currentPoints >= reward.requiredPoints;
                    const progressPercent = Math.min(100, (currentPoints / reward.requiredPoints) * 100);
 
                    return (
                      <div
                        key={reward.id}
                        className={`reward-card ${hasPoints ? "reward-card--unlocked" : "reward-card--locked"}`}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <span className="badge badge--confirmed">
                              {reward.type === "discount" 
                                ? currentTexts.rewardDiscount.replace("{v}", String(reward.discountValue))
                                : currentTexts.rewardGift}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>
                              ⭐ {reward.requiredPoints} pts
                            </span>
                          </div>
                          <h4 style={{ margin: "12px 0 4px 0", fontSize: "16px", fontWeight: 700 }}>{reward.title}</h4>
                          {reward.description && (
                            <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{reward.description}</p>
                          )}
                        </div>
 
                        {/* Progress or Claim Button */}
                        <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                          {hasPoints ? (
                            <button
                               onClick={() => handleClaim(reward.id)}
                              className="primary-btn"
                              style={{ width: "100%", justifyContent: "center" }}
                            >
                              🎉 {currentTexts.claimButton}
                            </button>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600, color: "var(--muted)" }}>
                                <span>{currentTexts.needPoints.replace("{n}", String(reward.requiredPoints - currentPoints))}</span>
                                <span>{Math.round(progressPercent)}%</span>
                              </div>
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${progressPercent}%`, backgroundColor: "var(--muted-2)" }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historial de Cupones */}
            <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 className="panel-title">{currentTexts.myCoupons}</h3>
              {myRedemptions.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "14px" }}>Aún no has canjeado ningún premio.</p>
              ) : (
                <div className="reward-grid">
                  {myRedemptions.map((red) => (
                    <div
                      key={red.id}
                      className={`coupon-card ${red.status === "used" ? "coupon-card--used" : ""}`}
                    >
                      {/* Ticket Cut Border for styling */}
                      {red.status !== "used" && (
                        <>
                          <div className="ticket-cut-left" />
                          <div className="ticket-cut-right" />
                        </>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                            {red.reward && typeof red.reward === "object" && (red.reward as Reward).business && typeof (red.reward as Reward).business === "object"
                              ? ((red.reward as Reward).business as Business).nombre
                              : "Establecimiento"}
                          </span>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0" }}>
                            {red.reward && typeof red.reward === "object" ? (red.reward as Reward).title : "Premio"}
                          </h4>
                          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{currentTexts.codeLabel}:</span>
                            <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: 800, color: "var(--accent)", userSelect: "all" }}>
                              {red.code}
                            </span>
                          </div>
                        </div>
                        <span className={`badge ${red.status === 'used' ? 'badge--pending' : 'badge--confirmed'}`} style={{ fontSize: "10px" }}>
                          {red.status === "used" ? currentTexts.statusUsed : currentTexts.statusPending}
                        </span>
                      </div>
                      
                      {red.status !== "used" && (
                        <p style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                          marginTop: "16px",
                          paddingTop: "8px",
                          borderTop: "1px dashed var(--border)",
                          marginBottom: 0
                        }}>
                          {currentTexts.couponDesc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
