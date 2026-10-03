"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const handler = function (req, res) {
    return (0, app_1.default)(req, res);
};
module.exports = handler;
module.exports.default = handler;
