import axios from 'axios';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── AXIOS INSTANCE ────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('bilsem_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('bilsem_token');
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── AUTH STORE ────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  avatar?: string;
  teacher?: { id: string; institution: string; title?: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        Cookies.set('bilsem_token', token, { expires: 7, secure: true, sameSite: 'strict' });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove('bilsem_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    { name: 'bilsem-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) },
  ),
);

// ─── API SERVICES ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
};

export const studentsApi = {
  list: (groupId?: string) => api.get('/students', { params: { groupId } }),
  get: (id: string) => api.get(`/students/${id}`),
  analytics: (id: string) => api.get(`/students/${id}/analytics`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  stats: () => api.get('/students/stats'),
};

export const groupsApi = {
  list: () => api.get('/groups'),
  get: (id: string) => api.get(`/groups/${id}`),
  stats: (id: string) => api.get(`/groups/${id}/stats`),
  create: (data: any) => api.post('/groups', data),
  update: (id: string, data: any) => api.put(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  assignStudents: (id: string, studentIds: string[]) =>
    api.post(`/groups/${id}/students`, { studentIds }),
  addStudent: (id: string, studentId: string) =>
    api.post(`/groups/${id}/students/${studentId}`),
  removeStudent: (id: string, studentId: string) =>
    api.delete(`/groups/${id}/students/${studentId}`),
};

export const activitiesApi = {
  list: (params?: any) => api.get('/activities', { params }),
  get: (id: string) => api.get(`/activities/${id}`),
  modules: (level?: string) => api.get('/activities/modules', { params: { level } }),
  logs: (params?: any) => api.get('/activities/logs', { params }),
  log: (data: any) => api.post('/activities/log', data),
  top: () => api.get('/activities/top'),
};

export const questionsApi = {
  list: (params?: any) => api.get('/questions', { params }),
  get: (id: string) => api.get(`/questions/${id}`),
  create: (data: any) => api.post('/questions', data),
  createBulk: (questions: any[]) => api.post('/questions/bulk', { questions }),
  update: (id: string, data: any) => api.put(`/questions/${id}`, data),
  delete: (id: string) => api.delete(`/questions/${id}`),
  toggleFavorite: (id: string) => api.post(`/questions/${id}/favorite`),
  stats: () => api.get('/questions/stats'),
  topics: () => api.get('/questions/topics'),
};

export const feedbackApi = {
  list: (studentId?: string) => api.get('/feedback', { params: { studentId } }),
  create: (data: any) => api.post('/feedback', data),
  update: (id: string, data: any) => api.put(`/feedback/${id}`, data),
  send: (id: string) => api.post(`/feedback/${id}/send`),
  generateAI: (studentId: string, period: string) =>
    api.post('/feedback/generate-ai', { studentId, period }),
  addObservation: (data: any) => api.post('/feedback/observation', data),
  getObservations: (studentId: string) => api.get(`/feedback/observations/${studentId}`),
};

export const plansApi = {
  list: () => api.get('/plans'),
  get: (id: string) => api.get(`/plans/${id}`),
  create: (data: any) => api.post('/plans', data),
  generateAI: (data: any) => api.post('/plans/generate-ai', data),
  addItem: (id: string, data: any) => api.post(`/plans/${id}/items`, data),
  removeItem: (id: string, itemId: string) => api.delete(`/plans/${id}/items/${itemId}`),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  student: (id: string, period?: string) =>
    api.get(`/reports/student/${id}`, { params: { period } }),
  group: (id: string, period?: string) =>
    api.get(`/reports/group/${id}`, { params: { period } }),
};

export const aiApi = {
  generateQuestions: (data: any) => api.post('/ai/generate-questions', data),
  generatePlan: (data: any) => api.post('/ai/generate-plan', data),
  analyzeText: (text: string) => api.post('/ai/analyze-text', { text }),
};

export const usersApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  notes: () => api.get('/users/notes'),
  createNote: (data: any) => api.post('/users/notes', data),
  updateNote: (id: string, data: any) => api.put(`/users/notes/${id}`, data),
  pinNote: (id: string) => api.put(`/users/notes/${id}/pin`),
};
