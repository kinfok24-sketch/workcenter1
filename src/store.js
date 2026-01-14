/**
 * Attendance Tracker Store
 * Handles data persistence and state management.
 */

const STORAGE_KEY = 'attendance_tracker_v1';

const defaultStatusTypes = [
    { id: 'late', label: 'Late Arrival', color: 'var(--status-late)' },
    { id: 'absent', label: 'Absent', color: 'var(--status-absent)' },
    { id: 'short_leave', label: 'Short Leave', color: 'var(--status-short-leave)' },
    { id: 'night_shift', label: 'Night Shift', color: 'var(--status-night-shift)' }
];

const defaultData = {
    employees: [],
    attendance: {}, // { employeeId: { "YYYY-MM-DD": { statuses: [] } } }
    statusTypes: [...defaultStatusTypes]
};

export const store = {
    data: loadData(),

    getEmployees() {
        return this.data.employees;
    },

    getStatusTypes() {
        // Ensure statusTypes exists (migration)
        if (!this.data.statusTypes) {
            this.data.statusTypes = [...defaultStatusTypes];
            this.save();
        }
        return this.data.statusTypes;
    },

    addStatusType(label, color) {
        const id = label.toLowerCase().replace(/\s+/g, '_');
        if (this.data.statusTypes.find(s => s.id === id)) return; // No dups
        this.data.statusTypes.push({ id, label, color });
        this.save();
    },

    deleteStatusType(id) {
        // Prevent deleting default types if desired, but user asked to delete "new statuses".
        // Let's protect defaults just in case? Or assume user is admin.
        // User asked "delete new statuses".
        const defaults = defaultStatusTypes.map(s => s.id);
        if (defaults.includes(id)) return; // Protect defaults

        this.data.statusTypes = this.data.statusTypes.filter(s => s.id !== id);
        this.save();
    },

    addEmployee(name, role) {
        const id = crypto.randomUUID();
        this.data.employees.push({ id, name, role, department: 'General' });
        this.save();
        return id;
    },

    removeEmployee(id) {
        this.data.employees = this.data.employees.filter(e => e.id !== id);
        delete this.data.attendance[id];
        this.save();
    },

    // Legacy support: convert single status to array
    getAttendance(employeeId) {
        const record = this.data.attendance[employeeId] || {};
        // Runtime migration validation
        Object.keys(record).forEach(date => {
            if (record[date].status) {
                record[date].statuses = [record[date].status]; // Migrate
                delete record[date].status;
            }
            if (!record[date].statuses) {
                record[date].statuses = [];
            }
        });
        return record;
    },

    // Toggle a status for a specific date (Multi-select)
    toggleAttendanceStatus(employeeId, dateStr, statusId) {
        if (!this.data.attendance[employeeId]) {
            this.data.attendance[employeeId] = {};
        }

        let entry = this.data.attendance[employeeId][dateStr];

        // Initialize if empty
        if (!entry) {
            entry = { statuses: [] };
            this.data.attendance[employeeId][dateStr] = entry;
        }

        // Handle legacy data migration on write
        if (entry.status) {
            entry.statuses = [entry.status];
            delete entry.status;
        }
        if (!entry.statuses) {
            entry.statuses = [];
        }

        // Toggle logic
        if (entry.statuses.includes(statusId)) {
            entry.statuses = entry.statuses.filter(s => s !== statusId);
        } else {
            entry.statuses.push(statusId);
        }

        // Cleanup empty entries to keep data clean
        if (entry.statuses.length === 0) {
            delete this.data.attendance[employeeId][dateStr];
        }

        this.save();
    },

    // Clear all status for a day
    clearAttendance(employeeId, dateStr) {
        if (this.data.attendance[employeeId] && this.data.attendance[employeeId][dateStr]) {
            delete this.data.attendance[employeeId][dateStr];
            this.save();
        }
    },

    // Cylinder Management
    addCylinder(brand, tNo, gears, count, sizeMM, distortion) {
        if (!this.data.cylinders) this.data.cylinders = [];
        const id = crypto.randomUUID();
        this.data.cylinders.push({ id, brand, tNo, gears, count, sizeMM, distortion });
        this.save();
    },

    removeCylinder(id) {
        if (!this.data.cylinders) return;
        this.data.cylinders = this.data.cylinders.filter(c => c.id !== id);
        this.save();
    },

    getCylinders() {
        return this.data.cylinders || [];
    },

    // Legacy method shim for compatibility (though we'll update UI)
    markAttendance(employeeId, dateStr, statusId) {
        // If statusId is null, clear
        if (!statusId) {
            this.clearAttendance(employeeId, dateStr);
            return;
        }
        // Otherwise, this behaves as "Set Only This Status" (Exclusive)
        if (!this.data.attendance[employeeId]) {
            this.data.attendance[employeeId] = {};
        }
        this.data.attendance[employeeId][dateStr] = { statuses: [statusId] };
        this.save();
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
};

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        // Basic migration check
        if (!parsed.statusTypes) {
            parsed.statusTypes = [...defaultStatusTypes];
        }
        return parsed;
    }
    return JSON.parse(JSON.stringify(defaultData));
}
