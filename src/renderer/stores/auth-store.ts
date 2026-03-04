import { create } from 'zustand';
import type { User, CreateUserRequest, UserRole } from '../../shared/types';

interface AuthStore {
  currentUser: User | null;
  users: User[];
  loaded: boolean;

  loadUsers: () => Promise<void>;
  createUser: (request: CreateUserRequest) => Promise<User>;
  login: (userId: number, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  linkStudent: (studentId: number) => Promise<void>;
  getLinkedStudents: () => Promise<User[]>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  users: [],
  loaded: false,

  loadUsers: async () => {
    const users = await window.electronAPI.listUsers();
    set({ users, loaded: true });
  },

  createUser: async (request: CreateUserRequest) => {
    const user = await window.electronAPI.createUser(request);
    set(state => ({ users: [...state.users, user] }));
    return user;
  },

  login: async (userId: number, pin?: string) => {
    const result = await window.electronAPI.loginUser({ userId, pin });
    if (result.success) {
      const user = await window.electronAPI.getUser(userId);
      set({ currentUser: user });
    }
    return result;
  },

  logout: () => {
    set({ currentUser: null });
  },

  linkStudent: async (studentId: number) => {
    const { currentUser } = get();
    if (!currentUser) return;
    await window.electronAPI.linkStudent(studentId, currentUser.id);
  },

  getLinkedStudents: async () => {
    const { currentUser } = get();
    if (!currentUser) return [];
    return window.electronAPI.getLinkedStudents(currentUser.id);
  },
}));
