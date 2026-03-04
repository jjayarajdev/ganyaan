import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_DIR } from '../shared/constants';

function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), APP_DATA_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getChatHistoryDir(): string {
  const dir = path.join(getDataDir(), 'chat-history');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function readJson<T>(filename: string, defaultValue: T): T {
  const filepath = path.join(getDataDir(), filename);
  try {
    if (!fs.existsSync(filepath)) return defaultValue;
    const raw = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJson(filename: string, data: unknown): void {
  const filepath = path.join(getDataDir(), filename);
  const tmpPath = filepath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filepath);
}

export function readChatHistory(chapterId: string): unknown[] {
  const filepath = path.join(getChatHistoryDir(), `${chapterId}.json`);
  try {
    if (!fs.existsSync(filepath)) return [];
    const raw = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeChatHistory(chapterId: string, messages: unknown[]): void {
  const filepath = path.join(getChatHistoryDir(), `${chapterId}.json`);
  const tmpPath = filepath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(messages, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filepath);
}
