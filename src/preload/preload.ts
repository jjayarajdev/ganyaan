import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { ChatSendRequest, ChatMessage, ProgressData, SettingsData, StreamEndPayload, ElectronAPI } from '../shared/types';

const api: ElectronAPI = {
  sendMessage: (request: ChatSendRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, request),

  onStreamChunk: (callback: (chunk: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_CHUNK, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_CHUNK, handler);
  },

  onStreamEnd: (callback: (payload: StreamEndPayload) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: StreamEndPayload) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_END, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_END, handler);
  },

  onStreamError: (callback: (error: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM_ERROR, handler);
  },

  loadChatHistory: (chapterId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_LOAD_HISTORY, chapterId) as Promise<ChatMessage[]>,

  saveChatHistory: (chapterId: string, messages: ChatMessage[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SAVE_HISTORY, chapterId, messages) as Promise<void>,

  loadProgress: () =>
    ipcRenderer.invoke(IPC_CHANNELS.PROGRESS_LOAD) as Promise<ProgressData>,

  saveProgress: (data: ProgressData) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROGRESS_SAVE, data) as Promise<void>,

  loadSettings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_LOAD) as Promise<SettingsData>,

  saveSettings: (data: SettingsData) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE, data) as Promise<void>,
};

contextBridge.exposeInMainWorld('electronAPI', api);
