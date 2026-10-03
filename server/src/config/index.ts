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

const DEFAULT_SERVICE_ACCOUNT = {
  client_email: "arcs-attendance-reader@arcs-attendance-portal.iam.gserviceaccount.com",
  project_id: "arcs-attendance-portal",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDlxz+0vxeznFeq\nZjjGeLNArDyUxXeX8Uxdh/++Ewcfiq3cWGWlA8rT/OpDn4ieaT2ev3nZNYShcXR7\ntY7KZPoulv5s+yGk5sh9dv1ret15QOZ0FX+3UV4Tk4jhNC8vjtZZ0SIZrCflLfDc\n1BTsFk+df8i5icTLrwWXP1/UOjsrBXRa8eQ/+QqhyAHBH4U7BkW00JPJ4js65CWh\nKB4CCc+dwSPmEYbCg0n9oCAfIZsUfMwdK9QaKzdCA28IGmam4/WEXUEqvkIXdRGI\nJC3uiBZqu93oQ9Fypwa8lOtbooTLop4WAqFx3oiJYWNFpzyu0TciO9k813ZYS99z\n+vt/iGrlAgMBAAECggEABB9CPmqMZDP8HKBcPC9CvZIso6Y0byNGJL1n8jYVxodh\n3a/Je9LcF756fP95+Q5Xq41+BAGiR5UpKxj50hnkPrBSj/KKl9860VYwbw+tG0JC\ngB2f0dJhw8WKfjCSxVS+KRSH4WCfXJl2fNFIyM123MZdYi3qO/v/t5PMkwDMByME\nTjwlN1Roy5SsTiiXlZY96lkpEDPiGnJRP0QLYcu1q1czhdMPhHN4p0jeW5z56z/x\nnj+7TTFzVqmB309hQCq3LRAGQSwkWkzTvqcBsTnGZoiq3j+x1b1TsiR8RJ358Igt\nXzv4sZVIlgGHdTBiXzYKfEfhPuRNilrgfMjSn64UtwKBgQD7lud0XwvHO2q4uFcy\nYqPEw/LoqZOWj5XNu2QQ6YMIUAmhi9wXQ/GkCPTvDSF+D8LthMRtXynN6sa8BLr0\nPNm2CUO+gLFVuOlJdVeNmEiQHlY5fUrXS/yW7wl9A4Kau9BKs7jmXWQ87wGcZMIo\nJMgIEl+12KxYrdLT5LB632c3zwKBgQDpznWkcnXem+R2g4vecdKCjeg5+TDEhLew\nSG1FMwcO7hGkDadvuzwH5+0MsIJ4B3pLr5q75++uKpyV60Hi0xYgnBZqKzzohyM7\nyUzNOninkUw7M3pimD+l5ZZnKH6kS5aZGkVkQQ35oA3N/qavB1J6DDstWSlup0/R\nNo8GNcLrCwKBgC0EyK/THhltcWBSZA/5BJL9+SZWybkEQmsI4BQCpNbE86Q7kYt8\nNe4DSEjKUbbr/RZhToC/qYxWOW+FbSqtBMwFBmE9R/4t01i4rY0BteJL+2PYHp89\n0pnzdgAvs5wahWAInsph5cDdh61DflaOlliTaRryBYzstbAC2O1zslWTAoGBAMYF\nOJoI30+k1QCTNVk3KcWtDqxbIzSt+y1wiit7plS8yXAaqF73Q0am5ZxDupySKMAF\ngJX5QIRQTsKit/C2Ox1vVYSiDjoainrOaR/AkAPMCbZySQtMS0vkgVfpcikQZAJT\nv8XDW2S6bDa1oNLI7s+zoEMuKusvBWj6PnRSAD41AoGBAJyqsfIK5PeQF7P+OgRw\nPLTI7aKCrAoyMQA7Ba1H9JhbVEd4oSdrWE3W/ARYsWoaHb97eenGmohckEElbXgC\n0LgUuhyOTMNsfhF6lC5daud/VvBQmoOD8Mw0ivqQfj1GzOMjE8jPI+mjT/wXphyo\nOJ5rjnKm+MxaXdyMHdUh5BIK\n-----END PRIVATE KEY-----\n"
};

const serviceAccountEmail = fileCredentials?.client_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || DEFAULT_SERVICE_ACCOUNT.client_email;
const privateKey = (fileCredentials?.private_key || process.env.GOOGLE_PRIVATE_KEY || DEFAULT_SERVICE_ACCOUNT.private_key).replace(/\\n/g, '\n');
const apiKey = process.env.GOOGLE_API_KEY || '';
const projectId = fileCredentials?.project_id || process.env.GOOGLE_PROJECT_ID || DEFAULT_SERVICE_ACCOUNT.project_id;

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
