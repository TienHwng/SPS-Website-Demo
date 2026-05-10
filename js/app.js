document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // STATE
    // =====================================================================
    let currentUser = null;
    let liveInterval = null;
    let pendingRefundTxId = null;
    let gateSimulatorBound = false;
    let adminPanelsBound = false;
    let financePanelsBound = false;

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

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function formatVnd(value) {
        return `${Number(value || 0).toLocaleString('en-US')} VND`;
    }

    function csvCell(value) {
        const str = String(value ?? '');
        return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    }

    function toCSV(rows) {
        return rows.map(row => row.map(csvCell).join(',')).join('\n');
    }

    function createTransaction({ userId, userName, plate, amount, method, status = 'Completed', reason = '' }) {
        window.HCMUT_DATACORE.transactions.unshift({
            txId: 'TX-' + Math.floor(Math.random() * 99999).toString().padStart(5, '0'),
            userId,
            userName,
            plate,
            amount,
            time: new Date().toISOString(),
            status,
            method,
            reason
        });
    }

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
        if (liveInterval) {
            clearInterval(liveInterval);
            liveInterval = null;
        }
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
        const user = currentUser;
        const session = user
            ? window.HCMUT_DATACORE.activeSessions.find(s => s.userId === user.id)
            : null;
        const fee = session ? calculateOutstandingFee(session) : 0;

        if (user && fee > 0) {
            const unpaid = Math.max(0, fee - user.balance);
            user.balance = Math.max(0, user.balance - fee);
            user.debt += unpaid;
            if (session) session.paidAmount = (session.paidAmount || 0) + fee;
            createTransaction({
                userId: user.id,
                userName: user.name,
                plate: session?.plate || 'N/A',
                amount: fee,
                method: 'BKPay'
            });
        }
        pushLog('Payment', user?.id || 'N/A', 'BKPay', 'System', 'Completed', `Amount: ${formatVnd(fee)}`, 'payment');
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
        if (balEl) balEl.textContent = formatVnd(currentUser.balance);

        // Current session
        const session = window.HCMUT_DATACORE.activeSessions.find(s => s.userId === currentUser.id);
        const sessionEl = document.getElementById('stu-session-time');
        const entryEl   = document.getElementById('stu-entry-time');
        const feeEl     = document.getElementById('stu-accrued-fee');
        if (session) {
            const mins = Math.floor((Date.now() - new Date(session.entryTime).getTime()) / 60000);
            if (sessionEl) sessionEl.textContent = `${Math.floor(mins/60)}h ${mins%60}m`;
            if (entryEl) entryEl.textContent = new Date(session.entryTime).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
            const fee = calculateOutstandingFee(session);
            if (feeEl) feeEl.textContent = formatVnd(fee);
            const amtEl = document.getElementById('bkpay-amount');
            if (amtEl) amtEl.textContent = formatVnd(fee);
            const balDisp = document.getElementById('bkpay-balance');
            if (balDisp) balDisp.textContent = formatVnd(currentUser.balance);
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
                <td>${escapeHtml(h.date)}</td>
                <td>${escapeHtml(h.zoneName)}</td>
                <td>${hrs}h ${mins}m</td>
                <td>${formatVnd(h.fee)}</td>
                <td><span class="badge badge-success">${escapeHtml(h.method)}</span></td>
                <td><button class="btn btn-sm btn-outline" type="button">View</button></td>
            `;
            tr.querySelector('button')?.addEventListener('click', () => window._showReceipt(h.sessionId));
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
                <div class="receipt-row"><span>Transaction ID</span><strong>${escapeHtml(h.txId)}</strong></div>
                <div class="receipt-row"><span>Date</span><strong>${escapeHtml(h.date)}</strong></div>
                <div class="receipt-row"><span>Zone</span><strong>${escapeHtml(h.zoneName)}</strong></div>
                <div class="receipt-row"><span>Entry</span><strong>${escapeHtml(h.entryTime)}</strong></div>
                <div class="receipt-row"><span>Exit</span><strong>${escapeHtml(h.exitTime)}</strong></div>
                <div class="receipt-row"><span>Duration</span><strong>${Math.floor(h.durationMins/60)}h ${h.durationMins%60}m</strong></div>
                <div class="receipt-row total"><span>Total Fee</span><strong>${formatVnd(h.fee)}</strong></div>
                <div class="receipt-row"><span>Method</span><strong>${escapeHtml(h.method)}</strong></div>
                <div class="receipt-footer">Thank you for using HCMUT Smart Parking</div>
            </div>
        `;
        document.getElementById('receipt-modal').classList.remove('hidden');
    };

    document.getElementById('btn-export-history')?.addEventListener('click', () => {
        if (!currentUser) return;
        const history = window.HCMUT_DATACORE.parkingHistory[currentUser.id] || [];
        const csv = toCSV([
            ['Date', 'Zone', 'Duration(min)', 'Fee(VND)', 'Method', 'TxID'],
            ...history.map(h => [h.date, h.zoneName, h.durationMins, h.fee, h.method, h.txId])
        ]);
        downloadCSV(csv, `parking_history_${currentUser.id}.csv`);
    });

    // =====================================================================
    // LIVE SIMULATION
    // =====================================================================
    function startLiveSimulation() {
        if (liveInterval) clearInterval(liveInterval);
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
                        <span>${escapeHtml(z.name)}${z.privileged ? ' <i class="bx bx-lock-alt" title="Privileged"></i>' : ''}</span>
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
        document.getElementById('zone-modal-title').innerHTML = `<i class='bx bx-map-pin'></i> ${escapeHtml(zone.name)} — Spot Map`;
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
                    ? `<span>P-${i+1}</span><div class="spot-plate">${escapeHtml(generateMockPlate())}</div>`
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
                <td>${escapeHtml(log.time)}</td>
                <td>${escapeHtml(log.type)}<br><small class="sub-text">${escapeHtml(log.id)}</small></td>
                <td>${escapeHtml(log.gate)}<br><small class="sub-text">${escapeHtml(log.action)}</small></td>
                <td><span class="badge ${ok ? 'badge-success' : 'badge-error'}">${escapeHtml(log.status)}</span><br><small class="sub-text">${escapeHtml(log.reason || '')}</small></td>
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
                <td>${escapeHtml(log.time)}</td>
                <td>${escapeHtml(log.type)}<br><small class="sub-text">${escapeHtml(log.id)}</small></td>
                <td>${escapeHtml(log.action)}</td>
                <td><span class="badge ${ok ? 'badge-success' : 'badge-error'}">${escapeHtml(log.status)}</span></td>
                <td><small class="sub-text">${escapeHtml(log.reason || '—')}</small></td>
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
                    <td>${escapeHtml(log.time)}</td>
                    <td>${escapeHtml(log.id)}</td>
                    <td>${escapeHtml(log.action)}</td>
                    <td><span class="badge badge-success">${escapeHtml(log.status)}</span></td>
                    <td><small class="sub-text">${escapeHtml(log.reason || '—')}</small></td>
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
                <span>[${escapeHtml(z.id)}] ${escapeHtml(z.name.toUpperCase())}</span>
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
        }

        if (!gateSimulatorBound) {
            logFilter?.addEventListener('change', () => renderActivityLog(logFilter.value));
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
            document.getElementById('btn-issue-visitor')?.addEventListener('click', simulateVisitorIssue);
            gateSimulatorBound = true;
        }

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
        if (!zone) return alert('⚠ Access Denied: Target zone was not found.');

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
            const activeSession = window.HCMUT_DATACORE.activeSessions.find(s => s.userId === userId);
            if (activeSession) {
                pushLog(userRole, userId, 'Entry', zone.name, 'Denied', 'User already has an active parking session', 'entry');
                return alert('⚠ Access Denied: This user already has an active parking session.');
            }
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
        const zoneId = document.getElementById('sim-zone-select')?.value;
        const zone = window.HCMUT_DATACORE.parkingZones.find(z => z.id === zoneId)
            || window.HCMUT_DATACORE.parkingZones.find(z => !z.privileged && z.occupied < z.capacity);
        if (!zone) return alert('⚠ No available public zone for visitor ticket issue.');
        if (zone.privileged) return alert(`⚠ Access Denied: ${zone.name} is restricted to Faculty/Staff only.`);
        if (zone.occupied >= zone.capacity) return alert(`⚠ Access Denied: ${zone.name} is at full capacity.`);

        const res = confirm('Issue temporary paper ticket and open gate for unregistered visitor?');
        if (!res) return;
        window.HCMUT_DATACORE.dispenserStatus.cardsRemaining--;
        updateDispenserUI();
        const newId = 'VIS-' + Math.floor(Math.random() * 900 + 100);
        const plate = generateMockPlate();
        window.HCMUT_DATACORE.activeSessions.push({ sessionId: 'S-' + Date.now(), userId: newId, zoneId: zone.id, isVisitor: true, entryTime: new Date().toISOString(), plate });
        zone.occupied++;
        pushLog('Visitor', newId, 'Entry', zone.name, 'Entry OK', `Manually issued by operator, Plate: ${plate} (UC-04)`, 'entry');
        renderMap();
        renderOperatorDashboard();
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
        const fee      = calculateOutstandingFee(session);
        if (!zone) return alert('⚠ UC-02 Error: Session zone was not found.');

        // UC-03: insufficient balance check
        if (userObj && userObj.balance < fee && !session.isVisitor) {
            const unpaid = fee - userObj.balance;
            userObj.balance = 0;
            userObj.debt += unpaid;
            pushLog(roleType, session.userId, 'Exit', zone.name, 'Exit OK — Debt Recorded', `Insufficient balance, debt: ${formatVnd(unpaid)} (UC-03)`, 'exit');
        } else {
            if (userObj && !session.isVisitor) userObj.balance = Math.max(0, userObj.balance - fee);
            createTransaction({
                userId: session.userId,
                userName: userObj?.name || 'Visitor',
                plate: session.plate || 'N/A',
                amount: fee,
                method: session.isVisitor ? 'Cash' : 'BKPay'
            });
            pushLog(roleType, session.userId, 'Exit', zone.name, 'Exit OK', `Fee: ${formatVnd(fee)}, gate opened (UC-02/03)`, 'exit');
        }

        zone.occupied = Math.max(0, zone.occupied - 1);
        window.HCMUT_DATACORE.activeSessions.splice(sessionIdx, 1);
        renderMap();
        renderOperatorDashboard();
        if (currentUser?.roleId === 'student' || currentUser?.roleId === 'staff') renderLearnerOverview();
        alert(`✅ Exit Processed.\nRole: ${roleType}\nFee: ${formatVnd(fee)}\nZone: ${zone.name}`);
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

    function calculateOutstandingFee(session) {
        return Math.max(0, calculateFee(session) - (session.paidAmount || 0));
    }

    // UC-06: Exception handling
    function handleException(status, reasonPrefix) {
        const reason = prompt(`UC-06 Exception — Provide reason for [${status}]:`);
        if (reason === null) return;
        pushLog('Operator', currentUser?.id || 'OP00', 'Manual Action', 'Gate UI', status, `${reasonPrefix}: ${reason} (UC-06)`, 'manual');
    }

    // =====================================================================
    // FINANCE PANEL (UC-07, UC-08, UC-12)
    // =====================================================================
    function setupFinancePanels() {
        if (financePanelsBound) {
            renderRefundTable('');
            return;
        }

        // UC-07: Activate pricing
        document.getElementById('btn-save-pricing')?.addEventListener('click', activatePricingPolicy);

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
            const csv = toCSV([
                ['Time', 'UserID', 'Action', 'Status', 'Reason'],
                ...logs.map(l => [l.time, l.id, l.action, l.status, l.reason])
            ]);
            downloadCSV(csv, 'finance_audit_log.csv');
        });

        financePanelsBound = true;

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

    // UC-07: Pricing policy activation without validation workflow
    function activatePricingPolicy() {
        const cfg = window.HCMUT_DATACORE.pricingConfig;
        const getNum = (id, fallback) => {
            const val = parseFloat(document.getElementById(id)?.value);
            return Number.isFinite(val) ? val : fallback;
        };

        Object.assign(cfg, {
            baseFee:             getNum('cfg-base-fee', cfg.baseFee),
            hourlyRate:          getNum('cfg-hourly-rate', cfg.hourlyRate),
            gracePeriodMins:     getNum('cfg-grace', cfg.gracePeriodMins),
            visitorMultiplier:   getNum('cfg-multiplier', cfg.visitorMultiplier),
            studentSubscription: getNum('cfg-student-sub', cfg.studentSubscription),
            staffSubscription:   getNum('cfg-staff-sub', cfg.staffSubscription)
        });

        pushLog('Finance', currentUser?.id || 'FN01', 'Config Update', 'System', 'Completed', 'Pricing policy activated globally (UC-07)', 'payment');
        renderFinanceLog();
        renderLearnerOverview();
        alert('✅ Pricing policy activated globally (UC-07).');
    }

    // UC-08: Refund table
    function renderRefundTable(query) {
        const tbody = document.getElementById('refund-tbody');
        const noRes = document.getElementById('refund-no-results');
        if (!tbody) return;
        tbody.innerHTML = '';
        const q = String(query || '').toLowerCase();
        const txns = window.HCMUT_DATACORE.transactions.filter(t =>
            !q ||
            String(t.txId || '').toLowerCase().includes(q) ||
            String(t.userId || '').toLowerCase().includes(q) ||
            String(t.plate || '').toLowerCase().includes(q)
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
                <td>${escapeHtml(tx.txId)}</td>
                <td>${escapeHtml(tx.userName)}<br><small class="sub-text">${escapeHtml(tx.userId)}</small></td>
                <td>${formatVnd(tx.amount)}</td>
                <td><span class="badge badge-success">${escapeHtml(tx.method)}</span></td>
                <td><span class="badge ${tx.status === 'Refunded' ? 'badge-warn' : 'badge-success'}">${escapeHtml(tx.status)}</span></td>
                <td>${canRefund ? '<button class="btn btn-sm btn-outline" type="button">Refund</button>' : '<small class="sub-text">—</small>'}</td>
            `;
            tr.querySelector('button')?.addEventListener('click', () => window._openRefundModal(tx.txId));
            tbody.appendChild(tr);
        });
    }

    window._openRefundModal = function(txId) {
        const tx = window.HCMUT_DATACORE.transactions.find(t => t.txId === txId);
        if (!tx) return;
        pendingRefundTxId = txId;
        const details = document.getElementById('refund-tx-details');
        if (details) details.innerHTML = `
            <p><strong>TX ID:</strong> ${escapeHtml(tx.txId)}</p>
            <p><strong>User:</strong> ${escapeHtml(tx.userName)} (${escapeHtml(tx.userId)})</p>
            <p><strong>Amount:</strong> ${formatVnd(tx.amount)}</p>
            <p><strong>Method:</strong> ${escapeHtml(tx.method)}</p>
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
        alert(`✅ Refund of ${formatVnd(tx.amount)} processed for ${tx.userName}.\nReason: ${reason}`);
    }

    // =====================================================================
    // ADMIN PANELS (UC-09, UC-11)
    // =====================================================================
    function setupAdminPanels() {
        if (adminPanelsBound) return;

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
            const csv = toCSV([
                ['Time', 'Type', 'ID', 'Action', 'Gate', 'Status', 'Reason'],
                ...logs.map(l => [l.time, l.type, l.id, l.action, l.gate, l.status, l.reason])
            ]);
            downloadCSV(csv, 'full_operational_log.csv');
        });

        adminPanelsBound = true;
    }

    // UC-09: User search & role management
    function renderUserSearchResults(query) {
        const container = document.getElementById('user-search-results');
        if (!container) return;
        container.innerHTML = '';
        const q = String(query || '').toLowerCase();
        if (!q) { container.innerHTML = '<p class="sub-text" style="padding:0.5rem;">Enter an Employee ID or email to search.</p>'; return; }

        const results = window.HCMUT_DATACORE.userAccounts.filter(u =>
            String(u.empId || '').toLowerCase().includes(q) ||
            String(u.email || '').toLowerCase().includes(q) ||
            String(u.name || '').toLowerCase().includes(q)
        );

        if (results.length === 0) {
            container.innerHTML = '<p class="sub-text" style="padding:0.5rem;">No user found. You may create a new account.</p>';
            return;
        }

        const roleOptions = ['student','staff','operator','finance','admin'].map(r =>
            `<option value="${escapeHtml(r)}">${escapeHtml(window.HCMUT_DATACORE.users[r]?.role || r)}</option>`
        ).join('');

        results.forEach(u => {
            const div = document.createElement('div');
            div.className = 'user-result-row';
            div.innerHTML = `
                <div>
                    <strong>${escapeHtml(u.name)}</strong> <small class="sub-text">${escapeHtml(u.empId)}</small><br>
                    <small class="sub-text">${escapeHtml(u.email)}</small>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <select class="form-input role-select-inline" data-empid="${escapeHtml(u.empId)}" style="width:auto; padding:0.4rem; font-size:0.85rem;">
                        ${roleOptions}
                    </select>
                    <button class="btn btn-sm btn-primary" type="button">Assign</button>
                </div>
            `;
            // Pre-select current role
            const sel = div.querySelector('.role-select-inline');
            if (sel) sel.value = u.roleId;
            div.querySelector('button')?.addEventListener('click', () => window._assignRole(u.empId));
            container.appendChild(div);
        });
    }

    window._assignRole = function(empId) {
        const sel = Array.from(document.querySelectorAll('.role-select-inline')).find(el => el.dataset.empid === empId);
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
            li.innerHTML = `<span>${escapeHtml(int.name)}</span><span class="${int.ok ? 'badge-success' : 'badge-error'}">${escapeHtml(int.status)}</span>`;
            list.appendChild(li);
        });
    }

    // =====================================================================
    // CSV EXPORT HELPER (UC-12)
    // =====================================================================
    function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    // =====================================================================
    // INIT
    // =====================================================================
    setupGateSimulator(); // pre-populate before login too for gate sim

});
