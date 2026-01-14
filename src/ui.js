import { store } from './store.js';

// State
let currentDate = new Date();
let selectedEmployeeId = null;

// DOM Helpers
const getEl = (id) => document.getElementById(id);

export function initUI() {
  if (!getEl('main-content')) {
    console.error('Critical: DOM not ready when initUI called');
    return;
  }
  renderApp();
  setupGlobalListeners();
}

function setupGlobalListeners() {
  document.body.addEventListener('click', (e) => {
    const modalOverlay = getEl('modal-overlay');

    // 1. Navigation
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      navItem.classList.add('active');
      const page = navItem.dataset.page;

      if (page === 'dashboard') {
        selectedEmployeeId = null;
        renderApp();
      } else if (page === 'calculator') {
        renderCalculator();
      } else if (page === 'cylinders') {
        renderCylinders();
      }
      return;
    }

    if (e.target.closest('#add-employee-btn')) {
      openAddEmployeeModal();
      return;
    }

    // 2.5 Add Cylinder
    if (e.target.closest('#add-cylinder-btn')) {
      openAddCylinderModal();
      return;
    }

    // 2.6 Delete Cylinder
    const delCylBtn = e.target.closest('.delete-cylinder-btn');
    if (delCylBtn) {
      if (confirm('Delete this cylinder?')) {
        store.removeCylinder(delCylBtn.dataset.id);
        renderCylinders();
      }
      return;
    }

    // 3. Delete Employee
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      const emp = store.getEmployees().find(e => e.id === id);
      if (emp && confirm(`Delete ${emp.name}?`)) {
        store.removeEmployee(id);
        renderApp();
      }
      return;
    }

    // 4. Employee Card
    const empCard = e.target.closest('.employee-card');
    if (empCard && !selectedEmployeeId) {
      if (empCard.dataset.id) {
        selectedEmployeeId = empCard.dataset.id;
        renderApp();
      }
      return;
    }

    // 5. Back Button
    if (e.target.closest('#back-btn')) {
      selectedEmployeeId = null;
      renderApp();
      return;
    }

    // 6. Month Nav
    if (e.target.closest('#prev-month')) {
      changeMonth(-1);
      return;
    }
    if (e.target.closest('#next-month')) {
      changeMonth(1);
      return;
    }

    // 7. Day Cell
    const dayCell = e.target.closest('.day-cell');
    if (dayCell && selectedEmployeeId) {
      const dateStr = dayCell.dataset.date;
      if (dateStr) openStatusModal(selectedEmployeeId, dateStr);
      return;
    }

    // 8. Delete Status Type
    const delStatusBtn = e.target.closest('.delete-status-type-btn');
    if (delStatusBtn) {
      e.stopPropagation(); // prevent adding status
      const typeId = delStatusBtn.dataset.id;
      if (confirm('Delete this status type?')) {
        store.deleteStatusType(typeId);
        // Re-render modal to reflect removal
        // We need to access the current modal context (empId, dateStr)
        // Storing them in dataset of modal-content for easier access
        const modalContent = getEl('modal-content');
        if (modalContent.dataset.empId && modalContent.dataset.dateStr) {
          openStatusModal(modalContent.dataset.empId, modalContent.dataset.dateStr);
        }
        renderApp();
        return;
      }
    }

    // 9. Modal Close
    if (e.target === modalOverlay || e.target.closest('#cancel-btn') || e.target.closest('#close-modal-btn')) {
      closeModal();
      return;
    }
  });
}

function renderApp() {
  const mainContent = getEl('main-content');
  if (!mainContent) return;
  // Check if we are in calculator mode via active class or just force render? 
  // Better simplicity: if sidebar says calculator is active, render calculator. 
  // But navigation click handler calls functions directly.
  // renderApp implies "Attendace Tracker App". 

  // Note: If calculator is active, verify UI state. 
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav && activeNav.dataset.page === 'calculator') {
    renderCalculator();
    return;
  } else if (activeNav && activeNav.dataset.page === 'cylinders') {
    renderCylinders();
    return;
  }

  mainContent.innerHTML = '';

  if (!selectedEmployeeId) {
    renderDashboard(mainContent);
  } else {
    renderEmployeeDetail(mainContent);
  }
}

function renderCalculator() {
  const mainContent = getEl('main-content');
  if (!mainContent) return;

  // Inline the calculator HTML/CSS/JS logic
  // We can inject the exact style and html from satin calculator.html
  // But scoped to main-content so it doesn't break global styles.
  // Given the simplicity, we'll re-implement cleanly.

  mainContent.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; padding-top: 40px;">
        <div class="calculator" style="background: white; padding: 40px; border-radius: 20px; box-shadow: var(--shadow-md);">
            <h1 style="color: var(--accent-color); text-align: center; font-size: 2rem; margin-bottom: 24px;">📏 Roll Calculator</h1>
            
            <div class="input-group" style="margin-bottom: 24px;">
                <label style="display:block; margin-bottom: 8px; font-weight: 600;">Order Quantity (Pieces)</label>
                <input type="number" id="calc-qty" placeholder="e.g. 150000" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;">
            </div>

            <div class="input-group" style="margin-bottom: 24px;">
                <label style="display:block; margin-bottom: 8px; font-weight: 600;">Unit Length (mm)</label>
                <input type="number" id="calc-len" placeholder="e.g. 75" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;">
            </div>

            <button id="do-calc-btn" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem;">Calculate Rolls</button>

            <div id="calc-result" style="margin-top: 32px; padding: 24px; background: var(--bg-color); border-radius: 12px; text-align: center; display: none;">
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Rolls Needed</div>
                <div id="calc-rolls-val" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-color);">0</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">standard rolls (200m)</div>
            </div>
            
            <div style="margin-top: 24px; padding: 12px; background: #e3f2fd; color: #0c5460; border-radius: 8px; font-size: 0.9rem;">
                📌 <strong>Note:</strong> Each roll = 200 meters (200,000 mm)
            </div>
        </div>
      </div>
    `;

  // Logic
  const calculate = () => {
    const qty = parseFloat(getEl('calc-qty').value);
    const len = parseFloat(getEl('calc-len').value);
    if (isNaN(qty) || isNaN(len) || qty <= 0 || len <= 0) {
      alert('Please enter valid positive numbers.');
      return;
    }
    const totalMm = qty * len;
    const rollMm = 200000;
    const result = totalMm / rollMm;

    getEl('calc-rolls-val').innerText = result.toFixed(2);
    getEl('calc-result').style.display = 'block';
  };

  getEl('do-calc-btn').onclick = calculate;
  // Basic Enter key support
  getEl('calc-qty').onkeydown = (e) => { if (e.key === 'Enter') calculate(); };
  getEl('calc-len').onkeydown = (e) => { if (e.key === 'Enter') calculate(); };
}

function renderDashboard(container) {
  const employees = store.getEmployees();

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <button class="btn btn-primary" id="add-employee-btn">
      <span>+</span> Add Employee
    </button>
  `;
  container.appendChild(header);

  // Stats
  const currentMonth = currentDate.toISOString().slice(0, 7);
  const stats = calculateCollectiveStats(currentMonth);

  const grid = document.createElement('div');
  grid.className = 'dashboard-grid';
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Employees</div>
      <div class="stat-value">${employees.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Late Arrivals (This Month)</div>
      <div class="stat-value" style="color: var(--status-late)">${stats.late}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Absences (This Month)</div>
      <div class="stat-value" style="color: var(--status-absent)">${stats.absent}</div>
    </div>
  `;
  container.appendChild(grid);

  // List
  const listTitle = document.createElement('h2');
  listTitle.innerText = 'All Employees';
  listTitle.style.marginBottom = '24px';
  container.appendChild(listTitle);

  const list = document.createElement('div');
  list.className = 'employee-list';

  employees.forEach(emp => {
    const card = document.createElement('div');
    card.className = 'employee-card';
    card.dataset.id = emp.id;

    const empStats = calculateEmployeeStats(emp.id, currentDate);
    const statusTypes = store.getStatusTypes();

    // Generate stats summary string dynamically based on types
    // Show only standard metrics + any custom ones that are > 0?
    // For now, let's show Late, Absent, Short Leave, Night Shift as primary
    // and just dump the rest if they exist? User asked for specific ones.
    // Let's stick to the requested 4 for the summary line to keep it clean, or iterate?
    // "Review: Flexo Machine man... remove this and instead view late, absent..."

    const summaryHTML = statusTypes.map(type => {
      const val = empStats[type.id] || 0;
      return `<span style="color: ${type.color || 'var(--text-secondary)'}; font-weight: 500;">${type.label}: ${val}</span>`;
    }).join(' • ');

    card.innerHTML = `
      <div class="employee-info">
        <h3>${emp.name}</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
          ${summaryHTML}
        </p>
      </div>
      <div style="display: flex; gap: 16px; align-items: center;">
        <button class="btn btn-icon delete-btn" data-id="${emp.id}" title="Delete Employee">🗑️</button>
        <div style="color: var(--accent-color); font-weight: bold;">❯</div>
      </div>
    `;
    list.appendChild(card);
  });

  if (employees.length === 0) {
    list.innerHTML = `<div style="text-align:center; color: var(--text-secondary); padding: 40px;">No employees yet. Click "Add Employee" to start.</div>`;
  }

  container.appendChild(list);
}

function renderEmployeeDetail(container) {
  const emp = store.getEmployees().find(e => e.id === selectedEmployeeId);
  if (!emp) {
    selectedEmployeeId = null;
    renderApp();
    return;
  }

  // Header
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 16px;">
      <button class="btn btn-icon" id="back-btn" title="Back to Dashboard">← Back</button>
      <h1 class="page-title">${emp.name}</h1>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; background: white; padding: 8px 16px; border-radius: 12px; box-shadow: var(--shadow-sm);">
      <button class="btn btn-icon" id="prev-month">❮</button>
      <span style="font-weight: 600; font-size: 1.1rem; min-width: 140px; text-align: center;">
        ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>
      <button class="btn btn-icon" id="next-month">❯</button>
    </div>
  `;
  container.appendChild(header);

  // Calendar
  const attendance = store.getAttendance(emp.id);
  container.appendChild(renderCalendar(currentDate, attendance));

  // Stats
  const currentMonthStats = calculateEmployeeStats(emp.id, currentDate);
  const statusTypes = store.getStatusTypes();

  const statsDiv = document.createElement('div');
  statsDiv.style.marginTop = '32px';
  statsDiv.className = 'dashboard-grid';
  statsDiv.style.marginBottom = '0';

  statsDiv.innerHTML = statusTypes.map(s => `
    <div class="stat-card" style="padding: 20px;">
       <div class="stat-label">${s.label}</div>
       <div class="stat-value" style="font-size: 1.5rem; display: flex; align-items: center; gap: 8px;">
         <span style="width: 12px; height: 12px; border-radius: 50%; background: ${s.color}; display: block;"></span>
         ${currentMonthStats[s.id] || 0}
       </div>
    </div>
  `).join('');

  container.appendChild(statsDiv);
}

function renderCalendar(date, attendanceData) {
  const container = document.createElement('div');
  container.className = 'month-view';
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
    const el = document.createElement('div');
    el.className = 'calendar-day-header';
    el.innerText = day;
    grid.appendChild(el);
  });

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const statusTypes = store.getStatusTypes();

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'day-cell';
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    el.dataset.date = dateStr;

    if (dateStr === todayStr) el.classList.add('today');

    el.innerHTML = `<span style="font-weight: 500;">${d}</span>`;

    const record = attendanceData[dateStr];
    if (record && record.statuses && record.statuses.length > 0) {
      // Render dots for each status
      const dotContainer = document.createElement('div');
      dotContainer.style.display = 'flex';
      dotContainer.style.gap = '4px';
      dotContainer.style.marginTop = '4px';
      dotContainer.style.flexWrap = 'wrap';
      dotContainer.style.justifyContent = 'center';

      record.statuses.forEach(statusId => {
        const type = statusTypes.find(t => t.id === statusId);
        if (type) {
          const dot = document.createElement('div');
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.backgroundColor = type.color;
          dot.title = type.label;
          dotContainer.appendChild(dot);
        }
      });
      el.appendChild(dotContainer);
    }

    grid.appendChild(el);
  }
  container.appendChild(grid);
  return container;
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderApp();
}

function calculateCollectiveStats(monthPrefix) {
  // Aggregate primary stats for dashboard overview
  const employees = store.getEmployees();
  let late = 0, absent = 0;
  employees.forEach(emp => {
    const att = store.getAttendance(emp.id);
    Object.keys(att).forEach(date => {
      if (date.startsWith(monthPrefix) && att[date].statuses) {
        if (att[date].statuses.includes('late')) late++;
        if (att[date].statuses.includes('absent')) absent++;
      }
    });
  });
  return { late, absent };
}

function calculateEmployeeStats(empId, date) {
  const att = store.getAttendance(empId);
  const monthPrefix = date.toISOString().slice(0, 7);
  let stats = {};

  Object.keys(att).forEach(d => {
    if (d.startsWith(monthPrefix) && att[d].statuses) {
      att[d].statuses.forEach(statusId => {
        stats[statusId] = (stats[statusId] || 0) + 1;
      });
    }
  });
  return stats;
}

// Modal Logic
function openAddEmployeeModal() {
  const content = getEl('modal-content');
  if (!content) return;
  content.innerHTML = `
    <h2 style="margin-top:0; margin-bottom: 24px;">Add New Employee</h2>
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="new-emp-name" placeholder="Name" autofocus>
    </div>
    <div class="form-group">
      <label>Department / Role</label>
      <input type="text" id="new-emp-role" placeholder="Role">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
      <button class="btn" id="cancel-btn">Cancel</button>
      <button class="btn btn-primary" id="save-add-btn">Save Employee</button>
    </div>
  `;
  getEl('modal-overlay').classList.add('open');

  const save = () => {
    const name = document.getElementById('new-emp-name').value;
    const role = document.getElementById('new-emp-role').value;
    if (name) {
      store.addEmployee(name, role);
      closeModal();
      renderApp();
    }
  };
  document.getElementById('save-add-btn').onclick = save;
  document.getElementById('new-emp-name').onkeydown = (e) => { if (e.key === 'Enter') save(); };
  document.getElementById('new-emp-role').onkeydown = (e) => { if (e.key === 'Enter') save(); };
}

function openStatusModal(empId, dateStr) {
  const content = getEl('modal-content');
  const record = store.getAttendance(empId)[dateStr] || { statuses: [] };
  const currentStatuses = record.statuses || [];

  // Render Dynamic Content
  const renderModalInternal = () => {
    const allTypes = store.getStatusTypes();

    const buttonsHTML = allTypes.map(type => {
      const isActive = currentStatuses.includes(type.id);
      const isCustom = !['late', 'absent', 'short_leave', 'night_shift'].includes(type.id);

      return `
            <div style="display: flex; gap: 8px;">
                <button class="btn status-toggle-btn" 
                  data-id="${type.id}"
                  style="flex: 1; border: 2px solid ${type.color}; background: ${isActive ? type.color : 'transparent'}; color: ${isActive ? 'white' : 'var(--text-primary)'}; justify-content: start;">
                  ${isActive ? '✅' : '⬜'} ${type.label}
                </button>
                ${isCustom ? `<button class="btn delete-status-type-btn" data-id="${type.id}" style="padding: 0 12px; border: 1px solid var(--status-absent); color: var(--status-absent);" title="Delete Status Type">🗑️</button>` : ''}
            </div>
          `;
    }).join('');

    content.dataset.empId = empId; // Store context
    content.dataset.dateStr = dateStr;

    content.innerHTML = `
        <h2 style="margin-top:0; margin-bottom: 24px;">Status for ${dateStr}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">Select all that apply:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
            ${buttonsHTML}
        </div>
        
        <!-- Add New Status Section -->
        <div style="margin-bottom: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px;">
                <input type="text" id="new-status-name" placeholder="New Status Name (e.g. Half Day)" style="flex:1; padding: 8px; border-radius: 8px; border: 1px solid var(--border-color);">
                <input type="color" id="new-status-color" value="#3498db" style="width: 40px; height: 40px; border: none; padding: 0; background: none; cursor: pointer;">
                <button class="btn" id="add-status-btn">Add</button>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 12px;">
           <button class="btn" id="clear-status-btn" style="color: var(--status-absent); border-color: var(--status-absent);">🗑️ Clear All</button>
           <button class="btn btn-primary" id="close-modal-btn">Done</button>
        </div>
      `;

    // Attach Listeners
    content.querySelectorAll('.status-toggle-btn').forEach(btn => {
      btn.onclick = () => {
        store.toggleAttendanceStatus(empId, dateStr, btn.dataset.id);
        // Update local state for re-render without closing
        if (currentStatuses.includes(btn.dataset.id)) {
          const idx = currentStatuses.indexOf(btn.dataset.id);
          currentStatuses.splice(idx, 1);
        } else {
          currentStatuses.push(btn.dataset.id);
        }
        renderModalInternal(); // Re-render modal to show changes
        renderApp(); // Update background app
      };
    });

    getEl('add-status-btn').onclick = () => {
      const name = getEl('new-status-name').value;
      const color = getEl('new-status-color').value;
      if (name) {
        store.addStatusType(name, color);
        renderModalInternal();
        renderApp();
      }
    };

    getEl('clear-status-btn').onclick = () => {
      store.clearAttendance(empId, dateStr);
      closeModal();
      renderApp();
    };
  };

  renderModalInternal();
  getEl('modal-overlay').classList.add('open');
}

function closeModal() {
  const overlay = getEl('modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

function renderCylinders() {
  const container = getEl('main-content');
  if (!container) return;

  // Retrieve data
  const cylinders = store.getCylinders() || [];
  const xinHu = cylinders.filter(c => c.brand === 'Xin Hu');
  const jingda = cylinders.filter(c => c.brand === 'Jingda');

  // Helper to generate table row
  const renderTable = (brandName, items) => {
    // Sort by T.no naturally if possible, or usually just insertion order
    // Let's sort by T.no logic? T42, T120... numeric part
    const sorted = [...items].sort((a, b) => {
      const nA = parseInt(a.tNo.replace(/\D/g, '')) || 0;
      const nB = parseInt(b.tNo.replace(/\D/g, '')) || 0;
      return nA - nB;
    });

    const rows = sorted.map(c => {
      const sizeInches = (c.sizeMM / 25.4).toFixed(6);
      const availableSizes = [];
      for (let i = 2; i <= 10; i++) {
        availableSizes.push((c.sizeMM / i).toFixed(5));
      }

      const cellStyle = 'padding: 8px; border: 1px solid #dee2e6; text-align: center; vertical-align: middle;';

      return `
             <tr>
                 <td style="${cellStyle}">${c.tNo}</td>
                 <td style="${cellStyle}">${c.count}</td>
                 <td style="${cellStyle}">${c.gears}</td>
                 <!-- Size -->
                 <td style="${cellStyle}">${c.sizeMM}</td>
                 <td style="${cellStyle}">${sizeInches}</td>
                 <!-- Available Sizes -->
                 ${availableSizes.map(val => `<td style="${cellStyle}">${val}</td>`).join('')}
                 <td style="${cellStyle}">${c.distortion || '-'}</td>
                 <td style="${cellStyle}">
                   <button class="btn btn-icon delete-cylinder-btn" data-id="${c.id}" style="color:red; font-weight:bold;" title="Delete Cylinder">❌</button>
                 </td>
               </tr>
             `;
    }).join('');

    return `
          <div style="background: white; border-radius: 12px; box-shadow: var(--shadow-sm); padding: 24px; margin-bottom: 32px; overflow-x: auto;">
             <h2 style="margin-top:0; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
                Cylinder list ${brandName}
             </h2>
             <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 1200px;">
                <thead>
                   <tr style="background: #f8f9fa;">
                      <th style="padding: 12px; border: 1px solid #dee2e6;" rowspan="2">T.no</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" rowspan="2">Cyl</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" rowspan="2">Gears</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" colspan="2">Size</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" colspan="9">Available Sizes (MM)</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" rowspan="2">Distortion</th>
                      <th style="padding: 12px; border: 1px solid #dee2e6;" rowspan="2">Action</th>
                   </tr>
                   <tr style="background: #f8f9fa;">
                      <th style="padding: 8px; border: 1px solid #dee2e6;">MM</th>
                      <th style="padding: 8px; border: 1px solid #dee2e6;">Inch</th>
                      <!-- 2up to 10up -->
                      ${Array.from({ length: 9 }, (_, i) => `<th style="padding: 8px; border: 1px solid #dee2e6;">${i + 2} UP</th>`).join('')}
                   </tr>
                </thead>
                <tbody>
                   ${rows}
                   ${rows.length === 0 ? '<tr><td colspan="15" style="padding: 24px; text-align:center; color: var(--text-secondary);">No cylinders recorded.</td></tr>' : ''}
                </tbody>
             </table>
          </div>
        `;
  };

  container.innerHTML = `
       <div class="header">
          <h1 class="page-title">Cylinder List</h1>
          <div style="display:flex; gap:12px;">
             <button class="btn" id="export-pdf-btn">📄 Export to PDF</button>
             <button class="btn btn-primary" id="add-cylinder-btn"><span>+</span> Add Cylinder</button>
          </div>
       </div>
       
       ${renderTable('Xin Hu', xinHu)}
       ${renderTable('Jingda', jingda)}
       
       <div style="margin-top:40px;"></div> <!-- spacer -->
    `;

  // Attach Export Listener
  getEl('export-pdf-btn').onclick = () => {
    window.print();
  };
}

function openAddCylinderModal() {
  const content = getEl('modal-content');
  if (!content) return;

  content.innerHTML = `
     <h2 style="margin-top:0; margin-bottom: 24px;">Add New Cylinder</h2>
     
     <div class="form-group">
        <label>Brand</label>
        <div style="display: flex; gap: 16px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="brand" value="Xin Hu" checked> Xin Hu
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="brand" value="Jingda"> Jingda
            </label>
        </div>
     </div>

     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
         <div class="form-group">
            <label>T.no</label>
            <input type="text" id="cyl-tno" placeholder="e.g. T42" style="width: 100%;">
         </div>
         <div class="form-group">
            <label>Cylinders (Count)</label>
            <input type="number" id="cyl-count" placeholder="e.g. 4" style="width: 100%;">
         </div>
         <div class="form-group">
            <label>Gears</label>
            <input type="number" id="cyl-gears" placeholder="e.g. 4" style="width: 100%;">
         </div>
         <div class="form-group">
            <label>Size (MM)</label>
            <input type="number" id="cyl-size" step="0.01" placeholder="e.g. 104.72" style="width: 100%;">
         </div>
         <div class="form-group">
            <label>Distortion Size</label>
            <input type="number" id="cyl-dist" step="0.01" placeholder="e.g. 94.837" style="width: 100%;">
         </div>
     </div>

     <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
       <button class="btn" id="cancel-btn">Cancel</button>
       <button class="btn btn-primary" id="save-cyl-btn">Add Cylinder</button>
     </div>
  `;
  getEl('modal-overlay').classList.add('open');

  const save = () => {
    const brand = document.querySelector('input[name="brand"]:checked').value;
    const tNo = getEl('cyl-tno').value;
    const count = getEl('cyl-count').value;
    const gears = getEl('cyl-gears').value;
    const size = getEl('cyl-size').value;
    const dist = getEl('cyl-dist').value;

    if (tNo && count && gears && size) {
      store.addCylinder(brand, tNo, gears, count, size, dist);
      closeModal();
      renderCylinders();
    } else {
      alert('Please fill in at least T.no, Count, Gears, and Size.');
    }
  };

  getEl('save-cyl-btn').onclick = save;
}
