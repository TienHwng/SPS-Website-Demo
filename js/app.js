document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // STATE
    // =====================================================================
    let currentUser = null;
    let liveInterval = null;
    let pendingRefundTxId = null;

    // =====================================================================
    // DOM REFS
    // =====================================================================
    const loginScreen    = document.getElementById('login-screen');
    const appContainer   = document.getElementById('app-container');
    const loginForm      = document.getElementById('login-form');
    const roleSelect     = document.getElementById('role-select');
    const currentUserName  = document.getElementById('current-user-name');
    const currentRoleBadge = document.getElementById('current-role-badge');
    const navList        = document.getElementById('nav-list');
    const btnLogout      = document.getElementById('btn-logout');

    const views = {
        student:  document.getElementById('view-learner'),
        staff:    document.getElementById('view-learner'),   // shares same HTML
        operator: document.getElementById('view-operator'),
        finance:  document.getElementById('view-finance'),
        admin:    document.getElementById('view-admin'),
        signage:  document.getElementById('view-signage')
    };

    // =====================================================================
    // AUTHENTICATION (UC-01 / UC-10 SSO mock)
    // =====================================================================
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const roleKey = roleSelect.value;
        if (roleKey === 'visitor') {
            openSignageKiosk();
        } else {
            currentUser = window.HCMUT_DATACORE.users[roleKey];
            login(currentUser);
        }
    });

    btnLogout.addEventListener('click', logout);
    document.getElementById('exit-signage').addEventListener('click', logout);

    function login(user) {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        document.getElementById('view-signage').classList.add('hidden');

        currentUserName.textContent   = user.name;
        currentRoleBadge.textContent  = user.role;
        currentRoleBadge.className    = `badge role-badge-${user.roleId}`;

        setupNavigation(user.roleId);
        const defaultView = getDefaultView(user.roleId);
        switchView(defaultView);
        startLiveSimulation();
        setupGateSimulator();
        setupAdminPanels();
        setupFinancePanels();
        syncUIFromConfig();
    }

    function logout() {
        if (liveInterval) clearInterval(liveInterval);
        appContainer.classList.add('hidden');
        document.getElementById('view-signage').classList.add('hidden');
        loginScreen.classList.remove('hidden');
        currentUser = null;
    }

    function openSignageKiosk() {
        loginScreen.classList.add('hidden');
        appContainer.classList.add('hidden');
        document.getElementById('view-signage').classList.remove('hidden');
        startLiveSimulation();
    }

    function getDefaultView(roleId) {
        const map = { student: 'student', staff: 'staff', operator: 'operator', finance: 'finance', admin: 'admin' };
        return map[roleId] || 'student';
    }

    // =====================================================================
    // NAVIGATION
    // =====================================================================
    const routeConfig = {
        student: [
            { icon: 'bx-home',    label: 'My Dashboard', view: 'student' }
        ],
        staff: [
            { icon: 'bx-home',    label: 'Staff Dashboard', view: 'staff' }
        ],
        operator: [
            { icon: 'bx-cctv',   label: 'Gate Control',    view: 'operator' }
        ],
        finance: [
            { icon: 'bx-dollar-circle', label: 'Finance Portal', view: 'finance' }
        ],
        admin: [
            { icon: 'bx-shield',        label: 'Administration',  view: 'admin' }
        ]
    };

    function setupNavigation(roleId) {
        navList.innerHTML = '';
        const routes = routeConfig[roleId] || [];
        routes.forEach((route, idx) => {
            const li = document.createElement('li');
            li.className = `nav-item ${idx === 0 ? 'active' : ''}`;
            li.innerHTML = `<i class='bx ${route.icon}'></i> ${route.label}`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                switchView(route.view);
            });
            navList.appendChild(li);
        });
    }

    const allViews = ['view-learner', 'view-operator', 'view-finance', 'view-admin', 'view-signage'];

    function switchView(viewId) {
        allViews.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        const targetId = (viewId === 'student' || viewId === 'staff') ? 'view-learner' : `view-${viewId}`;
        const target = document.getElementById(targetId);
        if (target) target.classList.remove('hidden');
        updateViewData(viewId);
    }

    // =====================================================================
    // DATA BINDING
    // =====================================================================
    function updateViewData(viewId) {
        renderMap();
        if (viewId === 'student' || viewId === 'staff') renderLearnerOverview();
        if (viewId === 'operator') { renderOperatorDashboard(); renderActivityLog(); renderIntegrationStatus('integration-status-list'); }
        if (viewId === 'finance')  { renderFinanceLog(); renderRefundTable(''); }
        if (viewId === 'admin')    { renderAdminLog(); renderIntegrationStatus('admin-integration-list'); syncUIFromConfig(); }
    }

    // =====================================================================
    // TABS (Learner view)
    // =====================================================================
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
            btn.classList.add('active');
            const tabEl = document.getElementById(tabId);
            if (tabEl) { tabEl.classList.add('active-tab'); tabEl.classList.remove('hidden'); }
            if (tabId === 'tab-history') renderPersonalHistory();
        });
    });

    // =====================================================================
    // MODAL HANDLING
    // =====================================================================
    document.querySelectorAll('.popup-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.target)?.classList.remove('hidden');
        });
    });
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay')?.classList.add('hidden');
        });
    });

    // BKPay payment simulation (UC-03)
    document.getElementById('btn-mock-pay')?.addEventListener('click', () => {
        const fee = parseInt(document.getElementById('bkpay-amount')?.textContent) || 0;
        const user = currentUser;
        if (user) {
            user.balance = Math.max(0, user.balance - fee);
            if (user.balance < 0) { user.debt += Math.abs(user.balance); user.balance = 0; }
        }
        pushLog('Payment', user?.id || 'N/A', 'BKPay', 'System', 'Completed', `Amount: ${fee} VND`, 'payment');
        document.getElementById('bkpay-modal').classList.add('hidden');
        document.getElementById('stu-accrued-fee').textContent = '0 VND';
        renderLearnerOverview();
    });

    // =====================================================================
    // LEARNER OVERVIEW (UC-13 setup)
    // =====================================================================
    function renderLearnerOverview() {
        if (!currentUser) return;
        const titleEl = document.getElementById('learner-title');
        if (titleEl) titleEl.textContent = currentUser.roleId === 'staff' ? 'Staff Parking Overview' : 'My Parking Overview';

        const privEl = document.getElementById('stu-privilege');
        const privSubEl = document.getElementById('stu-privilege-sub');
        if (currentUser.roleId === 'staff') {
            if (privEl) privEl.textContent = 'Privileged';
            if (privSubEl) privSubEl.textContent = 'Faculty zone access granted';
        } else {
            if (privEl) privEl.textContent = 'General';
            if (privSubEl) privSubEl.textContent = 'General zone access only';
        }

        const balEl = document.getElementById('stu-balance');
        if (balEl) balEl.textContent = currentUser.balance.toLocaleString('en-US') + ' VND';

        // Current session
        const session = window.HCMUT_DATACORE.activeSessions.find(s => s.userId === currentUser.id);
        const sessionEl = document.getElementById('stu-session-time');
        const entryEl   = document.getElementById('stu-entry-time');
        const feeEl     = document.getElementById('stu-accrued-fee');
        if (session) {
            const mins = Math.floor((Date.now() - new Date(session.entryTime).getTime()) / 60000);
            if (sessionEl) sessionEl.textContent = `${Math.floor(mins/60)}h ${mins%60}m`;
            if (entryEl) entryEl.textContent = new Date(session.entryTime).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
            const fee = calculateFee(session);
            if (feeEl) feeEl.textContent = fee.toLocaleString('en-US') + ' VND';
            const amtEl = document.getElementById('bkpay-amount');
            if (amtEl) amtEl.textContent = fee.toLocaleString('en-US') + ' VND';
            const balDisp = document.getElementById('bkpay-balance');
            if (balDisp) balDisp.textContent = currentUser.balance.toLocaleString('en-US') + ' VND';
        } else {
            if (sessionEl) sessionEl.textContent = 'No active session';
            if (entryEl)   entryEl.textContent   = '—';
            if (feeEl)     feeEl.textContent     = '0 VND';
        }
    }

    // =====================================================================
    // PERSONAL HISTORY (UC-13)
    // =====================================================================
    function renderPersonalHistory() {
        if (!currentUser) return;
        const history = window.HCMUT_DATACORE.parkingHistory[currentUser.id] || [];
        const tbody = document.getElementById('history-tbody');
        const emptyMsg = document.getElementById('history-empty');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (history.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        if (emptyMsg) emptyMsg.style.display = 'none';
        history.forEach(h => {
            const hrs  = Math.floor(h.durationMins / 60);
            const mins = h.durationMins % 60;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${h.date}</td>
                <td>${h.zoneName}</td>
                <td>${hrs}h ${mins}m</td>
                <td>${h.fee.toLocaleString('en-US')} VND</td>
                <td><span class="badge badge-success">${h.method}</span></td>
                <td><button class="btn btn-sm btn-outline" onclick="window._showReceipt('${h.sessionId}')">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    window._showReceipt = function(sessionId) {
        if (!currentUser) return;
        const history = window.HCMUT_DATACORE.parkingHistory[currentUser.id] || [];
        const h = history.find(x => x.sessionId === sessionId);
        if (!h) return;
        const body = document.getElementById('receipt-body');
        if (body) body.innerHTML = `
            <div class="receipt-box">
                <div class="receipt-header">
                    <span class="receipt-logo"><i class='bx bxs-parking'></i></span>
                    <strong>HCMUT Parking Receipt</strong>
                </div>
                <div class="receipt-row"><span>Transaction ID</span><strong>${h.txId}</strong></div>
                <div class="receipt-row"><span>Date</span><strong>${h.date}</strong></div>
                <div class="receipt-row"><span>Zone</span><strong>${h.zoneName}</strong></div>
                <div class="receipt-row"><span>Entry</span><strong>${h.entryTime}</strong></div>
                <div class="receipt-row"><span>Exit</span><strong>${h.exitTime}</strong></div>
                <div class="receipt-row"><span>Duration</span><strong>${Math.floor(h.durationMins/60)}h ${h.durationMins%60}m</strong></div>
                <div class="receipt-row total"><span>Total Fee</span><strong>${h.fee.toLocaleString('en-US')} VND</strong></div>
                <div class="receipt-row"><span>Method</span><strong>${h.method}</strong></div>
                <div class="receipt-footer">Thank you for using HCMUT Smart Parking</div>
            </div>
        `;
        document.getElementById('receipt-modal').classList.remove('hidden');
    };

    document.getElementById('btn-export-history')?.addEventListener('click', () => {
        if (!currentUser) return;
        const history = window.HCMUT_DATACORE.parkingHistory[currentUser.id] || [];
        const csv = ['Date,Zone,Duration(min),Fee(VND),Method,TxID', ...history.map(h => `${h.date},${h.zoneName},${h.durationMins},${h.fee},${h.method},${h.txId}`)].join('\n');
        downloadCSV(csv, `parking_history_${currentUser.id}.csv`);
    });

    // =====================================================================
    // LIVE SIMULATION
    // =====================================================================
    function startLiveSimulation() {
        renderMap();
        renderOperatorDashboard();
        renderSignage();

        liveInterval = setInterval(() => {
            const zones = window.HCMUT_DATACORE.parkingZones;
            const z = zones[Math.floor(Math.random() * zones.length)];
            const delta = Math.floor(Math.random() * 3) - 1;
            z.occupied = Math.max(0, Math.min(z.capacity, z.occupied + delta));

            triggerScannerUI();
            renderMap();
            if (currentUser?.roleId === 'operator') { renderOperatorDashboard(); }
            if (currentUser?.roleId === 'student' || currentUser?.roleId === 'staff') renderLearnerOverview();
            if (!currentUser) renderSignage();
        }, 3000);
    }

    // =====================================================================
    // MAP (UC-05, zone-click → spots modal)
    // =====================================================================
    function getStatusData(capacity, occupied) {
        const ratio = occupied / capacity;
        let colorClass = 'fill-green', statusText = 'Available', ledClass = 'available';
        if (ratio >= 0.95) { colorClass = 'fill-red';    statusText = 'Full';        ledClass = 'full';        }
        else if (ratio >= 0.8) { colorClass = 'fill-yellow'; statusText = 'Nearly Full'; ledClass = 'nearly-full'; }
        return { ratio, percent: Math.round(ratio * 100), colorClass, statusText, ledClass };
    }

    function renderMap() {
        document.querySelectorAll('.map-grid-render').forEach(container => {
            container.innerHTML = '';
            window.HCMUT_DATACORE.parkingZones.forEach(z => {
                const stat = getStatusData(z.capacity, z.occupied);
                const div = document.createElement('div');
                div.className = 'map-zone';
                div.style.cursor = 'pointer';
                div.innerHTML = `
                    <div class="zone-header">
                        <span>${z.name}${z.privileged ? ' <i class="bx bx-lock-alt" title="Privileged"></i>' : ''}</span>
                        <span class="badge ${stat.statusText === 'Full' ? 'badge-error' : stat.statusText === 'Nearly Full' ? 'badge-warn' : 'badge-success'}">${stat.statusText}</span>
                    </div>
                    <div class="sub-text" style="margin-bottom:0.5rem;">${z.capacity - z.occupied} slots left</div>
                    <div class="zone-progress">
                        <div class="zone-fill ${stat.colorClass}" style="width:${stat.percent}%;"></div>
                    </div>
                `;
                div.addEventListener('click', () => openZoneDetails(z));
                container.appendChild(div);
            });
        });
    }

    function generateMockPlate() {
        const p1 = Math.floor(Math.random() * 90 + 10);
        const p2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const p3 = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        return `${p1}-${p2} ${p3.slice(0,3)}.${p3.slice(3,5)}`;
    }

    // UC-09 role permission: who can see plates
    function canViewPlate() {
        if (!currentUser) return false;
        return ['staff', 'operator', 'finance', 'admin'].includes(currentUser.roleId);
    }

    function openZoneDetails(zone) {
        document.getElementById('zone-modal-title').innerHTML = `<i class='bx bx-map-pin'></i> ${zone.name} — Spot Map`;
        const container = document.getElementById('zone-spots-container');
        container.innerHTML = '';

        const displayCap = Math.min(zone.capacity, 300);
        const displayOcc = Math.floor((zone.occupied / zone.capacity) * displayCap);
        const spots = Array(displayCap).fill(false);
        for (let i = 0; i < displayOcc; i++) spots[i] = true;
        spots.sort(() => Math.random() - 0.5);

        const showPlate = canViewPlate();
        for (let i = 0; i < displayCap; i++) {
            const isOccupied = spots[i];
            const div = document.createElement('div');
            div.className = `spot-item ${isOccupied ? 'spot-occupied' : 'spot-empty'}`;
            if (isOccupied) {
                div.innerHTML = showPlate
                    ? `<span>P-${i+1}</span><div class="spot-plate">${generateMockPlate()}</div>`
                    : `<span>P-${i+1}</span><small>Occupied</small>`;
            } else {
                div.innerHTML = `<span>P-${i+1}</span><small>Empty</small>`;
            }
            container.appendChild(div);
        }
        document.getElementById('zone-details-modal').classList.remove('hidden');
    }

    // =====================================================================
    // OPERATOR DASHBOARD (UC-05)
    // =====================================================================
    function renderOperatorDashboard() {
        const zones = window.HCMUT_DATACORE.parkingZones;
        const total  = zones.reduce((a, b) => a + b.capacity, 0);
        const occ    = zones.reduce((a, b) => a + b.occupied, 0);
        const sessions = window.HCMUT_DATACORE.activeSessions.length;

        const el = id => document.getElementById(id);
        if (el('op-total-capacity')) el('op-total-capacity').textContent = total;
        if (el('op-occupied'))       el('op-occupied').textContent       = occ;
        if (el('op-available'))      el('op-available').textContent      = total - occ;
        if (el('op-sessions'))       el('op-sessions').textContent       = sessions;
    }

    // =====================================================================
    // ACTIVITY LOG (UC-12)
    // =====================================================================
    function renderActivityLog(filter = '') {
        const tbody = document.getElementById('op-activity-log');
        if (!tbody) return;
        tbody.innerHTML = '';
        let logs = window.HCMUT_DATACORE.recentLogs;
        if (filter) logs = logs.filter(l => l.gate?.includes(filter) || l.id?.includes(filter));
        logs.forEach(log => {
            const ok = log.status.includes('OK') || log.status === 'Completed';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.time}</td>
                <td>${log.type}<br><small class="sub-text">${log.id}</small></td>
                <td>${log.gate}<br><small class="sub-text">${log.action}</small></td>
                <td><span class="badge ${ok ? 'badge-success' : 'badge-error'}">${log.status}</span><br><small class="sub-text">${log.reason || ''}</small></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Admin full log (UC-12)
    function renderAdminLog(category = '') {
        const tbody = document.getElementById('admin-log-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        let logs = window.HCMUT_DATACORE.recentLogs;
        if (category) logs = logs.filter(l => l.category === category);
        logs.forEach(log => {
            const ok = log.status.includes('OK') || log.status === 'Completed';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.time}</td>
                <td>${log.type}<br><small class="sub-text">${log.id}</small></td>
                <td>${log.action}</td>
                <td><span class="badge ${ok ? 'badge-success' : 'badge-error'}">${log.status}</span></td>
                <td><small class="sub-text">${log.reason || '—'}</small></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Finance log: payment/refund only (UC-12)
    function renderFinanceLog() {
        const tbody = document.getElementById('finance-log-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        window.HCMUT_DATACORE.recentLogs
            .filter(l => l.category === 'payment')
            .forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${log.time}</td>
                    <td>${log.id}</td>
                    <td>${log.action}</td>
                    <td><span class="badge badge-success">${log.status}</span></td>
                    <td><small class="sub-text">${log.reason || '—'}</small></td>
                `;
                tbody.appendChild(tr);
            });
    }

    // =====================================================================
    // SIGNAGE (Visitor Kiosk)
    // =====================================================================
    function renderSignage() {
        const container = document.getElementById('signage-zones');
        if (!container) return;
        container.innerHTML = '';
        window.HCMUT_DATACORE.parkingZones.forEach(z => {
            const stat = getStatusData(z.capacity, z.occupied);
            const div = document.createElement('div');
            div.className = 'led-zone-row';
            div.innerHTML = `
                <span>[${z.id}] ${z.name.toUpperCase()}</span>
                <span class="led-status ${stat.ledClass}">${(z.capacity - z.occupied).toString().padStart(3,'0')} ${stat.statusText.toUpperCase()}</span>
            `;
            container.appendChild(div);
        });
    }

    // =====================================================================
    // CAMERA SCANNER UI
    // =====================================================================
    function triggerScannerUI() {
        const mockPlate = document.getElementById('plate-mock');
        if (!mockPlate) return;
        if (Math.random() > 0.7) {
            mockPlate.classList.remove('hidden');
            mockPlate.textContent = generateMockPlate();
            setTimeout(() => mockPlate.classList.add('hidden'), 1500);
        }
    }

    // =====================================================================
    // PUSH LOG HELPER (UC-12)
    // =====================================================================
    function pushLog(type, id, action, gate, status, reason = '', category = 'entry') {
        const time = new Date().toLocaleTimeString('en-US', {hour12: false});
        window.HCMUT_DATACORE.recentLogs.unshift({ time, type, id, action, gate, status, reason, category });
        if (window.HCMUT_DATACORE.recentLogs.length > 50) window.HCMUT_DATACORE.recentLogs.pop();
        renderActivityLog();
        renderAdminLog();
    }

    // =====================================================================
    // GATE SIMULATOR (UC-01, UC-02, UC-04, UC-06)
    // =====================================================================
    function setupGateSimulator() {
        const uSel = document.getElementById('sim-user-select');
        const zSel = document.getElementById('sim-zone-select');
        if (!uSel || !zSel) return;

        uSel.innerHTML = '';
        zSel.innerHTML = '';

        Object.values(window.HCMUT_DATACORE.users).forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `[${u.role}] ${u.name}`;
            uSel.appendChild(opt);
        });
        const visOpt = document.createElement('option');
        visOpt.value = 'VISITOR_NEW';
        visOpt.textContent = '[Visitor] Unregistered Vehicle';
        uSel.appendChild(visOpt);

        window.HCMUT_DATACORE.parkingZones.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id;
            opt.textContent = `${z.name}${z.privileged ? ' 🔒' : ''}`;
            zSel.appendChild(opt);
        });

        // Zone filter for log
        const logFilter = document.getElementById('log-zone-filter');
        if (logFilter) {
            logFilter.innerHTML = '<option value="">All Zones</option>';
            window.HCMUT_DATACORE.parkingZones.forEach(z => {
                const opt = document.createElement('option');
                opt.value = z.name;
                opt.textContent = z.name;
                logFilter.appendChild(opt);
            });
            logFilter.addEventListener('change', () => renderActivityLog(logFilter.value));
        }

        document.getElementById('btn-sim-entry')?.addEventListener('click', simulateEntry);
        document.getElementById('btn-sim-exit')?.addEventListener('click', simulateExit);
        document.getElementById('btn-manual-open')?.addEventListener('click', () => handleException('Manual Gate Release', 'Gate Forced Open'));
        document.getElementById('btn-manual-deny')?.addEventListener('click', () => handleException('Deny Access', 'Operator Forced Denial'));
        document.getElementById('btn-restock-dispenser')?.addEventListener('click', () => {
            window.HCMUT_DATACORE.dispenserStatus.cardsRemaining += 50;
            updateDispenserUI();
            pushLog('Operator', currentUser?.id || 'OP00', 'Restock', 'Kiosk', 'Completed', 'Cards restocked (+50) (UC-06)', 'manual');
            alert('Dispenser restocked with 50 cards. Action logged.');
        });
        document.getElementById('btn-issue-visitor')?.addEventListener('click', () => simulateVisitorIssue());

        updateDispenserUI();
    }

    function updateDispenserUI() {
        const el = document.getElementById('dispenser-count');
        if (el) el.textContent = window.HCMUT_DATACORE.dispenserStatus.cardsRemaining;
    }

    // UC-01: Entry
    function simulateEntry() {
        const userId = document.getElementById('sim-user-select').value;
        const zoneId = document.getElementById('sim-zone-select').value;
        const zone   = window.HCMUT_DATACORE.parkingZones.find(z => z.id === zoneId);
        let userRole = 'Visitor';
        let isVisitor = false;

        if (userId === 'VISITOR_NEW') {
            isVisitor = true;
            // UC-04: check dispenser
            if (window.HCMUT_DATACORE.dispenserStatus.cardsRemaining <= 0) {
                pushLog('Visitor', 'N/A', 'Entry', zone.name, 'Denied', 'Dispenser Empty — Admin notified (UC-04)', 'entry');
                return alert('⚠ Cannot issue temporary card: Dispenser is empty! Admin has been notified.');
            }
        } else {
            const u = Object.values(window.HCMUT_DATACORE.users).find(u => u.id === userId);
            if (u) userRole = u.role;
        }

        // UC-01: Check capacity
        if (zone.occupied >= zone.capacity) {
            pushLog(userRole, userId, 'Entry', zone.name, 'Denied', 'Zone Full (UC-01)', 'entry');
            return alert(`⚠ Access Denied: ${zone.name} is at full capacity.`);
        }

        // UC-01: Check privilege
        if (zone.privileged && !(userRole.includes('Staff') || userRole.includes('Faculty') || userRole.includes('Admin') || userRole.includes('Operator'))) {
            pushLog(userRole, userId, 'Entry', zone.name, 'Denied', 'Privileged zone — insufficient role (UC-01)', 'entry');
            return alert(`⚠ Access Denied: ${zone.name} is restricted to Faculty/Staff only.`);
        }

        // UC-04: Issue visitor card
        if (isVisitor) {
            window.HCMUT_DATACORE.dispenserStatus.cardsRemaining--;
            updateDispenserUI();
            const newId = 'VIS-' + Math.floor(Math.random() * 900 + 100);
            const plate = generateMockPlate();
            window.HCMUT_DATACORE.activeSessions.push({ sessionId: 'S-' + Date.now(), userId: newId, zoneId, isVisitor: true, entryTime: new Date().toISOString(), plate });
            pushLog('Visitor', newId, 'Entry', zone.name, 'Entry OK', `Temp card issued, Plate: ${plate} (UC-04)`, 'entry');
        } else {
            window.HCMUT_DATACORE.activeSessions.push({ sessionId: 'S-' + Date.now(), userId, zoneId, isVisitor: false, entryTime: new Date().toISOString(), plate: generateMockPlate() });
            pushLog(userRole, userId, 'Entry', zone.name, 'Entry OK', 'SSO validated, gate opened (UC-01)', 'entry');
        }

        zone.occupied++;
        renderMap();
        renderOperatorDashboard();
    }

    // UC-04: Operator manually issues visitor ticket
    function simulateVisitorIssue() {
        if (window.HCMUT_DATACORE.dispenserStatus.cardsRemaining <= 0) {
            return alert('⚠ Dispenser is empty. Please restock first.');
        }
        const res = confirm('Issue temporary paper ticket and open gate for unregistered visitor?');
        if (!res) return;
        window.HCMUT_DATACORE.dispenserStatus.cardsRemaining--;
        updateDispenserUI();
        const newId = 'VIS-' + Math.floor(Math.random() * 900 + 100);
        pushLog('Visitor', newId, 'Entry', 'Main Gate', 'Entry OK', 'Manually issued by operator (UC-04)', 'entry');
    }

    // UC-02: Exit
    function simulateExit() {
        const userId = document.getElementById('sim-user-select').value;
        const isVisitorSel = userId === 'VISITOR_NEW';
        const sessionIdx = window.HCMUT_DATACORE.activeSessions.findIndex(s => isVisitorSel ? s.isVisitor : s.userId === userId);

        if (sessionIdx === -1) {
            return alert('⚠ UC-02 Error: No active parking session found for this user.');
        }

        const session  = window.HCMUT_DATACORE.activeSessions[sessionIdx];
        const zone     = window.HCMUT_DATACORE.parkingZones.find(z => z.id === session.zoneId);
        const userObj  = isVisitorSel ? null : Object.values(window.HCMUT_DATACORE.users).find(u => u.id === session.userId);
        const roleType = session.isVisitor ? 'Visitor' : (userObj?.role || 'Unknown');
        const fee      = calculateFee(session);

        // UC-03: insufficient balance check
        if (userObj && userObj.balance < fee && !session.isVisitor) {
            userObj.debt += fee;
            pushLog(roleType, session.userId, 'Exit', zone.name, 'Exit OK — Debt Recorded', `Insufficient balance, debt: ${fee} VND (UC-03)`, 'exit');
        } else {
            window.HCMUT_DATACORE.transactions.unshift({
                txId: 'TX-' + Math.floor(Math.random() * 99999),
                userId: session.userId, userName: userObj?.name || 'Visitor',
                plate: session.plate || 'N/A', amount: fee,
                time: new Date().toISOString(), status: 'Completed',
                method: session.isVisitor ? 'Cash' : 'BKPay', reason: ''
            });
            pushLog(roleType, session.userId, 'Exit', zone.name, 'Exit OK', `Fee: ${fee} VND, gate opened (UC-02/03)`, 'exit');
        }

        zone.occupied = Math.max(0, zone.occupied - 1);
        window.HCMUT_DATACORE.activeSessions.splice(sessionIdx, 1);
        renderMap();
        renderOperatorDashboard();
        if (currentUser?.roleId === 'student' || currentUser?.roleId === 'staff') renderLearnerOverview();
        alert(`✅ Exit Processed.\nRole: ${roleType}\nFee: ${fee.toLocaleString('en-US')} VND\nZone: ${zone.name}`);
    }

    // UC-03 Fee Calculation
    function calculateFee(session) {
        const cfg = window.HCMUT_DATACORE.pricingConfig;
        const durationMins = (Date.now() - new Date(session.entryTime).getTime()) / 60000;
        if (durationMins <= cfg.gracePeriodMins) return 0;
        if (session.isVisitor) {
            return Math.ceil(durationMins / 60) * cfg.hourlyRate * cfg.visitorMultiplier;
        }
        const userObj = Object.values(window.HCMUT_DATACORE.users).find(u => u.id === session.userId);
        if (userObj?.roleId === 'staff') return 0;
        return Math.round(cfg.baseFee + Math.floor(durationMins / 60) * cfg.hourlyRate);
    }

    // UC-06: Exception handling
    function handleException(status, reasonPrefix) {
        const reason = prompt(`UC-06 Exception — Provide reason for [${status}]:`);
        if (reason === null) return;
        pushLog('Operator', currentUser?.id || 'OP00', 'Manual Action', 'Gate UI', status, `${reasonPrefix}: ${reason} (UC-06)`, 'manual');
    }

    // =====================================================================
    // FINANCE PANEL (UC-07, UC-08)
    // =====================================================================
    function setupFinancePanels() {
        // UC-07: Save pricing
        document.getElementById('btn-save-pricing')?.addEventListener('click', savePricingPolicy);

        // UC-08: Search refund
        document.getElementById('btn-refund-search')?.addEventListener('click', () => {
            const q = document.getElementById('refund-search').value.trim();
            renderRefundTable(q);
        });

        // UC-08: Confirm refund
        document.getElementById('btn-confirm-refund')?.addEventListener('click', confirmRefund);

        // UC-12: export
        document.getElementById('btn-export-finance-log')?.addEventListener('click', () => {
            const logs = window.HCMUT_DATACORE.recentLogs.filter(l => l.category === 'payment');
            const csv = ['Time,UserID,Action,Status,Reason', ...logs.map(l => `${l.time},${l.id},${l.action},${l.status},${l.reason}`)].join('\n');
            downloadCSV(csv, 'finance_audit_log.csv');
        });

        // Populate refund table initially
        renderRefundTable('');
    }

    function syncUIFromConfig() {
        const cfg = window.HCMUT_DATACORE.pricingConfig;
        const sp  = window.HCMUT_DATACORE.systemParams;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('cfg-base-fee', cfg.baseFee);
        setVal('cfg-hourly-rate', cfg.hourlyRate);
        setVal('cfg-grace', cfg.gracePeriodMins);
        setVal('cfg-multiplier', cfg.visitorMultiplier);
        setVal('cfg-student-sub', cfg.studentSubscription);
        setVal('cfg-staff-sub', cfg.staffSubscription);
        setVal('sp-gate-timeout', sp.gateTimeoutSecs);
        setVal('sp-alpr', sp.alprConfidenceThreshold);
        setVal('sp-grace', sp.gracePeriodMins);
        setVal('sp-iot-sync', sp.iotSyncIntervalHrs);
    }

    // UC-07: Pricing policy
    function savePricingPolicy() {
        const getNum = id => parseFloat(document.getElementById(id)?.value);
        const vals = {
            baseFee:             getNum('cfg-base-fee'),
            hourlyRate:          getNum('cfg-hourly-rate'),
            gracePeriodMins:     getNum('cfg-grace'),
            visitorMultiplier:   getNum('cfg-multiplier'),
            studentSubscription: getNum('cfg-student-sub'),
            staffSubscription:   getNum('cfg-staff-sub')
        };
        const errEl = document.getElementById('pricing-error');
        const hasInvalid = Object.values(vals).some(v => isNaN(v) || v < 0) || vals.visitorMultiplier < 1;
        if (hasInvalid) {
            if (errEl) errEl.classList.remove('hidden');
            return;
        }
        if (errEl) errEl.classList.add('hidden');
        Object.assign(window.HCMUT_DATACORE.pricingConfig, vals);
        pushLog('Finance', currentUser?.id || 'FN01', 'Config Update', 'System', 'Completed', 'Pricing policy activated globally (UC-07)', 'payment');
        renderFinanceLog();
        alert('✅ Pricing policy validated and activated globally (UC-07).');
    }

    // UC-08: Refund table
    function renderRefundTable(query) {
        const tbody = document.getElementById('refund-tbody');
        const noRes = document.getElementById('refund-no-results');
        if (!tbody) return;
        tbody.innerHTML = '';
        const q = query.toLowerCase();
        const txns = window.HCMUT_DATACORE.transactions.filter(t =>
            !q || t.txId.toLowerCase().includes(q) || t.userId.toLowerCase().includes(q) || t.plate.toLowerCase().includes(q)
        );
        if (txns.length === 0) {
            if (noRes) noRes.style.display = 'block';
            return;
        }
        if (noRes) noRes.style.display = 'none';
        txns.forEach(tx => {
            const canRefund = tx.status === 'Completed';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tx.txId}</td>
                <td>${tx.userName}<br><small class="sub-text">${tx.userId}</small></td>
                <td>${tx.amount.toLocaleString('en-US')} VND</td>
                <td><span class="badge badge-success">${tx.method}</span></td>
                <td><span class="badge ${tx.status === 'Refunded' ? 'badge-warn' : 'badge-success'}">${tx.status}</span></td>
                <td>${canRefund ? `<button class="btn btn-sm btn-outline" onclick="window._openRefundModal('${tx.txId}')">Refund</button>` : '<small class="sub-text">—</small>'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window._openRefundModal = function(txId) {
        const tx = window.HCMUT_DATACORE.transactions.find(t => t.txId === txId);
        if (!tx) return;
        pendingRefundTxId = txId;
        const details = document.getElementById('refund-tx-details');
        if (details) details.innerHTML = `
            <p><strong>TX ID:</strong> ${tx.txId}</p>
            <p><strong>User:</strong> ${tx.userName} (${tx.userId})</p>
            <p><strong>Amount:</strong> ${tx.amount.toLocaleString('en-US')} VND</p>
            <p><strong>Method:</strong> ${tx.method}</p>
        `;
        document.getElementById('refund-reason-input').value = '';
        document.getElementById('refund-modal-error')?.classList.add('hidden');
        document.getElementById('refund-modal').classList.remove('hidden');
    };

    function confirmRefund() {
        const reason = document.getElementById('refund-reason-input')?.value.trim();
        if (!reason) {
            document.getElementById('refund-modal-error')?.classList.remove('hidden');
            return;
        }
        const tx = window.HCMUT_DATACORE.transactions.find(t => t.txId === pendingRefundTxId);
        if (!tx) return;
        if (tx.status !== 'Completed') {
            alert('⚠ UC-08 Error: Transaction is not eligible for refund (already refunded or invalid).');
            return;
        }
        tx.status = 'Refunded';
        tx.reason = reason;
        pushLog('Finance', currentUser?.id || 'FN01', 'Refund', 'BKPay', 'Refunded', `${reason} — TX: ${tx.txId} (UC-08)`, 'payment');
        document.getElementById('refund-modal').classList.add('hidden');
        renderRefundTable(document.getElementById('refund-search')?.value || '');
        renderFinanceLog();
        alert(`✅ Refund of ${tx.amount.toLocaleString('en-US')} VND processed for ${tx.userName}.\nReason: ${reason}`);
    }

    // =====================================================================
    // ADMIN PANELS (UC-09, UC-11)
    // =====================================================================
    function setupAdminPanels() {
        document.getElementById('btn-user-search')?.addEventListener('click', () => {
            const q = document.getElementById('user-search')?.value.trim().toLowerCase();
            renderUserSearchResults(q);
        });

        document.getElementById('btn-save-sysparams')?.addEventListener('click', saveSysParams);

        document.getElementById('admin-log-filter-cat')?.addEventListener('change', e => {
            renderAdminLog(e.target.value);
        });

        document.getElementById('btn-export-full-log')?.addEventListener('click', () => {
            const logs = window.HCMUT_DATACORE.recentLogs;
            const csv = ['Time,Type,ID,Action,Gate,Status,Reason', ...logs.map(l => `${l.time},${l.type},${l.id},${l.action},${l.gate},${l.status},${l.reason}`)].join('\n');
            downloadCSV(csv, 'full_operational_log.csv');
        });
    }

    // UC-09: User search & role management
    function renderUserSearchResults(query) {
        const container = document.getElementById('user-search-results');
        if (!container) return;
        container.innerHTML = '';
        if (!query) { container.innerHTML = '<p class="sub-text" style="padding:0.5rem;">Enter an Employee ID or email to search.</p>'; return; }

        const results = window.HCMUT_DATACORE.userAccounts.filter(u =>
            u.empId.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            container.innerHTML = '<p class="sub-text" style="padding:0.5rem;">No user found. You may create a new account.</p>';
            return;
        }

        const roleOptions = ['student','staff','operator','finance','admin'].map(r =>
            `<option value="${r}">${window.HCMUT_DATACORE.users[r]?.role || r}</option>`
        ).join('');

        results.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-result-row';
            div.innerHTML = `
                <div>
                    <strong>${u.name}</strong> <small class="sub-text">${u.empId}</small><br>
                    <small class="sub-text">${u.email}</small>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <select class="form-input role-select-inline" data-empid="${u.empId}" style="width:auto; padding:0.4rem; font-size:0.85rem;">
                        ${roleOptions}
                    </select>
                    <button class="btn btn-sm btn-primary" onclick="window._assignRole('${u.empId}')">Assign</button>
                </div>
            `;
            // Pre-select current role
            const sel = div.querySelector('.role-select-inline');
            if (sel) sel.value = u.roleId;
            container.appendChild(div);
        });
    }

    window._assignRole = function(empId) {
        const sel = document.querySelector(`.role-select-inline[data-empid="${empId}"]`);
        if (!sel) return;
        const newRoleId = sel.value;
        const u = window.HCMUT_DATACORE.userAccounts.find(x => x.empId === empId);
        if (!u) return;
        const oldRole = u.role;
        const newRole = window.HCMUT_DATACORE.users[newRoleId]?.role || newRoleId;
        u.role = newRole; u.roleId = newRoleId;
        pushLog('Admin', currentUser?.id || 'AD99', 'Role Assignment', 'System', 'Completed', `${empId}: ${oldRole} → ${newRole} (UC-09)`, 'manual');
        renderAdminLog();
        alert(`✅ Role updated for ${u.name}: ${oldRole} → ${newRole} (UC-09). Audit log recorded.`);
    };

    // UC-11: System Parameters
    function saveSysParams() {
        const getNum = id => parseFloat(document.getElementById(id)?.value);
        const params = {
            gateTimeoutSecs:          getNum('sp-gate-timeout'),
            alprConfidenceThreshold:  getNum('sp-alpr'),
            gracePeriodMins:          getNum('sp-grace'),
            iotSyncIntervalHrs:       getNum('sp-iot-sync')
        };
        const errEl = document.getElementById('sysparam-error');
        const invalid =
            isNaN(params.gateTimeoutSecs) || params.gateTimeoutSecs < 1 || params.gateTimeoutSecs > 60 ||
            isNaN(params.alprConfidenceThreshold) || params.alprConfidenceThreshold < 50 || params.alprConfidenceThreshold > 99 ||
            isNaN(params.gracePeriodMins) || params.gracePeriodMins < 0 || params.gracePeriodMins > 120 ||
            isNaN(params.iotSyncIntervalHrs) || params.iotSyncIntervalHrs < 1;
        if (invalid) {
            if (errEl) errEl.classList.remove('hidden');
            return;
        }
        if (errEl) errEl.classList.add('hidden');
        Object.assign(window.HCMUT_DATACORE.systemParams, params);
        window.HCMUT_DATACORE.pricingConfig.gracePeriodMins = params.gracePeriodMins;
        pushLog('IT/Admin', currentUser?.id || 'AD99', 'Config Push', 'IoT Gateways', 'Completed', 'System params deployed to all gateways (UC-11)', 'manual');
        renderAdminLog();
        alert('✅ Configuration pushed to IoT Gateways successfully (UC-11).');
    }

    // =====================================================================
    // INTEGRATION STATUS (UC-10)
    // =====================================================================
    function renderIntegrationStatus(containerId) {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = '';
        window.HCMUT_DATACORE.integrations.forEach(int => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${int.name}</span><span class="${int.ok ? 'badge-success' : 'badge-error'}">${int.status}</span>`;
            list.appendChild(li);
        });
    }

    // =====================================================================
    // CSV EXPORT HELPER (UC-12)
    // =====================================================================
    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // =====================================================================
    // INIT
    // =====================================================================
    setupGateSimulator(); // pre-populate before login too for gate sim

});
