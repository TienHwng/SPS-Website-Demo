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
        "staff":   { id: "CB2024", name: "Le Thi Teacher",    email: "mock_staff@hcmut.edu.vn",   role: "Faculty / Staff", roleId: "staff",   balance: 100000, debt: 0 },
        "operator":{ id: "OP01",   name: "Tran Security",     email: "op@hcmut.edu.vn",          role: "Gate Operator",   roleId: "operator", balance: 0, debt: 0 },
        "finance": { id: "FN01",   name: "Pham Finance",      email: "finance@hcmut.edu.vn",     role: "Finance Officer", roleId: "finance",  balance: 0, debt: 0 },
        "admin":   { id: "AD99",   name: "Admin System",      email: "admin@hcmut.edu.vn",       role: "System Admin",    roleId: "admin",    balance: 0, debt: 0 }
    },

    // UC-09: Manageable user accounts (separate from login users)
    userAccounts: [
        { empId: "SV2023", name: "Nguyen Van Learner", email: "mock_student@hcmut.edu.vn", role: "Learner",        roleId: "student"  },
        { empId: "CB2024", name: "Le Thi Teacher",    email: "mock_staff@hcmut.edu.vn",   role: "Faculty / Staff", roleId: "staff"    },
        { empId: "OP01",   name: "Tran Security",     email: "op@hcmut.edu.vn",          role: "Gate Operator",   roleId: "operator" },
        { empId: "FN01",   name: "Pham Finance",      email: "finance@hcmut.edu.vn",     role: "Finance Officer", roleId: "finance"  },
        { empId: "AD99",   name: "Admin System",      email: "admin@hcmut.edu.vn",       role: "System Admin",    roleId: "admin"    },
        { empId: "SV2101", name: "Tran Thi Mai",      email: "sv2101@hcmut.edu.vn",      role: "Learner",         roleId: "student"  },
        { empId: "OP02",   name: "Hoang Van Gate",    email: "op02@hcmut.edu.vn",        role: "Gate Operator",   roleId: "operator" }
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
        { sessionId: "S-100", userId: "SV2023", zoneId: "A4", isVisitor: false, entryTime: new Date(Date.now() - 65*60000).toISOString(), plate: "51-A 234.56" }
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
        ]
    },

    // UC-03/08: Transactions
    transactions: [
        { txId: "TX-001", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 4000,  time: new Date(Date.now() - 3*24*60*60000).toISOString(), status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-002", userId: "VIS-101", userName: "Visitor",           plate: "59-B 111.22", amount: 25000, time: new Date(Date.now() - 2*24*60*60000).toISOString(), status: "Completed",  method: "Cash",     reason: "" },
        { txId: "TX-003", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 5000,  time: new Date(Date.now() - 1*24*60*60000).toISOString(), status: "Completed",  method: "BKPay",    reason: "" },
        { txId: "TX-004", userId: "CB2024", userName: "Le Thi Teacher",     plate: "50-C 333.44", amount: 0,    time: new Date(Date.now() - 1*24*60*60000).toISOString(), status: "Completed",  method: "Subscription", reason: "" },
        { txId: "TX-005", userId: "SV2023", userName: "Nguyen Van Learner", plate: "51-A 234.56", amount: 4000, time: new Date(Date.now() - 60*60000).toISOString(),         status: "Completed",  method: "BKPay",    reason: "" }
    ],

    // UC-06/12: Operational Logs
    recentLogs: [
        { time: new Date(Date.now()-25*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Learner",       id: "SV2023", action: "Entry", gate: "Main Gate",  status: "Entry OK",  reason: "SSO Validated (UC-01)",      category: "entry" },
        { time: new Date(Date.now()-20*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Faculty/Staff", id: "CB2024", action: "Entry", gate: "Gate 2",     status: "Entry OK",  reason: "SSO Validated (UC-01)",      category: "entry" },
        { time: new Date(Date.now()-10*60000).toLocaleTimeString('en-US',{hour12:false}), type: "Visitor",       id: "VIS-101",action: "Entry", gate: "Main Gate",  status: "Entry OK",  reason: "Ticket Issued (UC-04)",       category: "entry" },
        { time: new Date(Date.now()-5*60000).toLocaleTimeString('en-US',{hour12:false}),  type: "Visitor",       id: "VIS-101",action: "Exit",  gate: "Exit Gate",  status: "Exit OK",   reason: "Fee: 25000 VND (UC-03)",      category: "exit"  },
        { time: new Date(Date.now()-3*60000).toLocaleTimeString('en-US',{hour12:false}),  type: "Finance",       id: "FN01",   action: "Refund","gate": "System",    status: "Refunded",  reason: "Double charge correction",    category: "payment" }
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
