"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncLogs = exports.triggerSyncBranch = exports.triggerSyncAll = exports.getSyncStatus = void 0;
const syncService_1 = require("../services/sync/syncService");
const getSyncStatus = (req, res) => {
    try {
        const status = syncService_1.syncService.getSyncStatus();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSyncStatus = getSyncStatus;
const triggerSyncAll = async (req, res) => {
    try {
        const result = await syncService_1.syncService.syncAll();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.triggerSyncAll = triggerSyncAll;
const triggerSyncBranch = async (req, res) => {
    try {
        const branchId = Array.isArray(req.params.branchId) ? req.params.branchId[0] : req.params.branchId;
        if (!branchId) {
            return res.status(400).json({ error: 'Branch ID is required' });
        }
        const result = await syncService_1.syncService.syncBranch(branchId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.triggerSyncBranch = triggerSyncBranch;
const getSyncLogs = (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '50', 10);
        const logs = syncService_1.syncService.getSyncLogs(limit);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSyncLogs = getSyncLogs;
