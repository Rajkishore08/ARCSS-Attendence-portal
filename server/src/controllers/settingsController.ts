import { Request, Response } from 'express';
import { db } from '../database/db';

export const getRules = (req: Request, res: Response) => {
  try {
    const rules = db.prepare('SELECT id, name, min_percentage as minPercentage, max_percentage as maxPercentage, color, description FROM attendance_rules ORDER BY min_percentage DESC').all();
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRules = (req: Request, res: Response) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Rules must be an array' });
    }

    const updateStmt = db.prepare(`
      UPDATE attendance_rules 
      SET min_percentage = @minPercentage, max_percentage = @maxPercentage, color = @color, description = @description
      WHERE id = @id
    `);

    const updateTx = db.transaction(() => {
      for (const r of rules) {
        updateStmt.run(r);
      }
    });
    updateTx();

    const updated = db.prepare('SELECT id, name, min_percentage as minPercentage, max_percentage as maxPercentage, color, description FROM attendance_rules ORDER BY min_percentage DESC').all();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHolidays = (req: Request, res: Response) => {
  try {
    const holidays = db.prepare(`
      SELECT h.id, h.date, h.name, h.branch_id as branchId, b.name as branchName 
      FROM holidays h 
      LEFT JOIN branches b ON h.branch_id = b.id 
      ORDER BY h.date ASC
    `).all();
    res.json(holidays);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addHoliday = (req: Request, res: Response) => {
  try {
    const { date, name, branchId } = req.body;
    if (!date || !name) {
      return res.status(400).json({ error: 'Date and name are required' });
    }

    const id = `hol_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO holidays (id, date, name, branch_id)
      VALUES (?, ?, ?, ?)
    `).run(id, date, name, branchId || null);

    res.json({ id, date, name, branchId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHoliday = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM holidays WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
