function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60000).toISOString();
}

function timeMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toLocaleTimeString('en-US', { hour12: false });
}

function buildSeed() {
  return {
    pricingConfig: {
      baseFee: 4000,
      hourlyRate: 1000,
      gracePeriodMins: 15,
      visitorMultiplier: 2.5,
      studentSubscription: 80000,
      staffSubscription: 0
    },
    systemParams: {
      gateTimeoutSecs: 10,
      alprConfidenceThreshold: 85,
      gracePeriodMins: 15,
      iotSyncIntervalHrs: 24
    },
    users: {
      student: { id: 'SV2023', name: 'Nguyen Van Learner', email: 'mock_student@hcmut.edu.vn', role: 'Learner', roleId: 'student', balance: 50000, debt: 0 },
      staff: { id: 'CB2024', name: 'Le Thi Teacher', email: 'mock_staff@hcmut.edu.vn', role: 'Faculty / Staff', roleId: 'staff', balance: 100000, debt: 0 },
      operator: { id: 'OP01', name: 'Tran Security', email: 'op@hcmut.edu.vn', role: 'Gate Operator', roleId: 'operator', balance: 0, debt: 0 },
      finance: { id: 'FN01', name: 'Pham Finance', email: 'finance@hcmut.edu.vn', role: 'Finance Officer', roleId: 'finance', balance: 0, debt: 0 },
      admin: { id: 'AD99', name: 'Admin System', email: 'admin@hcmut.edu.vn', role: 'System Admin', roleId: 'admin', balance: 0, debt: 0 }
    },
    userAccounts: [
      { empId: 'SV2023', name: 'Nguyen Van Learner', email: 'mock_student@hcmut.edu.vn', role: 'Learner', roleId: 'student' },
      { empId: 'CB2024', name: 'Le Thi Teacher', email: 'mock_staff@hcmut.edu.vn', role: 'Faculty / Staff', roleId: 'staff' },
      { empId: 'OP01', name: 'Tran Security', email: 'op@hcmut.edu.vn', role: 'Gate Operator', roleId: 'operator' },
      { empId: 'FN01', name: 'Pham Finance', email: 'finance@hcmut.edu.vn', role: 'Finance Officer', roleId: 'finance' },
      { empId: 'AD99', name: 'Admin System', email: 'admin@hcmut.edu.vn', role: 'System Admin', roleId: 'admin' },
      { empId: 'SV2101', name: 'Tran Thi Mai', email: 'sv2101@hcmut.edu.vn', role: 'Learner', roleId: 'student' },
      { empId: 'OP02', name: 'Hoang Van Gate', email: 'op02@hcmut.edu.vn', role: 'Gate Operator', roleId: 'operator' }
    ],
    parkingZones: [
      { id: 'A4', name: 'Zone A4 (Main Hall)', capacity: 400, occupied: 380, privileged: false },
      { id: 'B1', name: 'Zone B1 (Library)', capacity: 250, occupied: 120, privileged: false },
      { id: 'C5', name: 'Zone C5 (Workshop)', capacity: 350, occupied: 345, privileged: false },
      { id: 'D1', name: 'Zone D (Faculty)', capacity: 100, occupied: 45, privileged: true },
      { id: 'E2', name: 'Zone E2 (Stadium)', capacity: 500, occupied: 210, privileged: false },
      { id: 'F1', name: 'Zone F1 (Dorm)', capacity: 200, occupied: 190, privileged: false }
    ],
    activeSessions: [
      { sessionId: 'S-100', userId: 'SV2023', zoneId: 'A4', isVisitor: false, entryTime: isoMinutesAgo(65), plate: '51-A 234.56' }
    ],
    parkingHistory: {
      SV2023: [
        { sessionId: 'H-001', zoneId: 'B1', zoneName: 'Zone B1 (Library)', date: '2026-03-28', entryTime: '08:15', exitTime: '11:45', durationMins: 210, fee: 4000, method: 'BKPay', txId: 'TX-001' },
        { sessionId: 'H-002', zoneId: 'A4', zoneName: 'Zone A4 (Main Hall)', date: '2026-03-29', entryTime: '07:50', exitTime: '12:30', durationMins: 280, fee: 5000, method: 'BKPay', txId: 'TX-003' },
        { sessionId: 'H-003', zoneId: 'E2', zoneName: 'Zone E2 (Stadium)', date: '2026-03-31', entryTime: '13:00', exitTime: '15:30', durationMins: 150, fee: 4000, method: 'BKPay', txId: 'TX-005' }
      ],
      CB2024: [
        { sessionId: 'H-004', zoneId: 'D1', zoneName: 'Zone D (Faculty)', date: '2026-03-30', entryTime: '07:30', exitTime: '17:00', durationMins: 570, fee: 0, method: 'Subscription', txId: 'TX-004' }
      ]
    },
    transactions: [
      { txId: 'TX-001', userId: 'SV2023', userName: 'Nguyen Van Learner', plate: '51-A 234.56', amount: 4000, time: isoDaysAgo(3), status: 'Completed', method: 'BKPay', reason: '' },
      { txId: 'TX-002', userId: 'VIS-101', userName: 'Visitor', plate: '59-B 111.22', amount: 25000, time: isoDaysAgo(2), status: 'Completed', method: 'Cash', reason: '' },
      { txId: 'TX-003', userId: 'SV2023', userName: 'Nguyen Van Learner', plate: '51-A 234.56', amount: 5000, time: isoDaysAgo(1), status: 'Completed', method: 'BKPay', reason: '' },
      { txId: 'TX-004', userId: 'CB2024', userName: 'Le Thi Teacher', plate: '50-C 333.44', amount: 0, time: isoDaysAgo(1), status: 'Completed', method: 'Subscription', reason: '' },
      { txId: 'TX-005', userId: 'SV2023', userName: 'Nguyen Van Learner', plate: '51-A 234.56', amount: 4000, time: isoMinutesAgo(60), status: 'Completed', method: 'BKPay', reason: '' }
    ],
    recentLogs: [
      { time: timeMinutesAgo(25), type: 'Learner', id: 'SV2023', action: 'Entry', gate: 'Main Gate', status: 'Entry OK', reason: 'SSO Validated (UC-01)', category: 'entry' },
      { time: timeMinutesAgo(20), type: 'Faculty/Staff', id: 'CB2024', action: 'Entry', gate: 'Gate 2', status: 'Entry OK', reason: 'SSO Validated (UC-01)', category: 'entry' },
      { time: timeMinutesAgo(10), type: 'Visitor', id: 'VIS-101', action: 'Entry', gate: 'Main Gate', status: 'Entry OK', reason: 'Ticket Issued (UC-04)', category: 'entry' },
      { time: timeMinutesAgo(5), type: 'Visitor', id: 'VIS-101', action: 'Exit', gate: 'Exit Gate', status: 'Exit OK', reason: 'Fee: 25000 VND (UC-03)', category: 'exit' },
      { time: timeMinutesAgo(3), type: 'Finance', id: 'FN01', action: 'Refund', gate: 'System', status: 'Refunded', reason: 'Double charge correction', category: 'payment' }
    ],
    dispenserStatus: { cardsRemaining: 5 },
    integrations: [
      { name: 'HCMUT_SSO', status: 'Sync Active', ok: true },
      { name: 'HCMUT_DATACORE', status: 'Backend API', ok: true },
      { name: 'BKPay API', status: 'Mock Connected', ok: true },
      { name: 'IoT Gateway A4', status: 'Intermittent', ok: false },
      { name: 'IoT Gateway B1', status: 'Stable', ok: true },
      { name: 'IoT Gateway C5', status: 'Stable', ok: true }
    ],
    updatedAt: new Date().toISOString()
  };
}

module.exports = { buildSeed };
