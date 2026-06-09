"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Reward, RewardRedemption, Customer, Business, CustomerBusinessPoints } from "@/lib/types";
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
  const [valCode, setValCode] = useState("");
  const [valSuccess, setValSuccess] = useState("");
  const [valError, setValError] = useState("");
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
  const [myPoints, setMyPoints] = useState<CustomerBusinessPoints[]>([]);
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
        // Fetch client's points desglosados per business
        const pointsList = await getMyPoints();
        setMyPoints(pointsList);

        // Pre-select the business with the most points, if any
        if (pointsList.length > 0) {
          const defaultBusiness = pointsList[0].business;
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
      const pointsList = await getMyPoints();
      setMyPoints(pointsList);

      const claims = await getMyRedemptions();
      setMyRedemptions(claims);
    } catch (err: any) {
      setErrorClaim(err.message || "Error al canjear el premio.");
    }
  }

  // Validate Code (Business)
  async function handleValidateCode(e: React.FormEvent) {
    e.preventDefault();
    setValSuccess("");
    setValError("");
    if (!valCode.trim()) return;

    try {
      const result = await validateRedemptionCode(valCode.trim());
      const rwd = result.reward as Reward | undefined;
      const cust = result.customer as Customer | undefined;
      setValSuccess(
        language === "es"
          ? `¡Código validado con éxito! Premio "${rwd?.title || "desconocido"}" entregado a ${cust?.nombre || "Cliente"} ${cust?.apellido || ""}.`
          : `Code validated successfully! Reward "${rwd?.title || "unknown"}" delivered to ${cust?.nombre || "Customer"} ${cust?.apellido || ""}.`
      );
      setValCode("");
      
      // Refresh business claims list
      const fetchedClaims = await getBusinessRedemptions();
      setRedemptions(fetchedClaims);
    } catch (err: any) {
      setValError(err.message || "Código inválido o ya utilizado.");
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
    <div className="container mx-auto p-4 space-y-8">
      {/* HEADER PAGE */}
      <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {user?.role === "empresa" ? currentTexts.adminTitle : currentTexts.title}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{currentTexts.subtitle}</p>
        </div>
        {user?.role === "empresa" && (
          <button onClick={openCreateForm} className="primary-btn shadow-md hover:shadow-lg transition-all">
            {currentTexts.createRewardBtn}
          </button>
        )}
      </section>

      {/* ==================================================== */}
      {/* VISTA DE EMPRESA                                     */}
      {/* ==================================================== */}
      {user?.role === "empresa" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Validar y Premios */}
          <div className="lg:col-span-2 space-y-8">
            {/* Formulario Crear/Editar */}
            {isFormOpen && (
              <form onSubmit={handleSaveReward} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-950 shadow-md space-y-4">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400">
                  {editingReward ? currentTexts.editRewardTitle : currentTexts.createRewardBtn}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{currentTexts.titleLabel}</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{currentTexts.typeLabel}</label>
                    <select
                      className="select w-full"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as "discount" | "gift")}
                    >
                      <option value="discount">{currentTexts.discountOption}</option>
                      <option value="gift">{currentTexts.giftOption}</option>
                    </select>
                  </div>
                  {formType === "discount" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{currentTexts.discountValLabel}</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="input w-full"
                        value={formDiscount}
                        onChange={(e) => setFormDiscount(Number(e.target.value))}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{currentTexts.pointsLabel}</label>
                    <input
                      type="number"
                      min={10}
                      className="input w-full"
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{currentTexts.descLabel}</label>
                    <textarea
                      className="input w-full h-20 py-2"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
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
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{currentTexts.activeRewards}</h2>
              {rewards.length === 0 ? (
                <p className="text-zinc-500">{currentTexts.noRewards}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                            {reward.type === "discount" 
                              ? currentTexts.rewardDiscount.replace("{v}", String(reward.discountValue))
                              : currentTexts.rewardGift}
                          </span>
                          <span className="text-sm font-medium text-zinc-500">
                            ⭐ {reward.requiredPoints} pts
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-white mt-2">{reward.title}</h4>
                        {reward.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{reward.description}</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <button onClick={() => openEditForm(reward)} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                          {currentTexts.saveBtn.split(" ")[0]} {/* "Editar/Guardar" */}
                        </button>
                        <button onClick={() => handleDeleteReward(reward.id)} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Canjes y Validador */}
          <div className="space-y-8">
            {/* Validador de código */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{currentTexts.validateCouponTitle}</h2>
              <form onSubmit={handleValidateCode} className="space-y-3">
                <input
                  type="text"
                  placeholder={currentTexts.couponInputPlaceholder}
                  className="input w-full text-center font-mono uppercase tracking-wider text-lg"
                  value={valCode}
                  onChange={(e) => setValCode(e.target.value)}
                  required
                />
                <button type="submit" className="primary-btn w-full shadow-md">
                  {currentTexts.validateBtn}
                </button>
              </form>

              {valSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-900/40">
                  {valSuccess}
                </div>
              )}
              {valError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/40">
                  {valError}
                </div>
              )}
            </div>

            {/* Listado de Canjes recibidos */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{currentTexts.receivedClaims}</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {redemptions.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No se han registrado canjes todavía.</p>
                ) : (
                  redemptions.map((red) => (
                    <div key={red.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {red.customer && typeof red.customer === "object"
                              ? `${(red.customer as Customer).nombre} ${(red.customer as Customer).apellido}`
                              : `Cliente #${red.customer}`}
                          </p>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                            {red.reward && typeof red.reward === "object" ? (red.reward as Reward).title : "Premio"}
                          </h4>
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                            {red.code}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          red.status === "used" 
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" 
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                        }`}>
                          {red.status === "used" ? currentTexts.statusUsed : currentTexts.statusPending}
                        </span>
                      </div>
                      {red.status === "pending" && (
                        <button
                          onClick={() => handleMarkAsUsed(red.code)}
                          className="w-full mt-1 py-1 text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-50 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:shadow-sm transition-all"
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
      {user?.role === "usuario" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Tarjetas de fidelidad por negocio */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Mis Tarjetas de Puntos</h3>
            
            {myPoints.length === 0 ? (
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2 shadow-sm">
                <span className="text-4xl block">🎁</span>
                <p className="text-zinc-500 text-sm">
                  {language === "es" 
                    ? "Aún no tienes puntos en ningún negocio. ¡Realiza pagos de tus reservas para acumular puntos!" 
                    : "You don't have points in any business yet. Make booking payments to accumulate points!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myPoints.map((item) => {
                  const isSelected = selectedBusinessId === item.business.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleBusinessChange(item.business.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-transparent scale-[1.02]"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] uppercase tracking-widest ${isSelected ? "text-indigo-200" : "text-zinc-400"}`}>
                            {language === "es" ? "Tarjeta de Socio" : "Loyalty Card"}
                          </span>
                          <h4 className="font-extrabold text-lg mt-1">{item.business.nombre}</h4>
                          <p className={`text-xs mt-0.5 ${isSelected ? "text-indigo-200" : "text-zinc-500"}`}>{item.business.direccion}</p>
                        </div>
                        <span className="text-2xl">💳</span>
                      </div>
                      <div className="mt-6 flex justify-between items-end">
                        <div>
                          <span className={`text-[10px] block ${isSelected ? "text-indigo-200" : "text-zinc-400"}`}>PUNTOS</span>
                          <span className="text-2xl font-black">{item.points} pts</span>
                        </div>
                        {isSelected && (
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {language === "es" ? "Activa" : "Active"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Premios y Cupones */}
          <div className="lg:col-span-2 space-y-8">
            {/* Feedback Banners */}
            {successClaim && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
                <span>{successClaim}</span>
                <button onClick={() => setSuccessClaim(null)} className="text-sm font-bold opacity-60 hover:opacity-100">✕</button>
              </div>
            )}
            {errorClaim && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40 shadow-sm flex items-center justify-between">
                <span>{errorClaim}</span>
                <button onClick={() => setErrorClaim(null)} className="text-sm font-bold opacity-60 hover:opacity-100">✕</button>
              </div>
            )}

            {/* Listado de Premios del Negocio */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Premios de la Empresa
              </h2>

              {!selectedBusinessId ? (
                <p className="text-zinc-500">{currentTexts.selectBusiness}</p>
              ) : rewards.length === 0 ? (
                <p className="text-zinc-500">{currentTexts.noRewards}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rewards.map((reward) => {
                    const currentPoints = myPoints.find((p) => p.business.id === selectedBusinessId)?.points || 0;
                    const hasPoints = currentPoints >= reward.requiredPoints;
                    const progressPercent = Math.min(100, (currentPoints / reward.requiredPoints) * 100);

                    return (
                      <div
                        key={reward.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                          hasPoints
                            ? "bg-white dark:bg-zinc-800/40 border-indigo-200 dark:border-indigo-950 shadow-md hover:shadow-lg"
                            : "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-80"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              hasPoints
                                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}>
                              {reward.type === "discount" 
                                ? currentTexts.rewardDiscount.replace("{v}", String(reward.discountValue))
                                : currentTexts.rewardGift}
                            </span>
                            <span className="text-xs font-bold text-zinc-500">
                              ⭐ {reward.requiredPoints} pts
                            </span>
                          </div>
                          <h4 className="font-bold text-zinc-900 dark:text-white mt-3 text-lg">{reward.title}</h4>
                          {reward.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{reward.description}</p>
                          )}
                        </div>

                        {/* Progress or Claim Button */}
                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                          {hasPoints ? (
                            <button
                              onClick={() => handleClaim(reward.id)}
                              className="w-full primary-btn justify-center text-sm font-bold shadow hover:shadow-md transition-all cursor-pointer"
                            >
                              🎉 {currentTexts.claimButton}
                            </button>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                                <span>{currentTexts.needPoints.replace("{n}", String(reward.requiredPoints - currentPoints))}</span>
                                <span>{Math.round(progressPercent)}%</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-zinc-400 dark:bg-zinc-600 h-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
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
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{currentTexts.myCoupons}</h2>
              {myRedemptions.length === 0 ? (
                <p className="text-zinc-500 text-sm">Aún no has canjeado ningún premio.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRedemptions.map((red) => (
                    <div
                      key={red.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        red.status === "used"
                          ? "bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-60"
                          : "bg-gradient-to-r from-indigo-50/50 to-white dark:from-zinc-900 dark:to-zinc-900 border-indigo-100 dark:border-indigo-950 shadow-sm relative overflow-hidden"
                      }`}
                    >
                      {/* Ticket Cut Border for styling */}
                      {red.status !== "used" && (
                        <>
                          <div className="absolute -left-2 top-1/2 -mt-2 w-4 h-4 bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-950 rounded-full"></div>
                          <div className="absolute -right-2 top-1/2 -mt-2 w-4 h-4 bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-950 rounded-full"></div>
                        </>
                      )}

                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                            {red.reward && typeof red.reward === "object" && (red.reward as Reward).business && typeof (red.reward as Reward).business === "object"
                              ? ((red.reward as Reward).business as Business).nombre
                              : "Establecimiento"}
                          </span>
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                            {red.reward && typeof red.reward === "object" ? (red.reward as Reward).title : "Premio"}
                          </h4>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-xs text-zinc-500">{currentTexts.codeLabel}:</span>
                            <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400 select-all">
                              {red.code}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          red.status === "used"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                        }`}>
                          {red.status === "used" ? currentTexts.statusUsed : currentTexts.statusPending}
                        </span>
                      </div>
                      
                      {red.status !== "used" && (
                        <p className="text-[10px] text-zinc-500 mt-4 pt-2 border-t border-dashed border-indigo-100 dark:border-indigo-950/60">
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
