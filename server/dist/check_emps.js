"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./database/db");
const allEmps = db_1.db.prepare('SELECT id, name, branch_id, active FROM employees').all();
console.log('All employees in DB currently:');
console.table(allEmps);
