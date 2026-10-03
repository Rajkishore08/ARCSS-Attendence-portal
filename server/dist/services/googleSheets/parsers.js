"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericParser = exports.OthersParser = exports.VivekanandhaParser = exports.NmcTrichyParser = exports.MaduraiParser = exports.BaseSpreadsheetParser = void 0;
exports.getParserForBranch = getParserForBranch;
class BaseSpreadsheetParser {
    branchId;
    constructor(branchId) {
        this.branchId = branchId;
    }
    parse(data) {
        const rawRows = data.values || [];
        if (rawRows.length === 0) {
            return { branchId: this.branchId, employees: [], attendanceRecords: [] };
        }
        const blocks = this.findTableBlocks(rawRows);
        if (blocks.length === 0) {
            console.warn(`[${this.branchId}] No table blocks identified in spreadsheet.`);
            return { branchId: this.branchId, employees: [], attendanceRecords: [] };
        }
        const employeeMap = new Map();
        const attendanceMap = new Map();
        for (const block of blocks) {
            for (let r = block.startDataRowIdx; r <= block.endDataRowIdx; r++) {
                const row = rawRows[r];
                if (!row || row.length === 0)
                    continue;
                const rawName = String(row[block.nameColIdx] || '').trim();
                if (!rawName)
                    continue;
                if (this.isNonEmployeeRow(rawName, row)) {
                    continue;
                }
                const employeeId = `${this.branchId}_${this.slugify(rawName)}`;
                const employeeCode = block.codeColIdx !== -1 && row[block.codeColIdx]
                    ? String(row[block.codeColIdx]).trim()
                    : `ARCS-${this.branchId.substring(0, 3).toUpperCase()}-${String(employeeMap.size + 1).padStart(3, '0')}`;
                const rawDesig = block.desigColIdx !== -1 && row[block.desigColIdx] !== undefined && typeof row[block.desigColIdx] === 'string'
                    ? String(row[block.desigColIdx]).trim()
                    : '';
                const rawReport = block.reportColIdx !== -1 && row[block.reportColIdx] !== undefined && typeof row[block.reportColIdx] === 'string'
                    ? String(row[block.reportColIdx]).trim()
                    : '';
                const rawWorkLink = block.workLinkColIdx !== -1 && row[block.workLinkColIdx] !== undefined && typeof row[block.workLinkColIdx] === 'string'
                    ? String(row[block.workLinkColIdx]).trim()
                    : '';
                let existingEmp = employeeMap.get(employeeId);
                if (!existingEmp) {
                    existingEmp = {
                        id: employeeId,
                        employeeCode,
                        name: rawName,
                        designation: rawDesig || this.getDefaultDesignation(this.branchId),
                        reportingTo: rawReport || 'Dr. Sasi Kumar (CSA)',
                        branchId: this.branchId,
                        workLink: rawWorkLink || '',
                        active: true,
                    };
                    employeeMap.set(employeeId, existingEmp);
                }
                else {
                    // Update details if fuller information is in subsequent blocks
                    if (rawDesig && (!existingEmp.designation || existingEmp.designation === 'Team Member')) {
                        existingEmp.designation = rawDesig;
                    }
                    if (rawReport && (!existingEmp.reportingTo || existingEmp.reportingTo === 'Manager')) {
                        existingEmp.reportingTo = rawReport;
                    }
                    if (rawWorkLink && !existingEmp.workLink) {
                        existingEmp.workLink = rawWorkLink;
                    }
                }
                // Parse date session columns for this block
                for (const dateCol of block.dateColumns) {
                    if (dateCol.colIdx < row.length) {
                        const rawVal = row[dateCol.colIdx];
                        const isPresent = this.parseBooleanValue(rawVal);
                        const entryTime = this.parseEntryTime(rawVal, dateCol.session, isPresent);
                        const recordId = `${employeeId}_${dateCol.date}_${dateCol.session}`;
                        attendanceMap.set(recordId, {
                            id: recordId,
                            employeeId,
                            branchId: this.branchId,
                            date: dateCol.date,
                            session: dateCol.session,
                            present: isPresent,
                            entryTime,
                            sourceSpreadsheetId: data.spreadsheetId,
                        });
                    }
                }
            }
        }
        return {
            branchId: this.branchId,
            employees: Array.from(employeeMap.values()),
            attendanceRecords: Array.from(attendanceMap.values()),
        };
    }
    parseEntryTime(rawVal, session, isPresent) {
        if (!isPresent)
            return null;
        if (typeof rawVal === 'string') {
            const timeMatch = rawVal.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/);
            if (timeMatch)
                return timeMatch[0];
        }
        return session === 'morning' ? '09:30 AM' : '05:30 PM';
    }
    getDefaultDesignation(branchId) {
        switch (branchId) {
            case 'madurai': return 'Program Coordinator';
            case 'nmc-trichy': return 'Operations Specialist';
            case 'vivekanandha': return 'Lab Project Lead';
            case 'others': return 'XRDT R&I Coordinator';
            default: return 'Team Member';
        }
    }
    findTableBlocks(rows) {
        const headerRowIndices = [];
        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (!row)
                continue;
            for (let c = 0; c < row.length; c++) {
                const val = String(row[c] || '').toLowerCase().trim();
                if (val === 'employee name' || val === 'name' || val === 'staff name') {
                    headerRowIndices.push(r);
                    break;
                }
            }
        }
        // If no explicit "Employee Name" row found, fallback to row 0 / 1
        if (headerRowIndices.length === 0 && rows.length > 0) {
            headerRowIndices.push(5 < rows.length ? 5 : 0);
        }
        const blocks = [];
        for (let b = 0; b < headerRowIndices.length; b++) {
            const headerRowIdx = headerRowIndices[b];
            const subHeaderRowIdx = headerRowIdx + 1 < rows.length ? headerRowIdx + 1 : headerRowIdx;
            const nextHeaderRowIdx = b + 1 < headerRowIndices.length ? headerRowIndices[b + 1] : rows.length;
            let nameColIdx = -1;
            let codeColIdx = -1;
            let desigColIdx = -1;
            let reportColIdx = -1;
            let workLinkColIdx = -1;
            const headerRow = rows[headerRowIdx] || [];
            const subHeaderRow = subHeaderRowIdx < rows.length ? rows[subHeaderRowIdx] : [];
            for (let c = 0; c < headerRow.length; c++) {
                const val = String(headerRow[c] || '').toLowerCase().trim();
                if (val === 'employee name' || val === 'name' || val === 'staff name') {
                    nameColIdx = c;
                }
                else if (val === 'employee code' || val === 'emp id' || val === 'emp code' || val === 'id') {
                    codeColIdx = c;
                }
                else if (val === 'designation' || val === 'role' || val === 'title') {
                    desigColIdx = c;
                }
                else if (val === 'reporting to' || val === 'reporting manager' || val === 'supervisor') {
                    reportColIdx = c;
                }
                else if (val.includes('works done') || val.includes('work link') || val.includes('work log') || val.includes('task link')) {
                    workLinkColIdx = c;
                }
            }
            if (nameColIdx === -1) {
                nameColIdx = 1;
                desigColIdx = 2;
                reportColIdx = 3;
                workLinkColIdx = 4;
            }
            // Detect date columns
            const dateColumns = [];
            let currentDate = '';
            for (let c = 0; c < Math.max(headerRow.length, subHeaderRow.length); c++) {
                const headerCell = String(headerRow[c] || '').trim();
                const subHeaderCell = String(subHeaderRow[c] || '').trim().toLowerCase();
                const dateMatch = headerCell.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
                if (dateMatch) {
                    currentDate = this.normalizeDate(dateMatch[0]);
                }
                if (currentDate) {
                    let session = 'morning';
                    if (subHeaderCell.includes('pm') || subHeaderCell.includes('eve') || subHeaderCell.includes('evening') || subHeaderCell.includes('afternoon')) {
                        session = 'evening';
                    }
                    else if (subHeaderCell.includes('am') || subHeaderCell.includes('morn') || subHeaderCell.includes('morning')) {
                        session = 'morning';
                    }
                    else {
                        const lastCol = dateColumns[dateColumns.length - 1];
                        if (lastCol && lastCol.date === currentDate && lastCol.session === 'morning') {
                            session = 'evening';
                        }
                        else {
                            session = 'morning';
                        }
                    }
                    dateColumns.push({
                        date: currentDate,
                        session,
                        colIdx: c,
                    });
                }
            }
            const startDataRowIdx = subHeaderRowIdx + 1;
            let endDataRowIdx = nextHeaderRowIdx - 1;
            // Ensure we don't go past the bounds
            if (endDataRowIdx >= rows.length) {
                endDataRowIdx = rows.length - 1;
            }
            blocks.push({
                headerRowIdx,
                subHeaderRowIdx,
                nameColIdx,
                codeColIdx,
                desigColIdx,
                reportColIdx,
                workLinkColIdx,
                dateColumns,
                startDataRowIdx,
                endDataRowIdx,
            });
        }
        return blocks;
    }
    isNonEmployeeRow(name, row) {
        const lower = name.toLowerCase();
        const nonEmployeeKeywords = [
            'subtotal',
            'sub total',
            'grand total',
            'network total',
            'total active',
            'total sessions',
            'attendance rate',
            'master network',
            'branch summary',
            'present sessions',
            'expected sessions',
            'total present',
            's.no',
            'employee name',
            'employee code',
            'designation',
            'link for works done',
        ];
        for (const kw of nonEmployeeKeywords) {
            if (lower.includes(kw))
                return true;
        }
        if (/^total\b/i.test(lower))
            return true;
        return false;
    }
    normalizeDate(raw) {
        const cleaned = raw.replace(/\//g, '-');
        const parts = cleaned.split('-');
        if (parts[0].length === 4) {
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        else {
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2];
            return `${y}-${m}-${d}`;
        }
    }
    parseBooleanValue(val) {
        if (val === true || val === 1 || val === '1')
            return true;
        if (val === false || val === 0 || val === '0' || val === null || val === undefined)
            return false;
        const s = String(val).toLowerCase().trim();
        return s === 'true' || s === 'p' || s === 'present' || s === 'yes' || s === 'y' || s === '✓' || s === '1';
    }
    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
}
exports.BaseSpreadsheetParser = BaseSpreadsheetParser;
class MaduraiParser extends BaseSpreadsheetParser {
    constructor() {
        super('madurai');
    }
}
exports.MaduraiParser = MaduraiParser;
class NmcTrichyParser extends BaseSpreadsheetParser {
    constructor() {
        super('nmc-trichy');
    }
}
exports.NmcTrichyParser = NmcTrichyParser;
class VivekanandhaParser extends BaseSpreadsheetParser {
    constructor() {
        super('vivekanandha');
    }
}
exports.VivekanandhaParser = VivekanandhaParser;
class OthersParser extends BaseSpreadsheetParser {
    constructor() {
        super('others');
    }
}
exports.OthersParser = OthersParser;
class GenericParser extends BaseSpreadsheetParser {
    constructor(branchId) {
        super(branchId);
    }
}
exports.GenericParser = GenericParser;
function getParserForBranch(branchId) {
    switch (branchId) {
        case 'madurai':
            return new MaduraiParser();
        case 'nmc-trichy':
            return new NmcTrichyParser();
        case 'vivekanandha':
            return new VivekanandhaParser();
        case 'others':
            return new OthersParser();
        default:
            return new GenericParser(branchId);
    }
}
