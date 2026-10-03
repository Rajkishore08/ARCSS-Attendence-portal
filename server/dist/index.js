"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const app_1 = __importDefault(require("./app"));
exports.app = app_1.default;
const index_1 = require("./config/index");
const syncService_1 = require("./services/sync/syncService");
const port = process.env.PORT || index_1.config.port || 5001;
app_1.default.listen(port, () => {
    console.log(`🚀 ARCS Attendance Server running on port ${port}`);
    console.log(`📊 Live Google Sheets Mode Active`);
    setImmediate(async () => {
        try {
            console.log('📡 Starting background live sync with Google Sheets for all 4 branches...');
            await syncService_1.syncService.syncAll();
            console.log('✅ Live sync with Google Sheets completed successfully.');
        }
        catch (err) {
            console.error('Live sync error:', err.message);
        }
    });
});
exports.default = app_1.default;
