// Mock data representing HCMUT_DATACORE & IoT Sensors
window.HCMUT_DATACORE = {

    // UC-07: Pricing Configuration (editable via Admin/Finance UI)
    pricingConfig: {
        baseFee: 4000,
        hourlyRate: 1000,
        gracePeriodMins: 15,
        visitorMultiplier: 2.5,
        studentSubscription: 80000,   // VND/month
        staffSubscription: 0           // free
    },

    // UC-11: System Parameters (editable by IT/Admin)
    systemParams: {
        gateTimeoutSecs: 10,
        alprConfidenceThreshold: 85,
        gracePeriodMins: 15,
        iotSyncIntervalHrs: 24
    },

    // UC-01, UC-09: Users
    users: {
        "student": { id: "SV2023", name: "Nguyen Van Learner", email: "mock_student@hcmut.edu.vn", role: "Learner", roleId: "student", balance: 50000, debt: 0 },
        "student2": { id: "SV2101", name: "Tran Thi Mai", email: "sv2101@hcmut.edu.vn", role: "Learner", roleId: "student", balance: 120000, debt: 0 },
        "student3": { id: "SV2108", name: "Pham Minh Khoa", email: "sv2108@hcmut.edu.vn", role: "Learner", roleId: "student", balance: 2000, debt: 7000 },
        "student4": { id: "SV2212", name: "Hoang Anh Minh", email: "sv2212@hcmut.edu.vn", role: "Learner", roleId: "student", balance: 75000, debt: 0 },
        "student5": { id: "SV2304", name: "Le Gia Han", email: "sv2304@hcmut.edu.vn", role: "Learner", roleId: "student", balance: 30000, debt: 0 },
        "staff":   { id: "CB2024", name: "Le Thi Teacher",    email: "mock_staff@hcmut.edu.vn",   role: "Faculty / Staff", roleId: "staff",   balance: 100000, debt: 0 },
        "staff2":  { id: "CB1188", name: "Do An Faculty",      email: "doan@hcmut.edu.vn",         role: "Faculty / Staff", roleId: "staff",   balance: 0, debt: 0 },
        "staff3":  { id: "CB2007", name: "Vo Minh Staff",      email: "vominh@hcmut.edu.vn",       role: "Faculty / Staff", roleId: "staff",   balance: 85000, debt: 0 },
        "operator":{ id: "OP01",   name: "Tran Security",     email: "op@hcmut.edu.vn",          role: "Gate Operator",   roleId: "operator", balance: 0, debt: 0 },
        "operator2":{ id: "OP02",  name: "Hoang Van Gate",    email: "op02@hcmut.edu.vn",        role: "Gate Operator",   roleId: "operator", balance: 0, debt: 0 },
        "finance": { id: "FN01",   name: "Pham Finance",      email: "finance@hcmut.edu.vn",     role: "Finance Officer", roleId: "finance",  balance: 0, debt: 0 },
        "finance2":{ id: "FN02",   name: "Dang Thu Auditor",   email: "audit@hcmut.edu.vn",       role: "Finance Officer", roleId: "finance",  balance: 0, debt: 0 },
        "itadmin": { id: "IT07",   name: "Bui Minh IT",        email: "it07@hcmut.edu.vn",        role: "System Admin",    roleId: "admin",    balance: 0, debt: 0 },
        "admin":   { id: "AD99",   name: "Admin System",      email: "admin@hcmut.edu.vn",       role: "System Admin",    roleId: "admin",    balance: 0, debt: 0 }
    },

    // UC-09: Manageable user accounts (separate from login users)
    userAccounts: [
        { empId: "SV2023", name: "Nguyen Van Learner", email: "mock_student@hcmut.edu.vn", role: "Learner",        roleId: "student",  department: "CSE - K23",        plate: "51-A 234.56", status: "Active" },
        { empId: "SV2101", name: "Tran Thi Mai",       email: "sv2101@hcmut.edu.vn",       role: "Learner",        roleId: "student",  department: "Electrical - K21", plate: "59-D1 888.21", status: "Active" },
        { empId: "SV2108", name: "Pham Minh Khoa",     email: "sv2108@hcmut.edu.vn",       role: "Learner",        roleId: "student",  department: "Logistics - K21",  plate: "60-B2 420.19", status: "Outstanding debt" },
        { empId: "SV2212", name: "Hoang Anh Minh",     email: "sv2212@hcmut.edu.vn",       role: "Learner",        roleId: "student",  department: "Mechanical - K22", plate: "51-G1 120.45", status: "Active" },
        { empId: "SV2304", name: "Le Gia Han",         email: "sv2304@hcmut.edu.vn",       role: "Learner",        roleId: "student",  department: "Architecture - K23", plate: "50-E1 908.77", status: "Pending review" },
        { empId: "CB2024", name: "Le Thi Teacher",     email: "mock_staff@hcmut.edu.vn",   role: "Faculty / Staff", roleId: "staff",    department: "Computer Science", plate: "50-C 333.44", status: "Active" },
        { empId: "CB1188", name: "Do An Faculty",      email: "doan@hcmut.edu.vn",         role: "Faculty / Staff", roleId: "staff",    department: "Civil Engineering", plate: "51-F 778.12", status: "Active" },
        { empId: "CB2007", name: "Vo Minh Staff",      email: "vominh@hcmut.edu.vn",       role: "Faculty / Staff", roleId: "staff",    department: "Library Office", plate: "52-A 909.09", status: "Active" },
        { empId: "OP01",   name: "Tran Security",      email: "op@hcmut.edu.vn",           role: "Gate Operator",   roleId: "operator", department: "Security Team", plate: "N/A", status: "On shift" },
        { empId: "OP02",   name: "Hoang Van Gate",     email: "op02@hcmut.edu.vn",         role: "Gate Operator",   roleId: "operator", department: "Security Team", plate: "N/A", status: "On shift" },
        { empId: "FN01",   name: "Pham Finance",       email: "finance@hcmut.edu.vn",      role: "Finance Officer", roleId: "finance",  department: "Finance Office", plate: "N/A", status: "Active" },
        { empId: "FN02",   name: "Dang Thu Auditor",   email: "audit@hcmut.edu.vn",        role: "Finance Officer", roleId: "finance",  department: "Finance Office", plate: "N/A", status: "Active" },
        { empId: "IT07",   name: "Bui Minh IT",        email: "it07@hcmut.edu.vn",         role: "System Admin",    roleId: "admin",    department: "IT Operations", plate: "N/A", status: "Active" },
        { empId: "AD99",   name: "Admin System",       email: "admin@hcmut.edu.vn",        role: "System Admin",    roleId: "admin",    department: "System", plate: "N/A", status: "Active" }
    ],

    // UC-01: Parking Zones
    parkingZones: [
        { id: "A4", name: "Zone A4 (Main Hall)",  capacity: 400, occupied: 380, privileged: false },
        { id: "B1", name: "Zone B1 (Library)",    capacity: 250, occupied: 120, privileged: false },
        { id: "C5", name: "Zone C5 (Workshop)",   capacity: 350, occupied: 345, privileged: false },
        { id: "D1", name: "Zone D (Faculty)",     capacity: 100, occupied: 45,  privileged: true  },
        { id: "E2", name: "Zone E2 (Stadium)",    capacity: 500, occupied: 210, privileged: false },
        { id: "F1", name: "Zone F1 (Dorm)",       capacity: 200, occupied: 190, privileged: false }
    ],

    // UC-01/02: Active Sessions
    activeSessions: [
        { sessionId: "S-100", userId: "SV2023", zoneId: "A4", isVisitor: false, entryTime: new Date(Date.now() - 65*60000).toISOString(), plate: "51-A 234.56" },
        { sessionId: "S-101", userId: "SV2108", zoneId: "B1", isVisitor: false, entryTime: new Date(Date.now() - 25*60000).toISOString(), plate: "60-B2 420.19" },
        { sessionId: "S-102", userId: "CB1188", zoneId: "D1", isVisitor: false, entryTime: new Date(Date.now() - 155*60000).toISOString(), plate: "51-F 778.12" },
        { sessionId: "S-103", userId: "VIS-204", zoneId: "E2", isVisitor: true, entryTime: new Date(Date.now() - 90*60000).toISOString(), plate: "62-C 310.08" }
    ],

    // UC-13: Personal Parking History (per user)
    parkingHistory: {
        "SV2023": [
            { sessionId: "H-001", zoneId: "B1", zoneName: "Zone B1 (Library)", date: "2026-03-28", entryTime: "08:15", exitTime: "11:45", durationMins: 210, fee: 4000, method: "BKPay", txId: "TX-001" },
            { sessionId: "H-002", zoneId: "A4", zoneName: "Zone A4 (Main Hall)", date: "2026-03-29", entryTime: "07:50", exitTime: "12:30", durationMins: 280, fee: 5000, method: "BKPay", txId: "TX-003" },
            { sessionId: "H-003", zoneId: "E2", zoneName: "Zone E2 (Stadium)", date: "2026-03-31", entryTime: "13:00", exitTime: "15:30", durationMins: 150, fee: 4000, method: "BKPay", txId: "TX-005" }
        ],
        "CB2024": [
            { sessionId: "H-004", zoneId: "D1", zoneName: "Zone D (Faculty)", date: "2026-03-30", entryTime: "07:30", exitTime: "17:00", durationMins: 570, fee: 0, method: "Subscription", txId: "TX-004" }
        ],
        "SV2101": [
            { sessionId: "H-005", zoneId: "F1", zoneName: "Zone F1 (Dorm)", date: "2026-04-01", entryTime: "18:20", exitTime: "21:05", durationMins: 165, fee: 4000, method: "BKPay", txId: "TX-006" },
            { sessionId: "H-006", zoneId: "B1", zoneName: "Zone B1 (Library)", date: "2026-04-02", entryTime: "09:10", exitTime: "10:40", durationMins: 90, fee: 4000, method: "BKPay", txId: "TX-007" }
        ],
        "SV2108": [
            { sessionId: "H-007", zoneId: "C5", zoneName: "Zone C5 (Workshop)", date: "2026-04-03", entryTime: "13:30", exitTime: "18:20", durationMins: 290, fee: 5000, method: "BKPay", txId: "TX-008" },
            { sessionId: "H-008", zoneId: "A4", zoneName: "Zone A4 (Main Hall)", date: "2026-04-04", entryTime: "08:00", exitTime: "12:15", durationMins: 255, fee: 5000, method: "Debt", txId: "TX-009" }
        ],
        "CB1188": [
            { sessionId: "H-009", zoneId: "D1", zoneName: "Zone D (Faculty)", date: "2026-04-02", entryTime: "07:45", exitTime: "16:30", durationMins: 525, fee: 0, method: "Subscription", txId: "TX-010" }
        ],
        "CB2007": [
            { sessionId: "H-010", zoneId: "D1", zoneName: "Zone D (Faculty)", date: "2026-04-05", entryTime: "08:25", exitTime: "17:10", durationMins: 525, fee: 0, method: "Subscription", txId: "TX-011" }
        ]
    },

    // UC-03/08: Transactions
    transactions: [
        { txId: "TX-001", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 4000,  time: new Date(Date.now() - 3*24*60*60000).toISOString(), status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-002", userId: "VIS-101", userName: "Visitor",           plate: "59-B 111.22", amount: 25000, time: new Date(Date.now() - 2*24*60*60000).toISOString(), status: "Completed",  method: "Cash",     reason: "" },
        { txId: "TX-003", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 5000,  time: new Date(Date.now() - 1*24*60*60000).toISOString(), status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-004", userId: "CB2024", userName: "Le Thi Teacher",     plate: "50-C 333.44", amount: 0,    time: new Date(Date.now() - 1*24*60*60000).toISOString(), status: "Completed",  method: "Subscription", reason: "" },
        { txId: "TX-005", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 4000, time: new Date(Date.now() - 60*60000).toISOString(),         status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-006", userId: "SV2101", userName: "Tran Thi Mai",       plate: "59-D1 888.21", amount: 4000, time: new Date(Date.now() - 18*60*60000).toISOString(),     status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-007", userId: "SV2101", userName: "Tran Thi Mai",       plate: "59-D1 888.21", amount: 4000, time: new Date(Date.now() - 14*60*60000).toISOString(),     status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-008", userId: "SV2108", userName: "Pham Minh Khoa",     plate: "60-B2 420.19", amount: 5000, time: new Date(Date.now() - 10*60*60000).toISOString(),     status: "Refunded",   method: "BKPay",    reason: "Duplicate scan at Gate 2" },
        { txId: "TX-009", userId: "SV2108", userName: "Pham Minh Khoa",     plate: "60-B2 420.19", amount: 5000, time: new Date(Date.now() - 8*60*60000).toISOString(),      status: "Completed",  method: "Debt",     reason: "Insufficient BKPay balance" },
        { txId: "TX-010", userId: "CB1188", userName: "Do An Faculty",      plate: "51-F 778.12", amount: 0,    time: new Date(Date.now() - 6*60*60000).toISOString(),      status: "Completed",  method: "Subscription", reason: "" },
        { txId: "TX-011", userId: "CB2007", userName: "Vo Minh Staff",      plate: "52-A 909.09", amount: 0,    time: new Date(Date.now() - 5*60*60000).toISOString(),      status: "Completed",  method: "Subscription", reason: "" },
        { txId: "TX-012", userId: "VIS-204", userName: "Visitor",           plate: "62-C 310.08", amount: 12500, time: new Date(Date.now() - 45*60000).toISOString(),         status: "Completed",  method: "Cash",     reason: "" }
    ],

    // UC-06/12: Operational Logs
    recentLogs: [
        { time: new Date(Date.now()-25*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Learner",       id: "SV2023", action: "Entry", gate: "Main Gate",  status: "Entry OK",  reason: "SSO Validated (UC-01)",      category: "entry" },
        { time: new Date(Date.now()-20*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Faculty/Staff", id: "CB2024", action: "Entry", gate: "Gate 2",     status: "Entry OK",  reason: "SSO Validated (UC-01)",      category: "entry" },
        { time: new Date(Date.now()-10*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Visitor",       id: "VIS-101",action: "Entry", gate: "Main Gate",  status: "Entry OK",  reason: "Ticket Issued (UC-04)",       category: "entry" },
        { time: new Date(Date.now()-5*60000).toLocaleTimeString('en-US',{hour12:false}),  type: "Visitor",       id: "VIS-101",action: "Exit",  gate: "Exit Gate",  status: "Exit OK",   reason: "Fee: 25000 VND (UC-03)",      category: "exit"  },
        { time: new Date(Date.now()-3*60000).toLocaleTimeString('en-US',{hour12:false}),  type: "Finance",       id: "FN01",   action: "Refund","gate": "System",    status: "Refunded",  reason: "Double charge correction",    category: "payment" },
        { time: new Date(Date.now()-2*60000).toLocaleTimeString('en-US',{hour12:false}),  type: "Learner",       id: "SV2108", action: "Entry", gate: "Gate 2",     status: "Entry OK",  reason: "Low balance warning issued",  category: "entry" },
        { time: new Date(Date.now()-90*1000).toLocaleTimeString('en-US',{hour12:false}),  type: "Faculty/Staff", id: "CB1188", action: "Entry", gate: "Faculty Gate", status: "Entry OK", reason: "Privileged zone access granted", category: "entry" },
        { time: new Date(Date.now()-45*1000).toLocaleTimeString('en-US',{hour12:false}),  type: "Admin",         id: "IT07",   action: "Role Review", "gate": "System", status: "Completed", reason: "Demo account directory refreshed", category: "manual" }
    ],

    // UC-04: Card Dispenser
    dispenserStatus: { cardsRemaining: 5 },

    // UC-10: Integration status
    integrations: [
        { name: "HCMUT_SSO",     status: "Sync Active",    ok: true  },
        { name: "HCMUT_DATACORE",status: "Read-Only OK",   ok: true  },
        { name: "BKPay API",     status: "Connected",      ok: true  },
        { name: "IoT Gateway A4",status: "Intermittent",   ok: false },
        { name: "IoT Gateway B1",status: "Stable",         ok: true  },
        { name: "IoT Gateway C5",status: "Stable",         ok: true  }
    ]
};
