"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHoliday = exports.addHoliday = exports.getHolidays = exports.updateRules = exports.getRules = void 0;
const db_1 = require("../database/db");
const getRules = (req, res) => {
    try {
        const rules = db_1.db.prepare('SELECT id, name, min_percentage as minPercentage, max_percentage as maxPercentage, color, description FROM attendance_rules ORDER BY min_percentage DESC').all();
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getRules = getRules;
const updateRules = (req, res) => {
    try {
        const { rules } = req.body;
        if (!Array.isArray(rules)) {
            return res.status(400).json({ error: 'Rules must be an array' });
        }
        const updateStmt = db_1.db.prepare(`
      UPDATE attendance_rules 
      SET min_percentage = @minPercentage, max_percentage = @maxPercentage, color = @color, description = @description
      WHERE id = @id
    `);
        const updateTx = db_1.db.transaction(() => {
            for (const r of rules) {
                updateStmt.run(r);
            }
        });
        updateTx();
        const updated = db_1.db.prepare('SELECT id, name, min_percentage as minPercentage, max_percentage as maxPercentage, color, description FROM attendance_rules ORDER BY min_percentage DESC').all();
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateRules = updateRules;
const getHolidays = (req, res) => {
    try {
        const holidays = db_1.db.prepare(`
      SELECT h.id, h.date, h.name, h.branch_id as branchId, b.name as branchName 
      FROM holidays h 
      LEFT JOIN branches b ON h.branch_id = b.id 
      ORDER BY h.date ASC
    `).all();
        res.json(holidays);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getHolidays = getHolidays;
const addHoliday = (req, res) => {
    try {
        const { date, name, branchId } = req.body;
        if (!date || !name) {
            return res.status(400).json({ error: 'Date and name are required' });
        }
        const id = `hol_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        db_1.db.prepare(`
      INSERT INTO holidays (id, date, name, branch_id)
      VALUES (?, ?, ?, ?)
    `).run(id, date, name, branchId || null);
        res.json({ id, date, name, branchId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addHoliday = addHoliday;
const deleteHoliday = (req, res) => {
    try {
        const { id } = req.params;
        db_1.db.prepare('DELETE FROM holidays WHERE id = ?').run(id);
        res.json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteHoliday = deleteHoliday;
