import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server';
import { v2Get, isAdmin } from '../utils/api';

/**
 * Dashboard de estadísticas — Fase 4 iter 5.
 * Tres gráficos alimentados por /api/v2/dashboard/*:
 *   - Órdenes por período (line chart, creadas vs entregadas)
 *   - Ingresos por período (bar chart, facturación)
 *   - Rendimiento por sucursal (horizontal bar chart)
 *
 * El JWT se guarda en localStorage.token durante el login (ver Login.js).
 * Si falta o expira, los cards muestran el error del backend (401 →
 * "Sesión expirada"); el user puede volver a loguearse para refrescarlo.
 */
function Dashboard() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [granularity, setGranularity] = useState('month');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);

  const admin = isAdmin();
  const userBranch = Number(localStorage.getItem('branchId')) || null;

  const [ordersData, setOrdersData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState({ orders: false, revenue: false, branch: false });
  const [errors, setErrors] = useState({ orders: null, revenue: null, branch: null });

  // Fetch lista de sucursales para el dropdown del admin.
  useEffect(() => {
    if (!admin) return;
    axios
      .get(`${SERVER}/branches`)
      .then((r) => setBranches(r.data))
      .catch(() => setBranches([]));
  }, [admin]);

  // Fetch los 3 gráficos en paralelo cuando cambian filtros.
  useEffect(() => {
    const effectiveBranchId = admin ? (branchId ? Number(branchId) : undefined) : userBranch;
    const baseParams = { from, to };
    if (effectiveBranchId) baseParams.branchId = effectiveBranchId;

    setLoading({ orders: true, revenue: true, branch: true });
    setErrors({ orders: null, revenue: null, branch: null });

    v2Get('/dashboard/orders-over-time', { ...baseParams, granularity })
      .then((r) => setOrdersData(r.data))
      .catch((e) => setErrors((prev) => ({ ...prev, orders: extractError(e) })))
      .finally(() => setLoading((prev) => ({ ...prev, orders: false })));

    v2Get('/dashboard/revenue', { ...baseParams, granularity, section: 'buckets' })
      .then((r) => setRevenueData(r.data))
      .catch((e) => setErrors((prev) => ({ ...prev, revenue: extractError(e) })))
      .finally(() => setLoading((prev) => ({ ...prev, revenue: false })));

    v2Get('/dashboard/branch-performance', baseParams)
      .then((r) => setBranchData(r.data))
      .catch((e) => setErrors((prev) => ({ ...prev, branch: extractError(e) })))
      .finally(() => setLoading((prev) => ({ ...prev, branch: false })));
  }, [from, to, granularity, branchId, admin, userBranch]);

  return (
    <div className="bg-gray-200 min-h-screen">
      <MainNavBar />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

        <div className="bg-white rounded-lg p-4 mb-4 shadow flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Granularidad</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
          {admin && (
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">Todas</option>
                {branches.map((b) => (
                  <option key={b.idbranches} value={b.idbranches}>
                    {b.branch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <OrdersOverTimeCard data={ordersData} loading={loading.orders} error={errors.orders} />
        <RevenueCard data={revenueData} loading={loading.revenue} error={errors.revenue} />
        <BranchPerformanceCard data={branchData} loading={loading.branch} error={errors.branch} />
      </div>
    </div>
  );
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function extractError(e) {
  if (e?.response?.status === 401) {
    return 'Sesión v2 expirada. Cerrá sesión y volvé a ingresar.';
  }
  return (
    e?.response?.data?.error?.message ??
    e?.response?.data ??
    e?.message ??
    'Error desconocido'
  );
}

function formatARS(v) {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return `$${n.toLocaleString('es-AR')}`;
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Status({ loading, error, empty }) {
  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (empty) return <p className="text-gray-500">Sin datos en el rango seleccionado.</p>;
  return null;
}

function OrdersOverTimeCard({ data, loading, error }) {
  const buckets = data?.buckets ?? [];
  const empty = !loading && !error && data && buckets.length === 0;
  return (
    <Card title="Órdenes por período">
      <Status loading={loading} error={error} empty={empty} />
      {!loading && !error && buckets.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="created"
              stroke="#3b82f6"
              name="Creadas"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="delivered"
              stroke="#10b981"
              name="Entregadas"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function RevenueCard({ data, loading, error }) {
  const buckets = data?.buckets ?? [];
  const empty = !loading && !error && data && buckets.length === 0;
  return (
    <Card title="Ingresos por período">
      {data && (
        <p className="text-sm text-gray-600 mb-2">
          Total facturación en el rango: <strong>{formatARS(data.totalFacturacion)}</strong>
        </p>
      )}
      <Status loading={loading} error={error} empty={empty} />
      {!loading && !error && buckets.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis tickFormatter={formatARS} width={90} />
            <Tooltip formatter={(v) => formatARS(v)} />
            <Bar dataKey="facturacion" fill="#8b5cf6" name="Facturación" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function BranchPerformanceCard({ data, loading, error }) {
  const items = data?.items ?? [];
  const withActivity = items.filter((i) => i.ordersCreated > 0);
  const empty = !loading && !error && data && withActivity.length === 0;
  return (
    <Card title="Rendimiento por sucursal">
      <Status loading={loading} error={error} empty={empty} />
      {!loading && !error && withActivity.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(220, withActivity.length * 50)}>
          <BarChart data={withActivity} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="branchName" width={130} />
            <Tooltip content={<BranchTooltip />} />
            <Legend />
            <Bar dataKey="ordersCreated" fill="#3b82f6" name="Creadas" />
            <Bar dataKey="ordersDelivered" fill="#10b981" name="Entregadas" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function BranchTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white p-2 border rounded shadow text-sm">
      <p className="font-semibold">{row.branchName}</p>
      <p>Creadas: {row.ordersCreated}</p>
      <p>Entregadas: {row.ordersDelivered}</p>
      <p>Tasa de entrega: {(row.deliveryRate * 100).toFixed(1)}%</p>
      <p>≤ 7 días: {row.deliveredWithin7Days}</p>
      {row.avgDaysToDelivery != null && (
        <p>Promedio días: {row.avgDaysToDelivery.toFixed(1)}</p>
      )}
    </div>
  );
}

export default Dashboard;
