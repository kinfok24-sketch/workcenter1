import './style.css';
import { initUI } from './ui.js';

document.querySelector('#app').innerHTML = `
  <div class="sidebar">
    <div class="brand">
        <div style="width: 24px; height: 24px; background: var(--accent-color); border-radius: 6px;"></div>
        Dashboard
    </div>
    <div class="nav-item active" data-page="dashboard">Tracker</div>
    <div class="nav-item" data-page="calculator">Satin Calculator</div>
    <div class="nav-item" data-page="cylinders">Cylinder List</div>
    <div class="nav-item" data-page="rules">Rule Book</div>
    <div class="nav-item" data-page="rules">Rule Book</div>
    
    <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color);">
        <button class="nav-item" id="backup-btn" style="width: 100%; text-align: left; background: none; border: none; font-weight: normal; font-size: 0.9rem;">⬇ Backup Data</button>
        <button class="nav-item" id="restore-btn" style="width: 100%; text-align: left; background: none; border: none; font-weight: normal; font-size: 0.9rem;">⬆ Restore Data</button>
    </div>
  </div>
  <div class="main-content" id="main-content">
    <!-- Dynamic Content -->
  </div>
  
  <!-- Modal Portal -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal" id="modal-content"></div>
  </div>

  <!-- Lightbox Portal -->
  <div class="lightbox-overlay" id="lightbox-overlay">
    <div class="lightbox-container" id="lightbox-content"></div>
  </div>
`;

initUI();
