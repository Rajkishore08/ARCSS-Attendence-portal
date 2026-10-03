import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Auto-detect service-account.json from env var or file
let fileCredentials: any = null;

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    fileCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    console.log('🔑 Loaded Google credentials from GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
  } catch (e) {
    console.warn('⚠️ Error parsing GOOGLE_SERVICE_ACCOUNT_JSON env variable:', e);
  }
}

if (!fileCredentials) {
  const possibleKeyFiles = [
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'credentials.json'),
    path.resolve(process.cwd(), 'server/service-account.json'),
    path.resolve(process.cwd(), 'server/credentials.json'),
    path.resolve(__dirname, '../../service-account.json'),
  ];

  for (const keyPath of possibleKeyFiles) {
    if (fs.existsSync(keyPath)) {
      try {
        fileCredentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        console.log(`🔑 Loaded Google credentials from: ${keyPath}`);
        break;
      } catch (e) {
        console.warn(`⚠️ Error reading ${keyPath}:`, e);
      }
    }
  }
}

const serviceAccountEmail = fileCredentials?.client_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const privateKey = fileCredentials?.private_key || (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const apiKey = process.env.GOOGLE_API_KEY || '';
const projectId = fileCredentials?.project_id || process.env.GOOGLE_PROJECT_ID || '';

// If credentials exist, allow live sync unless explicitly set to mock
const hasCredentials = Boolean(serviceAccountEmail && privateKey) || Boolean(apiKey);
const useMockData = process.env.USE_MOCK_DATA !== undefined
  ? process.env.USE_MOCK_DATA === 'true'
  : !hasCredentials;

const isVercel = process.env.VERCEL === '1';
const rootDir = fs.existsSync(path.resolve(process.cwd(), 'client')) 
  ? process.cwd() 
  : path.resolve(process.cwd(), '..');

const defaultDbPath = isVercel
  ? '/tmp/arcs_attendance.sqlite'
  : path.resolve(rootDir, 'arcs_attendance.sqlite');

const resolvedDbUrl = process.env.DATABASE_URL
  ? (path.isAbsolute(process.env.DATABASE_URL) ? process.env.DATABASE_URL : path.resolve(rootDir, process.env.DATABASE_URL))
  : defaultDbPath;

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  databaseUrl: resolvedDbUrl,
  useMockData,
  isVercel,
  syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
  timezone: 'Asia/Kolkata',

  google: {
    serviceAccountEmail,
    privateKey,
    apiKey,
    projectId,
    hasCredentials,
  },

  branches: [
    {
      id: 'madurai',
      name: 'Madurai',
      code: 'MDU',
      spreadsheetId: process.env.GOOGLE_SHEET_ID_MADURAI || '1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY',
      sheetName: 'Madurai',
      color: '#0284c7',
    },
    {
      id: 'nmc-trichy',
      name: 'NMC - Trichy',
      code: 'NMC',
      spreadsheetId: process.env.GOOGLE_SHEET_ID_NMC_TRICHY || '15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ',
      sheetName: 'Trichy',
      color: '#10b981',
    },
    {
      id: 'vivekanandha',
      name: 'Vivekanandha College - Thiruchengode',
      code: 'VIV',
      spreadsheetId: process.env.GOOGLE_SHEET_ID_VIVEKANANDHA || '1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw',
      sheetName: 'Vivekanandha',
      color: '#8b5cf6',
    },
    {
      id: 'others',
      name: 'Others',
      code: 'OTH',
      spreadsheetId: process.env.GOOGLE_SHEET_ID_OTHERS || '1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI',
      sheetName: 'Others',
      color: '#f59e0b',
    },
  ],
};
