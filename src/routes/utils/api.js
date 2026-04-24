import axios from 'axios';
import SERVER from '../server';

/**
 * Helper para consumir endpoints de /api/v2/* con el JWT que guardamos
 * en localStorage.token al loguearse (ver Login.js).
 *
 * Uso:
 *   const res = await v2Get('/dashboard/top-problems', { from, to, limit: 10 });
 *   const items = res.data.items;
 *
 * Si no hay token, la request se manda sin Authorization header y el
 * backend responde 401 — el caller puede detectar eso y redirigir a /login.
 */
export async function v2Get(path, params = {}) {
  const token = localStorage.getItem('token');
  return axios.get(`${SERVER}/v2${path}`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function v2Post(path, body) {
  const token = localStorage.getItem('token');
  return axios.post(`${SERVER}/v2${path}`, body, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function v2Patch(path, body) {
  const token = localStorage.getItem('token');
  return axios.patch(`${SERVER}/v2${path}`, body, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function v2Delete(path) {
  const token = localStorage.getItem('token');
  return axios.delete(`${SERVER}/v2${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Indica si el user actual es admin (tiene permiso `branches:view_all`).
 * Se usa para mostrar selectores de sucursal en páginas como Dashboard.
 */
export function isAdmin() {
  const permisos = localStorage.getItem('permisos') ?? '';
  return permisos.includes('branches:view_all');
}
