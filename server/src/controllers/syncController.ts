import { Request, Response } from 'express';
import { syncService } from '../services/sync/syncService';

export const getSyncStatus = (req: Request, res: Response) => {
  try {
    const status = syncService.getSyncStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const triggerSyncAll = async (req: Request, res: Response) => {
  try {
    const result = await syncService.syncAll();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const triggerSyncBranch = async (req: Request, res: Response) => {
  try {
    const branchId = Array.isArray(req.params.branchId) ? req.params.branchId[0] : req.params.branchId;
    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    const result = await syncService.syncBranch(branchId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSyncLogs = (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const logs = syncService.getSyncLogs(limit);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
