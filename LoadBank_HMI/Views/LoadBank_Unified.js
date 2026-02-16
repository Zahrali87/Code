/**
 * LoadBank.js - Unified HMI Controller
 * =====================================
 * ONE file for ALL pages - Just organized, NO changes to shapes/sizes/colors
 * 
 * UPDATED: Added Recipe page handler and power status color for ALL mode pages
 * 
 * Control IDs preserved EXACTLY as in your .view files
 * PLC symbols matched EXACTLY to your GVLs
 * 
 * Usage: Add to each page's CodeBehind, call LoadBank.init('PageName')
 * Pages: Desktop, Auto, Numeric, Reverse, Manual, Recipe, Maint, Steps, Trends, Alarms
 */

var LoadBank = (function (TcHmi) {
    'use strict';

    // =========================================================================
    // PLC SYMBOLS - EXACT MATCH TO YOUR GVLs
    // =========================================================================
    var SYMBOLS = {
        // GVL_LoadBank_Constants
        tcCount: 'GVL_LoadBank_Constants.LB_NUMBER_OF_TCS',
        stepCount: 'GVL_LoadBank_Constants.LB_NUMBER_OF_STEPS',
        stepPower: 'GVL_LoadBank_Constants.LB_STEP_POWER',

        // GVL_LoadBank_Persistent
        inletEnabled: 'GVL_LoadBank_Persistent.LB_HMI_Config_Inlet_Enabled',
        modeAutoEnabled: 'GVL_LoadBank_Persistent.LB_HMI_Config_Mode_Auto',
        modeReverseEnabled: 'GVL_LoadBank_Persistent.LB_HMI_Config_Mode_Reverse',
        modeManualEnabled: 'GVL_LoadBank_Persistent.LB_HMI_Config_Mode_Manual',

        // GVL_LoadBank_IO - Temperature
        tempTC: 'GVL_LoadBank_IO.IO_Temperature_TC',
        tempInlet: 'GVL_LoadBank_IO.IO_Temperature_Inlet',

        // GVL_LoadBank_IO - Electrical
        voltageL12: 'GVL_LoadBank_IO.IO_Voltage_L1_L2',
        voltageL23: 'GVL_LoadBank_IO.IO_Voltage_L2_L3',
        voltageL31: 'GVL_LoadBank_IO.IO_Voltage_L3_L1',
        currentI1: 'GVL_LoadBank_IO.IO_Current_L1',
        currentI2: 'GVL_LoadBank_IO.IO_Current_L2',
        currentI3: 'GVL_LoadBank_IO.IO_Current_L3',
        frequency: 'GVL_LoadBank_IO.IO_Frequency',
        powerFactor: 'GVL_LoadBank_IO.IO_Power_Factor',
        externalPower: 'GVL_LoadBank_IO.IO_External_Power_kW',
        totalPower: 'GVL_LoadBank_IO.IO_Total_Power_kW',       // NEW

        // GVL_LoadBank_Runtime - Mode Control
        modeSelect: 'GVL_LoadBank_Runtime.HMI_Mode_Select',
        modeCurrent: 'GVL_LoadBank_Runtime.Mode_Current',
        masterEnable: 'GVL_LoadBank_Runtime.HMI_Master_Enable',
        fanStart: 'GVL_LoadBank_Runtime.HMI_Fan_Start',
        resetCmd: 'GVL_LoadBank_Runtime.HMI_Reset_Cmd',

        // GVL_LoadBank_Runtime - Power
        releasedPower: 'GVL_LoadBank_Runtime.Released_Power_kW',
        targetPower: 'GVL_LoadBank_Runtime.HMI_Target_Power_kW',
        totalRatedPower: 'GVL_LoadBank_Runtime.Rated_Total_kW',
        availablePower: 'GVL_LoadBank_Runtime.Available_Power_kW',
        releasedPercent: 'GVL_LoadBank_Runtime.LB_HMI_Released_Percent',

        // GVL_LoadBank_Runtime - Temperature
        tempOutletAvg: 'GVL_LoadBank_Runtime.Temperature_Outlet_Avg',
        tempOutletMax: 'GVL_LoadBank_Runtime.Temperature_Outlet_Max',
        tempDeltaT: 'GVL_LoadBank_Runtime.Temperature_DeltaT',

        // GVL_LoadBank_Runtime - Status
        fanStatus: 'GVL_LoadBank_Runtime.LB_HMI_Fan_Status',
        systemStatus: 'GVL_LoadBank_Runtime.LB_HMI_System_Status',
        tempStatus: 'GVL_LoadBank_Runtime.LB_HMI_Temperature_Status',
        generalAlarm: 'GVL_LoadBank_Runtime.General_Alarm',
        generalWarning: 'GVL_LoadBank_Runtime.General_Warning',
        statusFan: 'GVL_LoadBank_Runtime.Status_Fan',

        // GVL_LoadBank_Runtime - Steps
        activeSteps: 'GVL_LoadBank_Runtime.LB_HMI_Active_Count',
        inactiveSteps: 'GVL_LoadBank_Runtime.LB_HMI_Inactive_Count',
        quarantinedSteps: 'GVL_LoadBank_Runtime.LB_HMI_Quarantined_Count',
        totalSteps: 'GVL_LoadBank_Runtime.LB_HMI_Total_Steps',
        hmiSteps: 'GVL_LoadBank_Runtime.LB_HMI_Steps',

        // GVL_LoadBank_Runtime - Mode specific
        autoStatus: 'GVL_LoadBank_Runtime.Auto_Mode_Status',
        autoPowerError: 'GVL_LoadBank_Runtime.Auto_Mode_Power_Error',
        minLoadKW: 'GVL_LoadBank_Runtime.HMI_Min_Load_kW',
        numericStatus: 'GVL_LoadBank_Runtime.Numeric_Mode_Status',
        targetReverse: 'GVL_LoadBank_Runtime.HMI_Target_Reverse_kW',
        manualSwitch: 'GVL_LoadBank_Runtime.HMI_Manual_Switch',
        manualSelectedKW: 'GVL_LoadBank_Runtime.HMI_Manual_Selected_kW',
        manualStatus: 'GVL_LoadBank_Runtime.Manual_Mode_Status',

        // GVL_LoadBank_Runtime - Imbalance
        voltageImbalance: 'GVL_LoadBank_Runtime.Voltage_Imbalance_Percent',
        currentImbalance: 'GVL_LoadBank_Runtime.Current_Imbalance_Percent',

        // GVL_LoadBank_Runtime - Steps Bar Widths (calculated by PLC)
        activeBarWidth: 'GVL_LoadBank_Runtime.LB_HMI_Active_Bar_Width',
        quarantineBarWidth: 'GVL_LoadBank_Runtime.LB_HMI_Quarantine_Bar_Width',
        inactiveBarWidth: 'GVL_LoadBank_Runtime.LB_HMI_Inactive_Bar_Width',

        // GVL_LoadBank_Runtime - Recipe
        recipeStatus: 'GVL_LoadBank_Runtime.LB_Recipe_Status',
        recipeStart: 'GVL_LoadBank_Runtime.HMI_Recipe_Start',
        recipeStop: 'GVL_LoadBank_Runtime.HMI_Recipe_Stop',
        recipePause: 'GVL_LoadBank_Runtime.HMI_Recipe_Pause',

        // =========================================================================
        // NEW: HMI POWER ERROR DISPLAY (ALL MODES)
        // =========================================================================
        powerErrorKW: 'GVL_LoadBank_Runtime.LB_HMI_Power_Error_kW',
        powerErrorPct: 'GVL_LoadBank_Runtime.LB_HMI_Power_Error_Pct',
        powerStatus: 'GVL_LoadBank_Runtime.LB_HMI_Power_Status',

        // =========================================================================
        // ALARM MANAGER SYMBOLS
        // =========================================================================
        // Alarm list and history
        alarmList: 'GVL_LoadBank_Runtime.LB_Alarm_List',
        alarmListCount: 'GVL_LoadBank_Runtime.LB_Alarm_List_Count',
        alarmHistory: 'GVL_LoadBank_Runtime.LB_Alarm_History',
        alarmHistoryCount: 'GVL_LoadBank_Runtime.LB_Alarm_History_Count',

        // Alarm counts
        criticalCount: 'GVL_LoadBank_Runtime.LB_Critical_Alarm_Count',
        warningCount: 'GVL_LoadBank_Runtime.LB_Warning_Count',
        totalAlarmCount: 'GVL_LoadBank_Runtime.LB_Total_Alarm_Count',
        unackCount: 'GVL_LoadBank_Runtime.LB_Unacknowledged_Count',

        // New alarm trigger
        newAlarmTrigger: 'GVL_LoadBank_Runtime.LB_New_Alarm_Trigger',
        newestAlarmId: 'GVL_LoadBank_Runtime.LB_Newest_Alarm_ID',
        newestAlarmName: 'GVL_LoadBank_Runtime.LB_Newest_Alarm_Name',

        // Alarm commands
        alarmAck: 'GVL_LoadBank_Runtime.HMI_Alarm_Acknowledge',
        alarmAckAll: 'GVL_LoadBank_Runtime.HMI_Alarm_Acknowledge_All',
        alarmClearHistory: 'GVL_LoadBank_Runtime.HMI_Alarm_Clear_History'
    };

    // =========================================================================
    // NEW: POWER STATUS COLORS
    // 0 = GREEN (<=5%), 1 = YELLOW (<=10%), 2 = RED (>10%)
    // =========================================================================
    var POWER_STATUS_COLORS = {
        0: 'rgba(76, 175, 80, 1)',   // GREEN - On target
        1: 'rgba(255, 193, 7, 1)',   // YELLOW - Warning
        2: 'rgba(244, 67, 54, 1)'    // RED - Error
    };

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    var CONFIG = {
        plcName: 'PLC1',
        pollInterval: 250,
        tcCount: 2,
        inletEnabled: true,
        totalRatedPower: 2480
    };

    // =========================================================================
    // STATE
    // =========================================================================
    var state = {
        currentPage: null,
        pollTimer: null,
        blinkTimer: null,
        entryValue: '0',
        masterEnabled: false,
        totalRatedPower: 2480,
        tcCount: 2,
        inletEnabled: true,
        // Alarms state
        alarmBlinkState: false,
        activeAlarms: [],
        alarmHistory: [],
        currentAlarmTab: 'active'
    };

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
    function setText(id, text) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setText === 'function') {
            ctrl.setText(String(text));
        }
    }

    function setVisible(id, visible) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setVisibility === 'function') {
            ctrl.setVisibility(visible ? 'Visible' : 'Collapsed');
        }
    }

    function setWidth(id, width) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setWidth === 'function') {
            ctrl.setWidth(width);
        }
    }

    function setLeft(id, left) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setLeft === 'function') {
            ctrl.setLeft(left);
        }
    }

    function setBackgroundColor(id, color) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setBackgroundColor === 'function') {
            ctrl.setBackgroundColor({ color: color });
        }
    }

    function setTextColor(id, color) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setTextColor === 'function') {
            ctrl.setTextColor({ color: color });
        }
    }

    function setBorderColor(id, color) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setBorderColor === 'function') {
            ctrl.setBorderColor({ color: color });
        }
    }

    function setOpacity(id, opacity) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setOpacity === 'function') {
            ctrl.setOpacity(opacity);
        }
    }

    function setEnabled(id, enabled) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl && typeof ctrl.setIsEnabled === 'function') {
            ctrl.setIsEnabled(enabled);
        }
    }

    function attachClick(id, handler) {
        var ctrl = TcHmi.Controls.get(id);
        if (ctrl) {
            ctrl.attachEvent('click', handler);
        }
    }

    function formatNumber(val, decimals) {
        if (val === null || val === undefined || isNaN(val)) return '--';
        return Number(val).toFixed(decimals || 0);
    }

    function formatTemp(val) {
        if (val === null || val === undefined || isNaN(val)) return '--.-°';
        return Number(val).toFixed(1) + '°';
    }

    function formatPower(val) {
        if (val === null || val === undefined || isNaN(val)) return '--';
        return Number(val).toFixed(1);
    }

    function formatDuration(seconds) {
        if (!seconds || seconds === 0) return '--';
        var hrs = Math.floor(seconds / 3600);
        var mins = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;
        if (hrs > 0) {
            return hrs + 'h ' + mins + 'm';
        } else if (mins > 0) {
            return mins + 'm ' + secs + 's';
        } else {
            return secs + 's';
        }
    }

    // =========================================================================
    // NEW: FORMAT TIME (for Recipe mode - converts TIME ms to MM:SS)
    // =========================================================================
    function formatTime(timeMs) {
        if (!timeMs || timeMs <= 0) return '0:00';
        var totalSeconds = Math.floor(timeMs / 1000);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    // =========================================================================
    // NEW: POWER STATUS COLOR FUNCTION
    // Updates the text color of an element based on power status (0/1/2)
    // =========================================================================
    function updatePowerStatusColor(elementId) {
        readSymbol(SYMBOLS.powerStatus, function (status) {
            var color = POWER_STATUS_COLORS[status] || POWER_STATUS_COLORS[0];
            setTextColor(elementId, color);
        });
    }

    // =========================================================================
    // PLC COMMUNICATION
    // =========================================================================
    function readSymbol(symbol, callback) {
        TcHmi.Server.readSymbol(symbol, function (data) {
            if (data && data.error === 0) {
                callback(data.value);
            } else {
                callback(null);
            }
        });
    }

    function writeSymbol(symbol, value, callback) {
        TcHmi.Server.writeSymbol(symbol, value, function (data) {
            if (callback) callback(data && data.error === 0);
        });
    }

    function subscribeSymbol(symbol, callback) {
        TcHmi.Server.subscribe(symbol, 250, function (data) {
            if (data && data.error === 0) {
                callback(data.value);
            }
        });
    }

    // =========================================================================
    // DYNAMIC TC VISIBILITY - Reads LB_NUMBER_OF_TCS from PLC
    // =========================================================================
    function updateTCVisibility(tcIds, inletIds) {
        var showTC3 = state.tcCount >= 3;
        var showTC4 = state.tcCount >= 4;

        if (tcIds) {
            if (tcIds.tc3Box) setVisible(tcIds.tc3Box, showTC3);
            if (tcIds.tc3Label) setVisible(tcIds.tc3Label, showTC3);
            if (tcIds.tc3Value) setVisible(tcIds.tc3Value, showTC3);
            if (tcIds.tc4Box) setVisible(tcIds.tc4Box, showTC4);
            if (tcIds.tc4Label) setVisible(tcIds.tc4Label, showTC4);
            if (tcIds.tc4Value) setVisible(tcIds.tc4Value, showTC4);
        }

        if (inletIds && !state.inletEnabled) {
            if (inletIds.box) setVisible(inletIds.box, false);
            if (inletIds.label) setVisible(inletIds.label, false);
            if (inletIds.value) setVisible(inletIds.value, false);
        }
    }

    // =========================================================================
    // PROGRESS BAR - Uses totalRatedPower from PLC for correct percentage
    // =========================================================================
    function updateProgressBar(barId, textId, currentPower, maxWidth) {
        var percent = state.totalRatedPower > 0 ? (currentPower / state.totalRatedPower * 100) : 0;
        percent = Math.min(100, Math.max(0, percent));
        var width = (percent / 100) * maxWidth;

        setWidth(barId, width);
        if (textId) {
            setText(textId, formatNumber(percent, 1) + '%');
        }
    }

    function updateStepBar(barId, activeSteps, totalSteps, maxWidth) {
        var percent = totalSteps > 0 ? (activeSteps / totalSteps * 100) : 0;
        var width = (percent / 100) * maxWidth;
        setWidth(barId, width);
    }

    // =========================================================================
    // 3-SEGMENT STEPS BAR - Active (Green), Quarantine (Red), Inactive (Blue)
    // =========================================================================
    function update3SegmentStepsBar(ids, baseLeft) {
        // ids = { active: 'StepsBarActive', quarantine: 'StepsBarQuarantine', inactive: 'StepsBarInactive' }
        // baseLeft = starting left position (Desktop: 20, Mode pages: 345)

        readSymbol(SYMBOLS.activeBarWidth, function (activeW) {
            activeW = activeW || 0;
            setWidth(ids.active, activeW);

            readSymbol(SYMBOLS.quarantineBarWidth, function (quarantineW) {
                quarantineW = quarantineW || 0;
                setLeft(ids.quarantine, baseLeft + activeW);
                setWidth(ids.quarantine, quarantineW);

                readSymbol(SYMBOLS.inactiveBarWidth, function (inactiveW) {
                    inactiveW = inactiveW || 0;
                    setLeft(ids.inactive, baseLeft + activeW + quarantineW);
                    setWidth(ids.inactive, inactiveW);
                });
            });
        });
    }

    // =========================================================================
    // LOAD CONFIG FROM PLC
    // =========================================================================
    function loadConfig(callback) {
        var loaded = 0;
        var total = 3;

        function checkDone() {
            loaded++;
            if (loaded >= total && callback) callback();
        }

        readSymbol(SYMBOLS.tcCount, function (v) {
            if (v !== null && v >= 2) state.tcCount = v;
            checkDone();
        });

        readSymbol(SYMBOLS.inletEnabled, function (v) {
            if (v !== null) state.inletEnabled = v;
            checkDone();
        });

        readSymbol(SYMBOLS.totalRatedPower, function (v) {
            if (v !== null && v > 0) state.totalRatedPower = v;
            checkDone();
        });
    }

    // =========================================================================
    // NAVIGATION
    // =========================================================================
    function navigate(target) {
        TcHmi.View.load('Views/' + target + '.view');
    }

    // =========================================================================
    // DESKTOP PAGE - No suffix on IDs
    // =========================================================================
    var Desktop = {
        init: function () {
            console.log('LoadBank: Initializing Desktop');
            loadConfig(function () {
                Desktop.setupTCVisibility();
                Desktop.setupNavigation();
                Desktop.setupModeButtons();
                Desktop.setupControls();
                Desktop.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box', tc3Label: 'TC3Label', tc3Value: 'TC3Value',
                tc4Box: 'TC4Box', tc4Label: 'TC4Label', tc4Value: 'TC4Value'
            }, {
                box: 'InletBox', label: 'InletLabel', value: 'InletValue'
            });
        },

        setupNavigation: function () {
            attachClick('NavStepsBtn', function () { navigate('Steps'); });
            attachClick('NavTrendsBtn', function () { navigate('Trends'); });
            attachClick('NavAlarmsBtn', function () { navigate('Alarms'); });
            attachClick('NavSetupBtn', function () { navigate('Setup'); });
        },

        setupModeButtons: function () {
            attachClick('ModeOffBtn', function () { writeSymbol(SYMBOLS.modeSelect, 0); });
            attachClick('ModeAutoBtn', function () { navigate('Auto'); });
            attachClick('ModeNumericBtn', function () { navigate('Numeric'); });
            attachClick('ModeReverseBtn', function () { navigate('Reverse'); });
            attachClick('ModeManualBtn', function () { navigate('Manual'); });
            attachClick('ModeRecipeBtn', function () { navigate('Recipe'); });
            attachClick('ModeMaintBtn', function () { navigate('Maintenance'); });
        },

        setupControls: function () {
            attachClick('ResetBtn', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('EStopBtn', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('FanToggle', function () {
                readSymbol(SYMBOLS.fanStart, function (v) {
                    writeSymbol(SYMBOLS.fanStart, !v);
                });
            });
        },

        startPolling: function () {
            state.pollTimer = setInterval(Desktop.poll, CONFIG.pollInterval);
            Desktop.poll();
        },

        poll: function () {
            // Power with status color
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('ReleasedValue', formatPower(v) + ' kW');
                updateProgressBar('PowerBarFill', 'PowerBarText', v, 305);
                updatePowerStatusColor('ReleasedValue');  // NEW: Color based on power status
            });
            readSymbol(SYMBOLS.availablePower, function (v) {
                setText('AvailableValue', formatPower(v) + ' kW');
            });

            // Temperature
            readSymbol(SYMBOLS.tempOutletAvg, function (v) { setText('OutletValue', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value', formatTemp(v)); });
            }

            // Electrical
            readSymbol(SYMBOLS.voltageL12, function (v) { setText('VoltL12Value', formatNumber(v, 0) + ' V'); });
            readSymbol(SYMBOLS.voltageL23, function (v) { setText('VoltL23Value', formatNumber(v, 0) + ' V'); });
            readSymbol(SYMBOLS.voltageL31, function (v) { setText('VoltL31Value', formatNumber(v, 0) + ' V'); });
            readSymbol(SYMBOLS.currentI1, function (v) { setText('CurrI1Value', formatNumber(v, 1) + ' A'); });
            readSymbol(SYMBOLS.currentI2, function (v) { setText('CurrI2Value', formatNumber(v, 1) + ' A'); });
            readSymbol(SYMBOLS.currentI3, function (v) { setText('CurrI3Value', formatNumber(v, 1) + ' A'); });
            readSymbol(SYMBOLS.frequency, function (v) { setText('FreqValue', formatNumber(v, 2) + ' Hz'); });
            readSymbol(SYMBOLS.powerFactor, function (v) { setText('PFValue', formatNumber(v, 2)); });

            // Steps bar - 3 segments (Active=Green, Quarantine=Red, Inactive=Blue)
            update3SegmentStepsBar({
                active: 'StepsBarActive',
                quarantine: 'StepsBarQuarantine',
                inactive: 'StepsBarInactive'
            }, 20);  // Desktop baseLeft = 20

            // Status bar - System status
            readSymbol(SYMBOLS.systemStatus, function (v) {
                var statusMap = {
                    0: { text: '● OFF', color: 'rgba(148, 163, 184, 1)' },
                    1: { text: '● READY', color: 'rgba(33, 150, 243, 1)' },
                    2: { text: '● RUNNING', color: 'rgba(76, 175, 80, 1)' },
                    3: { text: '● FAULT', color: 'rgba(244, 67, 54, 1)' }
                };
                var status = statusMap[v] || statusMap[0];
                setText('StatusRunText', status.text);
                setTextColor('StatusRunText', status.color);
                setBackgroundColor('StatusRunDot', status.color);
            });

            // Status bar - Fan status
            readSymbol(SYMBOLS.fanStatus, function (v) {
                var fanMap = {
                    0: { text: '● OFF', color: 'rgba(148, 163, 184, 1)' },
                    1: { text: '● STARTING', color: 'rgba(33, 150, 243, 1)' },
                    2: { text: '● PRESSURIZING', color: 'rgba(255, 193, 7, 1)' },
                    3: { text: '● RUNNING', color: 'rgba(76, 175, 80, 1)' },
                    4: { text: '● COOLING', color: 'rgba(255, 152, 0, 1)' },
                    5: { text: '● FAULT', color: 'rgba(244, 67, 54, 1)' }
                };
                var status = fanMap[v] || fanMap[0];
                setText('StatusFanText', status.text);
                setTextColor('StatusFanText', status.color);
                setBackgroundColor('StatusFanDot', status.color);
            });

            // Status bar - Temperature status
            readSymbol(SYMBOLS.tempStatus, function (v) {
                var tempMap = {
                    0: { text: '● NORMAL', color: 'rgba(76, 175, 80, 1)' },
                    1: { text: '● WARNING', color: 'rgba(255, 152, 0, 1)' },
                    2: { text: '● MAXIMUM', color: 'rgba(244, 67, 54, 1)' }
                };
                var status = tempMap[v] || tempMap[0];
                setText('StatusTempText', status.text);
                setTextColor('StatusTempText', status.color);
                setBackgroundColor('StatusTempDot', status.color);
            });
        }
    };

    // =========================================================================
    // AUTO MODE PAGE - IDs use suffix _3, _2
    // =========================================================================
    var Auto = {
        init: function () {
            console.log('LoadBank: Initializing Auto Mode');
            writeSymbol(SYMBOLS.modeSelect, 1);
            loadConfig(function () {
                Auto.setupTCVisibility();
                Auto.setupKeypad();
                Auto.setupPresets();
                Auto.setupControls();
                Auto.setupFooter();
                Auto.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_3', tc3Label: 'TC3Label_3', tc3Value: 'TC3Value_3',
                tc4Box: 'TC4Box_3', tc4Label: 'TC4Label_3', tc4Value: 'TC4Value_3'
            }, {
                box: 'InletBox_2', label: 'InletLabel_3', value: 'InletValue_2'
            });
        },

        setupKeypad: function () {
            for (var i = 0; i <= 9; i++) {
                (function (digit) {
                    attachClick('btnKey' + digit + '_1', function () { Auto.keyPress(digit); });
                })(i);
            }
            attachClick('btnClear_1', function () { Auto.keyClear(); });
            attachClick('btnEnter_1', function () { Auto.keyEnter(); });
        },

        setupPresets: function () {
            attachClick('btnPreset25_1', function () { Auto.setPreset(25); });
            attachClick('btnPreset50_1', function () { Auto.setPreset(50); });
            attachClick('btnPreset75_1', function () { Auto.setPreset(75); });
            attachClick('btnPreset100_1', function () { Auto.setPreset(100); });
        },

        setupControls: function () {
            attachClick('btnMasterEnable_3', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });
        },

        setupFooter: function () {
            attachClick('btnBack_3', function () { navigate('Desktop'); });
            attachClick('btnEStop_3', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_3', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_3', function () { navigate('Steps'); });
            attachClick('btnTrends_3', function () { navigate('Trends'); });
            attachClick('btnAlarms_3', function () { navigate('Alarms'); });
            attachClick('btnSetup_3', function () { navigate('Setup'); });
        },

        keyPress: function (digit) {
            if (state.entryValue === '0') {
                state.entryValue = String(digit);
            } else if (state.entryValue.length < 5) {
                state.entryValue += String(digit);
            }
            setText('entryDisplay_1', state.entryValue);
        },

        keyClear: function () {
            state.entryValue = '0';
            setText('entryDisplay_1', '0');
        },

        keyEnter: function () {
            var value = parseInt(state.entryValue, 10) || 0;
            writeSymbol(SYMBOLS.minLoadKW, value);
        },

        setPreset: function (percent) {
            var value = Math.round(state.totalRatedPower * percent / 100);
            state.entryValue = String(value);
            setText('entryDisplay_1', state.entryValue);
            Auto.keyEnter();
        },

        startPolling: function () {
            state.pollTimer = setInterval(Auto.poll, CONFIG.pollInterval);
            Auto.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_2', formatNumber(v, 1));
                updateProgressBar('progressBar_2', 'progressPercent_2', v, 350);
                updatePowerStatusColor('releasedPower_2');  // NEW: Power status color
            });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_2', formatTemp(v)); });
            readSymbol(SYMBOLS.tempDeltaT, function (v) { setText('deltaT_2', formatNumber(v, 1) + '°'); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_3', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_3', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_3', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_3', formatTemp(v)); });
            }
            if (state.inletEnabled) {
                readSymbol(SYMBOLS.tempInlet, function (v) { setText('InletValue_2', formatTemp(v)); });
            }

            readSymbol(SYMBOLS.voltageL12, function (v) { setText('voltageL12_2', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL23, function (v) { setText('voltageL23_2', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL31, function (v) { setText('voltageL31_2', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.currentI1, function (v) { setText('currentL1_2', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI2, function (v) { setText('currentL2_2', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI3, function (v) { setText('currentL3_2', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.frequency, function (v) { setText('frequency_2', formatNumber(v, 2)); });
            readSymbol(SYMBOLS.powerFactor, function (v) { setText('powerFactor_2', formatNumber(v, 2)); });

            readSymbol(SYMBOLS.autoStatus, function (v) { setText('statusText_2', v || 'Ready'); });
            readSymbol(SYMBOLS.externalPower, function (v) { setText('externalPower_2', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.autoPowerError, function (v) { setText('powerError_2', formatNumber(v, 1)); });

            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                var btn = TcHmi.Controls.get('btnMasterEnable_3');
                if (btn) {
                    btn.setText(v ? 'ENABLED' : 'DISABLED');
                    setBackgroundColor('btnMasterEnable_3', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
                }
            });

            // Steps bar - 3 segments
            update3SegmentStepsBar({
                active: 'StepsBarActive_2',
                quarantine: 'StepsBarQuarantine_2',
                inactive: 'StepsBarInactive_2'
            }, 345);  // Mode pages baseLeft = 345
        }
    };

    // =========================================================================
    // NUMERIC MODE PAGE - IDs use suffix _5, _4
    // =========================================================================
    var Numeric = {
        init: function () {
            console.log('LoadBank: Initializing Numeric Mode');
            writeSymbol(SYMBOLS.modeSelect, 2);
            loadConfig(function () {
                Numeric.setupTCVisibility();
                Numeric.setupKeypad();
                Numeric.setupPresets();
                Numeric.setupControls();
                Numeric.setupFooter();
                Numeric.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_5', tc3Label: 'TC3Label_5', tc3Value: 'TC3Value_5',
                tc4Box: 'TC4Box_5', tc4Label: 'TC4Label_5', tc4Value: 'TC4Value_5'
            }, {
                box: 'InletBox_4', label: 'InletLabel_5', value: 'InletValue_4'
            });
        },

        setupKeypad: function () {
            for (var i = 0; i <= 9; i++) {
                (function (digit) {
                    attachClick('btnKey' + digit + '_3', function () { Numeric.keyPress(digit); });
                })(i);
            }
            attachClick('btnClear_3', function () { Numeric.keyClear(); });
            attachClick('btnEnter_3', function () { Numeric.keyEnter(); });
        },

        setupPresets: function () {
            attachClick('btnPreset25_3', function () { Numeric.setPreset(25); });
            attachClick('btnPreset50_3', function () { Numeric.setPreset(50); });
            attachClick('btnPreset75_3', function () { Numeric.setPreset(75); });
            attachClick('btnPreset100_3', function () { Numeric.setPreset(100); });
        },

        setupControls: function () {
            attachClick('btnMasterEnable_5', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });
        },

        setupFooter: function () {
            attachClick('btnBack_5', function () { navigate('Desktop'); });
            attachClick('btnEStop_5', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_5', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_5', function () { navigate('Steps'); });
            attachClick('btnTrends_5', function () { navigate('Trends'); });
            attachClick('btnAlarms_5', function () { navigate('Alarms'); });
            attachClick('btnSetup_5', function () { navigate('Setup'); });
        },

        keyPress: function (digit) {
            if (state.entryValue === '0') {
                state.entryValue = String(digit);
            } else if (state.entryValue.length < 5) {
                state.entryValue += String(digit);
            }
            setText('entryDisplay_3', state.entryValue);
        },

        keyClear: function () {
            state.entryValue = '0';
            setText('entryDisplay_3', '0');
        },

        keyEnter: function () {
            var value = parseInt(state.entryValue, 10) || 0;
            writeSymbol(SYMBOLS.targetPower, value);
        },

        setPreset: function (percent) {
            var value = Math.round(state.totalRatedPower * percent / 100);
            state.entryValue = String(value);
            setText('entryDisplay_3', state.entryValue);
            Numeric.keyEnter();
        },

        startPolling: function () {
            state.pollTimer = setInterval(Numeric.poll, CONFIG.pollInterval);
            Numeric.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_4', formatNumber(v, 1));
                updateProgressBar('progressBar_4', 'progressPercent_4', v, 350);
                updatePowerStatusColor('releasedPower_4');  // NEW: Power status color
            });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_4', formatTemp(v)); });
            readSymbol(SYMBOLS.tempDeltaT, function (v) { setText('deltaT_4', formatNumber(v, 1) + '°'); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_5', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_5', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_5', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_5', formatTemp(v)); });
            }
            if (state.inletEnabled) {
                readSymbol(SYMBOLS.tempInlet, function (v) { setText('InletValue_4', formatTemp(v)); });
            }

            readSymbol(SYMBOLS.voltageL12, function (v) { setText('voltageL12_4', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL23, function (v) { setText('voltageL23_4', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL31, function (v) { setText('voltageL31_4', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.currentI1, function (v) { setText('currentL1_4', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI2, function (v) { setText('currentL2_4', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI3, function (v) { setText('currentL3_4', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.frequency, function (v) { setText('frequency_4', formatNumber(v, 2)); });
            readSymbol(SYMBOLS.powerFactor, function (v) { setText('powerFactor_4', formatNumber(v, 2)); });

            readSymbol(SYMBOLS.numericStatus, function (v) { setText('statusText_4', v || 'Ready'); });
            readSymbol(SYMBOLS.targetPower, function (v) { setText('targetPower_4', formatNumber(v, 0)); });

            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                var btn = TcHmi.Controls.get('btnMasterEnable_5');
                if (btn) {
                    btn.setText(v ? 'ENABLED' : 'DISABLED');
                    setBackgroundColor('btnMasterEnable_5', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
                }
            });

            // Steps bar - 3 segments
            update3SegmentStepsBar({
                active: 'StepsBarActive_4',
                quarantine: 'StepsBarQuarantine_4',
                inactive: 'StepsBarInactive_4'
            }, 345);
        }
    };

    // =========================================================================
    // REVERSE MODE PAGE - IDs use suffix _4, _3
    // =========================================================================
    var Reverse = {
        init: function () {
            console.log('LoadBank: Initializing Reverse Mode');
            writeSymbol(SYMBOLS.modeSelect, 3);
            loadConfig(function () {
                Reverse.setupTCVisibility();
                Reverse.setupKeypad();
                Reverse.setupPresets();
                Reverse.setupControls();
                Reverse.setupFooter();
                Reverse.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_4', tc3Label: 'TC3Label_4', tc3Value: 'TC3Value_4',
                tc4Box: 'TC4Box_4', tc4Label: 'TC4Label_4', tc4Value: 'TC4Value_4'
            }, {
                box: 'InletBox_3', label: 'InletLabel_4', value: 'InletValue_3'
            });
        },

        setupKeypad: function () {
            for (var i = 0; i <= 9; i++) {
                (function (digit) {
                    attachClick('btnKey' + digit + '_2', function () { Reverse.keyPress(digit); });
                })(i);
            }
            attachClick('btnClear_2', function () { Reverse.keyClear(); });
            attachClick('btnEnter_2', function () { Reverse.keyEnter(); });
        },

        setupPresets: function () {
            attachClick('btnPreset25_2', function () { Reverse.setPreset(25); });
            attachClick('btnPreset50_2', function () { Reverse.setPreset(50); });
            attachClick('btnPreset75_2', function () { Reverse.setPreset(75); });
            attachClick('btnPreset100_2', function () { Reverse.setPreset(100); });
        },

        setupControls: function () {
            attachClick('btnMasterEnable_4', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });
        },

        setupFooter: function () {
            attachClick('btnBack_4', function () { navigate('Desktop'); });
            attachClick('btnEStop_4', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_4', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_4', function () { navigate('Steps'); });
            attachClick('btnTrends_4', function () { navigate('Trends'); });
            attachClick('btnAlarms_4', function () { navigate('Alarms'); });
            attachClick('btnSetup_4', function () { navigate('Setup'); });
        },

        keyPress: function (digit) {
            if (state.entryValue === '0') {
                state.entryValue = String(digit);
            } else if (state.entryValue.length < 5) {
                state.entryValue += String(digit);
            }
            setText('entryDisplay_2', state.entryValue);
        },

        keyClear: function () {
            state.entryValue = '0';
            setText('entryDisplay_2', '0');
        },

        keyEnter: function () {
            var value = parseInt(state.entryValue, 10) || 0;
            writeSymbol(SYMBOLS.targetReverse, value);
        },

        setPreset: function (percent) {
            var value = Math.round(state.totalRatedPower * percent / 100);
            state.entryValue = String(value);
            setText('entryDisplay_2', state.entryValue);
            Reverse.keyEnter();
        },

        startPolling: function () {
            state.pollTimer = setInterval(Reverse.poll, CONFIG.pollInterval);
            Reverse.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_3', formatNumber(v, 1));
                updateProgressBar('progressBar_3', 'progressPercent_3', v, 350);
                updatePowerStatusColor('releasedPower_3');  // NEW: Power status color
            });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_3', formatTemp(v)); });
            readSymbol(SYMBOLS.tempDeltaT, function (v) { setText('deltaT_3', formatNumber(v, 1) + '°'); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_4', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_4', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_4', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_4', formatTemp(v)); });
            }
            if (state.inletEnabled) {
                readSymbol(SYMBOLS.tempInlet, function (v) { setText('InletValue_3', formatTemp(v)); });
            }

            readSymbol(SYMBOLS.voltageL12, function (v) { setText('voltageL12_3', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL23, function (v) { setText('voltageL23_3', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.voltageL31, function (v) { setText('voltageL31_3', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.currentI1, function (v) { setText('currentL1_3', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI2, function (v) { setText('currentL2_3', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.currentI3, function (v) { setText('currentL3_3', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.frequency, function (v) { setText('frequency_3', formatNumber(v, 2)); });
            readSymbol(SYMBOLS.powerFactor, function (v) { setText('powerFactor_3', formatNumber(v, 2)); });

            readSymbol(SYMBOLS.externalPower, function (v) { setText('externalPower_3', formatNumber(v, 1)); });
            readSymbol(SYMBOLS.targetReverse, function (v) { setText('targetPower_3', formatNumber(v, 0)); });

            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                var btn = TcHmi.Controls.get('btnMasterEnable_4');
                if (btn) {
                    btn.setText(v ? 'ENABLED' : 'DISABLED');
                    setBackgroundColor('btnMasterEnable_4', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
                }
            });

            // Steps bar - 3 segments
            update3SegmentStepsBar({
                active: 'StepsBarActive_3',
                quarantine: 'StepsBarQuarantine_3',
                inactive: 'StepsBarInactive_3'
            }, 345);
        }
    };

    // =========================================================================
    // MANUAL MODE PAGE - IDs use suffix _6, _5
    // =========================================================================
    var Manual = {
        init: function () {
            console.log('LoadBank: Initializing Manual Mode');
            writeSymbol(SYMBOLS.modeSelect, 4);
            loadConfig(function () {
                Manual.setupTCVisibility();
                Manual.setupSwitches();
                Manual.setupControls();
                Manual.setupFooter();
                Manual.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_6', tc3Label: 'TC3Label_6', tc3Value: 'TC3Value_6',
                tc4Box: 'TC4Box_6', tc4Label: 'TC4Label_6', tc4Value: 'TC4Value_6'
            }, {
                box: 'InletBox_5', label: 'InletLabel_6', value: 'InletValue_5'
            });
        },

        setupSwitches: function () {
            for (var i = 1; i <= 8; i++) {
                (function (sw) {
                    attachClick('btnSwitch' + sw, function () {
                        readSymbol(SYMBOLS.manualSwitch + '[' + sw + ']', function (v) {
                            writeSymbol(SYMBOLS.manualSwitch + '[' + sw + ']', !v);
                        });
                    });
                })(i);
            }
        },

        setupControls: function () {
            attachClick('btnMasterEnable_6', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });
        },

        setupFooter: function () {
            attachClick('btnBack_6', function () { navigate('Desktop'); });
            attachClick('btnEStop_6', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_6', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_6', function () { navigate('Steps'); });
            attachClick('btnTrends_6', function () { navigate('Trends'); });
            attachClick('btnAlarms_6', function () { navigate('Alarms'); });
            attachClick('btnSetup_6', function () { navigate('Setup'); });
        },

        startPolling: function () {
            state.pollTimer = setInterval(Manual.poll, CONFIG.pollInterval);
            Manual.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_5', formatNumber(v, 1));
                updateProgressBar('progressBar_5', null, v, 350);
                updatePowerStatusColor('releasedPower_5');  // NEW: Power status color
            });

            readSymbol(SYMBOLS.manualSelectedKW, function (v) { setText('selectedPower_5', formatNumber(v, 0) + ' kW'); });
            readSymbol(SYMBOLS.manualStatus, function (v) { setText('statusText_5', v || 'Ready'); });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_5', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_6', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_6', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_6', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_6', formatTemp(v)); });
            }

            for (var i = 1; i <= 8; i++) {
                (function (sw) {
                    readSymbol(SYMBOLS.manualSwitch + '[' + sw + ']', function (v) {
                        setBackgroundColor('btnSwitch' + sw, v ? 'rgba(76, 175, 80, 1)' : 'rgba(60, 60, 60, 1)');
                    });
                })(i);
            }

            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                var btn = TcHmi.Controls.get('btnMasterEnable_6');
                if (btn) {
                    btn.setText(v ? 'ENABLED' : 'DISABLED');
                    setBackgroundColor('btnMasterEnable_6', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
                }
            });

            // Steps bar - 3 segments
            update3SegmentStepsBar({
                active: 'StepsBarActive_5',
                quarantine: 'StepsBarQuarantine_5',
                inactive: 'StepsBarInactive_5'
            }, 345);
        }
    };

    // =========================================================================
    // NEW: RECIPE MODE PAGE - IDs use suffix _8, _7
    // =========================================================================
    var Recipe = {
        init: function () {
            console.log('LoadBank: Initializing Recipe Mode');
            writeSymbol(SYMBOLS.modeSelect, 5);  // LB_MODE_RECIPE = 5
            loadConfig(function () {
                Recipe.setupTCVisibility();
                Recipe.setupControls();
                Recipe.setupFooter();
                Recipe.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_8', tc3Label: 'TC3Label_8', tc3Value: 'TC3Value_8',
                tc4Box: 'TC4Box_8', tc4Label: 'TC4Label_8', tc4Value: 'TC4Value_8'
            }, {
                box: 'InletBox_7', label: 'InletLabel_8', value: 'InletValue_7'
            });
        },

        setupControls: function () {
            // Master Enable button
            attachClick('btnMasterEnable_8', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });

            // Recipe control buttons
            attachClick('btnRecipeStart', function () {
                writeSymbol(SYMBOLS.recipeStart, true);
                setTimeout(function () { writeSymbol(SYMBOLS.recipeStart, false); }, 200);
            });

            attachClick('btnRecipePause', function () {
                writeSymbol(SYMBOLS.recipePause, true);
                setTimeout(function () { writeSymbol(SYMBOLS.recipePause, false); }, 200);
            });

            attachClick('btnRecipeAbort', function () {
                writeSymbol(SYMBOLS.recipeStop, true);
                setTimeout(function () { writeSymbol(SYMBOLS.recipeStop, false); }, 200);
            });
        },

        setupFooter: function () {
            attachClick('btnBack_8', function () { navigate('Desktop'); });
            attachClick('btnEStop_8', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_8', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_8', function () { navigate('Steps'); });
            attachClick('btnTrends_8', function () { navigate('Trends'); });
            attachClick('btnAlarms_8', function () { navigate('Alarms'); });
            attachClick('btnSetup_8', function () { navigate('Setup'); });
        },

        startPolling: function () {
            state.pollTimer = setInterval(Recipe.poll, CONFIG.pollInterval);
            Recipe.poll();
        },

        poll: function () {
            // Read recipe status struct
            readSymbol(SYMBOLS.recipeStatus, function (status) {
                if (status) {
                    // Current step info
                    setText('CurrentStepName', 'Step ' + status.Current_Step + ': ' + status.Current_Step_Name);
                    setText('TargetPower', formatNumber(status.Current_Target_kW, 0) + ' kW Target');

                    // Progress bar
                    var progressPercent = status.Recipe_Progress_Pct || 0;
                    var barWidth = (progressPercent / 100) * 280;
                    setWidth('ProgressBarFill', barWidth);
                    setText('ProgressPercent_7', progressPercent + '%');

                    // Time displays
                    setText('ElapsedTime', formatTime(status.Total_Elapsed_Time));
                    setText('RemainingTime', formatTime(status.Total_Remaining_Time));

                    // Status text
                    setText('statusText_7', status.Status_Message || 'Ready');

                    // Update button states based on recipe status
                    if (status.Recipe_Running) {
                        setBackgroundColor('btnRecipeStart', 'rgba(100, 100, 100, 1)');
                        setBackgroundColor('btnRecipePause', 'rgba(255, 152, 0, 1)');
                    } else if (status.Recipe_Paused) {
                        setBackgroundColor('btnRecipeStart', 'rgba(76, 175, 80, 1)');
                        setBackgroundColor('btnRecipePause', 'rgba(100, 100, 100, 1)');
                    } else {
                        setBackgroundColor('btnRecipeStart', 'rgba(76, 175, 80, 1)');
                        setBackgroundColor('btnRecipePause', 'rgba(100, 100, 100, 1)');
                    }
                }
            });

            // Current readings with power status color
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_7', formatNumber(v, 1));
                updatePowerStatusColor('releasedPower_7');
            });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_7', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_8', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_8', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_8', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_8', formatTemp(v)); });
            }

            readSymbol(SYMBOLS.voltageL12, function (v) { setText('voltageL12_7', formatNumber(v, 0)); });
            readSymbol(SYMBOLS.currentI1, function (v) { setText('currentL1_7', formatNumber(v, 1)); });

            // Master enable button state
            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                var btn = TcHmi.Controls.get('btnMasterEnable_8');
                if (btn) {
                    btn.setText(v ? 'ENABLED' : 'DISABLED');
                    setBackgroundColor('btnMasterEnable_8', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
                }
            });

            // Alarm count
            readSymbol(SYMBOLS.totalAlarmCount, function (v) {
                setText('ActiveAlarms_7', v || 0);
                setTextColor('ActiveAlarms_7', v > 0 ? 'rgba(244, 67, 54, 1)' : 'rgba(76, 175, 80, 1)');
            });

            // Steps bar - 3 segments
            update3SegmentStepsBar({
                active: 'StepsBarActive_7',
                quarantine: 'StepsBarQuarantine_7',
                inactive: 'StepsBarInactive_7'
            }, 345);
        }
    };

    // =========================================================================
    // MAINTENANCE MODE PAGE - IDs use suffix _7
    // =========================================================================
    var Maint = {
        init: function () {
            console.log('LoadBank: Initializing Maintenance Mode');
            writeSymbol(SYMBOLS.modeSelect, 6);
            loadConfig(function () {
                Maint.setupTCVisibility();
                Maint.setupStepButtons();
                Maint.setupControls();
                Maint.setupFooter();
                Maint.startPolling();
            });
        },

        setupTCVisibility: function () {
            updateTCVisibility({
                tc3Box: 'TC3Box_7', tc3Label: 'TC3Label_7', tc3Value: 'TC3Value_7',
                tc4Box: 'TC4Box_7', tc4Label: 'TC4Label_7', tc4Value: 'TC4Value_7'
            }, {
                box: 'InletBox_6', label: 'InletLabel_7', value: 'InletValue_6'
            });
        },

        setupStepButtons: function () {
            for (var i = 1; i <= 10; i++) {
                (function (step) {
                    attachClick('btnStep' + step + '_7', function () {
                        readSymbol('GVL_LoadBank_Runtime.HMI_Manual_Step_Cmd[' + step + ']', function (v) {
                            writeSymbol('GVL_LoadBank_Runtime.HMI_Manual_Step_Cmd[' + step + ']', !v);
                        });
                    });
                })(i);
            }
        },

        setupControls: function () {
            attachClick('btnMasterEnable_7', function () {
                readSymbol(SYMBOLS.masterEnable, function (v) {
                    writeSymbol(SYMBOLS.masterEnable, !v);
                });
            });
            attachClick('btnFanStart_7', function () {
                readSymbol(SYMBOLS.fanStart, function (v) {
                    writeSymbol(SYMBOLS.fanStart, !v);
                });
            });
        },

        setupFooter: function () {
            attachClick('btnBack_7', function () { navigate('Desktop'); });
            attachClick('btnEStop_7', function () {
                writeSymbol(SYMBOLS.modeSelect, 0);
                writeSymbol(SYMBOLS.masterEnable, false);
            });
            attachClick('btnReset_7', function () {
                writeSymbol(SYMBOLS.resetCmd, true);
                setTimeout(function () { writeSymbol(SYMBOLS.resetCmd, false); }, 500);
            });
            attachClick('btnSteps_7', function () { navigate('Steps'); });
            attachClick('btnTrends_7', function () { navigate('Trends'); });
            attachClick('btnAlarms_7', function () { navigate('Alarms'); });
            attachClick('btnSetup_7', function () { navigate('Setup'); });
        },

        startPolling: function () {
            state.pollTimer = setInterval(Maint.poll, CONFIG.pollInterval);
            Maint.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.releasedPower, function (v) {
                setText('releasedPower_6', formatNumber(v, 1) + ' kW');
            });

            readSymbol(SYMBOLS.tempOutletMax, function (v) { setText('outletTemp_6', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[1]', function (v) { setText('TC1Value_7', formatTemp(v)); });
            readSymbol(SYMBOLS.tempTC + '[2]', function (v) { setText('TC2Value_7', formatTemp(v)); });
            if (state.tcCount >= 3) {
                readSymbol(SYMBOLS.tempTC + '[3]', function (v) { setText('TC3Value_7', formatTemp(v)); });
            }
            if (state.tcCount >= 4) {
                readSymbol(SYMBOLS.tempTC + '[4]', function (v) { setText('TC4Value_7', formatTemp(v)); });
            }

            readSymbol(SYMBOLS.statusFan, function (v) { setText('fanStatus_7', v || '--'); });

            readSymbol(SYMBOLS.masterEnable, function (v) {
                state.masterEnabled = v;
                setBackgroundColor('btnMasterEnable_7', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
            });

            readSymbol(SYMBOLS.fanStart, function (v) {
                setBackgroundColor('btnFanStart_7', v ? 'rgba(76, 175, 80, 1)' : 'rgba(100, 100, 100, 1)');
            });
        }
    };

    // =========================================================================
    // STEPS PAGE - IDs use suffix _9
    // =========================================================================
    var Steps = {
        init: function () {
            console.log('LoadBank: Initializing Steps Page');
            loadConfig(function () {
                Steps.setupFooter();
                Steps.startPolling();
            });
        },

        setupFooter: function () {
            attachClick('btnBack_9', function () { navigate('Desktop'); });
        },

        startPolling: function () {
            state.pollTimer = setInterval(Steps.poll, CONFIG.pollInterval);
            Steps.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.totalSteps, function (v) { setText('lblTotalStepsValue', v || '--'); });
            readSymbol(SYMBOLS.activeSteps, function (v) { setText('lblActiveValue', v || '0'); });
            readSymbol(SYMBOLS.inactiveSteps, function (v) { setText('lblInactiveValue', v || '0'); });
            readSymbol(SYMBOLS.quarantinedSteps, function (v) { setText('lblQuarantinedValue', v || '0'); });

            for (var i = 1; i <= 10; i++) {
                (function (step) {
                    readSymbol(SYMBOLS.hmiSteps + '[' + step + ']', function (data) {
                        if (data) {
                            setText('lblStepPower_' + step, formatNumber(data.Power_kW, 0) + ' kW');
                            setText('lblStepStatus_' + step, data.Status_Text || '--');
                            setText('lblStepCycles_' + step, data.Cycle_Count || '0');

                            var statusColor = 'rgba(100, 100, 100, 1)';
                            if (data.Is_Active) statusColor = 'rgba(76, 175, 80, 1)';
                            else if (data.Is_Quarantined) statusColor = 'rgba(244, 67, 54, 1)';
                            else if (data.Is_Available) statusColor = 'rgba(33, 150, 243, 1)';

                            setBackgroundColor('StepCard_' + step, statusColor);
                        }
                    });
                })(i);
            }
        }
    };

    // =========================================================================
    // TRENDS PAGE
    // =========================================================================
    var Trends = {
        init: function () {
            console.log('LoadBank: Initializing Trends Page');
            Trends.setupFooter();
            Trends.setupTimeRange();
            Trends.setupTraceToggles();
        },

        setupFooter: function () {
            attachClick('btnBack_10', function () { navigate('Desktop'); });
        },

        setupTimeRange: function () {
            attachClick('btn1Min', function () { Trends.setTimeRange(60); });
            attachClick('btn5Min', function () { Trends.setTimeRange(300); });
            attachClick('btn15Min', function () { Trends.setTimeRange(900); });
            attachClick('btn1Hour', function () { Trends.setTimeRange(3600); });
        },

        setTimeRange: function (seconds) {
            var chart = TcHmi.Controls.get('TrendChart');
            if (chart && typeof chart.setTimeSpan === 'function') {
                chart.setTimeSpan(seconds * 1000);
            }
        },

        setupTraceToggles: function () {
            var traces = ['Power', 'Temp', 'Voltage', 'Current'];
            traces.forEach(function (trace) {
                attachClick('btnToggle' + trace, function () {
                    Trends.toggleTrace(trace);
                });
            });
        },

        toggleTrace: function (traceName) {
            console.log('Toggle trace: ' + traceName);
        }
    };

    // =========================================================================
    // ALARMS PAGE
    // =========================================================================
    var Alarms = {
        CONFIG: {
            maxActiveRows: 10,
            maxHistoryRows: 12,
            blinkInterval: 500
        },

        COLORS: {
            critical: 'rgba(244, 67, 54, 1)',
            warning: 'rgba(255, 193, 7, 1)',
            normal: 'rgba(76, 175, 80, 1)',
            accent: 'rgba(77, 212, 255, 1)',
            textPrimary: 'rgba(232, 240, 247, 1)',
            textSecondary: 'rgba(148, 163, 184, 1)',
            panelBg: 'rgba(26, 41, 66, 1)',
            buttonBg: 'rgba(36, 58, 86, 1)',
            border: 'rgba(45, 70, 99, 1)'
        },

        init: function () {
            console.log('LoadBank: Initializing Alarms Page');
            state.currentAlarmTab = 'active';
            state.activeAlarms = [];
            state.alarmHistory = [];

            Alarms.setupButtons();
            Alarms.setupNavigation();
            Alarms.startPolling();
            Alarms.startBlinking();
        },

        setupButtons: function () {
            attachClick('btnBack', function () { navigate('Desktop'); });
            attachClick('btnAckAll', function () { Alarms.acknowledgeAll(); });
            attachClick('btnReset', function () { Alarms.resetAlarms(); });
            attachClick('btnClearHistory', function () { Alarms.showClearDialog(); });

            attachClick('btnTabActive', function () { Alarms.switchTab('active'); });
            attachClick('btnTabHistory', function () { Alarms.switchTab('history'); });

            attachClick('btnDialogCancel', function () { Alarms.hideDialog(); });
            attachClick('btnDialogConfirm', function () { Alarms.confirmClearHistory(); });

            for (var i = 1; i <= Alarms.CONFIG.maxActiveRows; i++) {
                (function (rowNum) {
                    attachClick('alarmRow' + rowNum + '_btnAck', function () {
                        var alarm = state.activeAlarms[rowNum - 1];
                        if (alarm && !alarm.Acknowledged) {
                            Alarms.acknowledgeAlarm(alarm.ID);
                        }
                    });
                })(i);
            }
        },

        setupNavigation: function () {
            attachClick('btnNavHome', function () { navigate('Desktop'); });
            attachClick('btnNavSteps', function () { navigate('Steps'); });
            attachClick('btnNavTrends', function () { navigate('Trends'); });
            attachClick('btnNavAlarms', function () { /* Already here */ });
            attachClick('btnNavSetup', function () { navigate('Setup'); });
        },

        switchTab: function (tab) {
            state.currentAlarmTab = tab;

            if (tab === 'active') {
                setBackgroundColor('btnTabActive', Alarms.COLORS.panelBg);
                setBorderColor('btnTabActive', Alarms.COLORS.accent);
                setTextColor('btnTabActive', Alarms.COLORS.accent);
                setBackgroundColor('btnTabHistory', Alarms.COLORS.buttonBg);
                setBorderColor('btnTabHistory', Alarms.COLORS.border);
                setTextColor('btnTabHistory', Alarms.COLORS.textSecondary);
                setVisible('panelActiveAlarms', true);
                setVisible('panelHistory', false);
            } else {
                setBackgroundColor('btnTabHistory', Alarms.COLORS.panelBg);
                setBorderColor('btnTabHistory', Alarms.COLORS.accent);
                setTextColor('btnTabHistory', Alarms.COLORS.accent);
                setBackgroundColor('btnTabActive', Alarms.COLORS.buttonBg);
                setBorderColor('btnTabActive', Alarms.COLORS.border);
                setTextColor('btnTabActive', Alarms.COLORS.textSecondary);
                setVisible('panelActiveAlarms', false);
                setVisible('panelHistory', true);
            }
        },

        startPolling: function () {
            state.pollTimer = setInterval(Alarms.poll, CONFIG.pollInterval);
            Alarms.poll();
        },

        poll: function () {
            readSymbol(SYMBOLS.criticalCount, function (v) { setText('txtCriticalCount', v || 0); });
            readSymbol(SYMBOLS.warningCount, function (v) { setText('txtWarningCount', v || 0); });
            readSymbol(SYMBOLS.unackCount, function (v) { setText('txtUnackCount', v || 0); });
            readSymbol(SYMBOLS.totalAlarmCount, function (v) { setText('txtTotalCount', v || 0); });

            readSymbol(SYMBOLS.alarmListCount, function (count) {
                count = count || 0;
                if (count > 0) {
                    Alarms.loadActiveAlarms(count);
                } else {
                    state.activeAlarms = [];
                    Alarms.updateActiveDisplay();
                }
            });

            if (state.currentAlarmTab === 'history') {
                readSymbol(SYMBOLS.alarmHistoryCount, function (count) {
                    count = count || 0;
                    if (count > 0) {
                        Alarms.loadHistory(count);
                    } else {
                        state.alarmHistory = [];
                        Alarms.updateHistoryDisplay();
                    }
                });
            }
        },

        loadActiveAlarms: function (count) {
            var alarms = [];
            var loaded = 0;
            var toLoad = Math.min(count, Alarms.CONFIG.maxActiveRows);

            for (var i = 1; i <= toLoad; i++) {
                (function (index) {
                    readSymbol(SYMBOLS.alarmList + '[' + index + ']', function (data) {
                        if (data) {
                            data.index = index;
                            alarms.push(data);
                        }
                        loaded++;
                        if (loaded >= toLoad) {
                            alarms.sort(function (a, b) {
                                if (a.Severity !== b.Severity) return a.Severity - b.Severity;
                                return a.ID - b.ID;
                            });
                            state.activeAlarms = alarms;
                            Alarms.updateActiveDisplay();
                        }
                    });
                })(i);
            }
        },

        loadHistory: function (count) {
            var history = [];
            var loaded = 0;
            var toLoad = Math.min(count, Alarms.CONFIG.maxHistoryRows);

            for (var i = count; i > Math.max(0, count - toLoad) ; i--) {
                (function (index) {
                    readSymbol(SYMBOLS.alarmHistory + '[' + index + ']', function (data) {
                        if (data) {
                            data.index = index;
                            history.push(data);
                        }
                        loaded++;
                        if (loaded >= toLoad) {
                            state.alarmHistory = history;
                            Alarms.updateHistoryDisplay();
                        }
                    });
                })(i);
            }
        },

        updateActiveDisplay: function () {
            var alarms = state.activeAlarms;

            if (alarms.length === 0) {
                setVisible('panelNoAlarms', true);
                setVisible('scrollActiveAlarms', false);
            } else {
                setVisible('panelNoAlarms', false);
                setVisible('scrollActiveAlarms', true);

                for (var i = 0; i < Alarms.CONFIG.maxActiveRows; i++) {
                    var rowNum = i + 1;
                    if (i < alarms.length) {
                        Alarms.updateAlarmRow(rowNum, alarms[i]);
                    } else {
                        Alarms.hideAlarmRow(rowNum);
                    }
                }
            }
        },

        updateAlarmRow: function (rowNum, alarm) {
            var prefix = 'alarmRow' + rowNum;

            setVisible(prefix + '_bg', true);

            var isCritical = alarm.Severity === 1;
            setBackgroundColor(prefix + '_sevIcon', isCritical ? Alarms.COLORS.critical : Alarms.COLORS.warning);
            setText(prefix + '_sevIcon', isCritical ? '!' : '⚠');
            setTextColor(prefix + '_sevIcon', isCritical ? '#fff' : '#000');

            setText(prefix + '_id', '#' + alarm.ID);
            setText(prefix + '_time', alarm.Timestamp_Occurred || '--:--:--');
            setText(prefix + '_name', alarm.Name || '');
            setText(prefix + '_desc', alarm.Description || '');

            if (alarm.Acknowledged) {
                setText(prefix + '_btnAck', '✓ ACK');
                setBackgroundColor(prefix + '_btnAck', Alarms.COLORS.normal);
                setBorderColor(prefix + '_btnAck', Alarms.COLORS.normal);
                setTextColor(prefix + '_btnAck', '#fff');
                setEnabled(prefix + '_btnAck', false);
            } else {
                setText(prefix + '_btnAck', 'ACK');
                setBackgroundColor(prefix + '_btnAck', Alarms.COLORS.buttonBg);
                setBorderColor(prefix + '_btnAck', Alarms.COLORS.warning);
                setTextColor(prefix + '_btnAck', Alarms.COLORS.warning);
                setEnabled(prefix + '_btnAck', true);
            }

            var ctrl = TcHmi.Controls.get(prefix + '_bg');
            if (ctrl) ctrl.__alarmData = alarm;
        },

        hideAlarmRow: function (rowNum) {
            setVisible('alarmRow' + rowNum + '_bg', false);
        },

        updateHistoryDisplay: function () {
            var history = state.alarmHistory;

            if (history.length === 0) {
                setVisible('panelNoHistory', true);
                setVisible('scrollHistory', false);
            } else {
                setVisible('panelNoHistory', false);
                setVisible('scrollHistory', true);

                for (var i = 0; i < Alarms.CONFIG.maxHistoryRows; i++) {
                    var rowNum = i + 1;
                    if (i < history.length) {
                        Alarms.updateHistoryRow(rowNum, history[i]);
                    } else {
                        Alarms.hideHistoryRow(rowNum);
                    }
                }
            }
        },

        updateHistoryRow: function (rowNum, record) {
            var prefix = 'historyRow' + rowNum;

            setVisible(prefix + '_bg', true);

            var isCritical = record.Severity === 1;
            setBackgroundColor(prefix + '_sevIcon', isCritical ? Alarms.COLORS.critical : Alarms.COLORS.warning);

            setText(prefix + '_occurred', record.Time_Occurred || '--');
            setText(prefix + '_cleared', record.Time_Cleared || '--');
            setText(prefix + '_name', record.Alarm_Name || '');
            setText(prefix + '_duration', formatDuration(record.Duration_Sec));
            setText(prefix + '_acked', record.Was_Acknowledged ? '✓' : '✗');
            setTextColor(prefix + '_acked', record.Was_Acknowledged ? Alarms.COLORS.normal : Alarms.COLORS.critical);
        },

        hideHistoryRow: function (rowNum) {
            setVisible('historyRow' + rowNum + '_bg', false);
        },

        startBlinking: function () {
            state.blinkTimer = setInterval(function () {
                state.alarmBlinkState = !state.alarmBlinkState;
                Alarms.updateBlinkState();
            }, Alarms.CONFIG.blinkInterval);
        },

        updateBlinkState: function () {
            for (var i = 0; i < state.activeAlarms.length && i < Alarms.CONFIG.maxActiveRows; i++) {
                var alarm = state.activeAlarms[i];
                if (!alarm.Acknowledged) {
                    var rowNum = i + 1;
                    setOpacity('alarmRow' + rowNum + '_bg', state.alarmBlinkState ? 1 : 0.6);
                } else {
                    setOpacity('alarmRow' + (i + 1) + '_bg', 1);
                }
            }
        },

        acknowledgeAlarm: function (alarmId) {
            console.log('Alarms: Acknowledging alarm ID ' + alarmId);
            writeSymbol(SYMBOLS.alarmAck + '[' + alarmId + ']', true, function () {
                setTimeout(function () {
                    writeSymbol(SYMBOLS.alarmAck + '[' + alarmId + ']', false);
                }, 100);
            });
        },

        acknowledgeAll: function () {
            console.log('Alarms: Acknowledging all alarms');
            writeSymbol(SYMBOLS.alarmAckAll, true, function () {
                setTimeout(function () {
                    writeSymbol(SYMBOLS.alarmAckAll, false);
                }, 100);
            });
        },

        resetAlarms: function () {
            console.log('Alarms: Sending reset command');
            writeSymbol(SYMBOLS.resetCmd, true, function () {
                setTimeout(function () {
                    writeSymbol(SYMBOLS.resetCmd, false);
                }, 500);
            });
        },

        showClearDialog: function () {
            setVisible('dialogOverlay', true);
        },

        hideDialog: function () {
            setVisible('dialogOverlay', false);
        },

        confirmClearHistory: function () {
            console.log('Alarms: Clearing history');
            Alarms.hideDialog();
            writeSymbol(SYMBOLS.alarmClearHistory, true, function () {
                setTimeout(function () {
                    writeSymbol(SYMBOLS.alarmClearHistory, false);
                }, 100);
            });
        }
    };

    // =========================================================================
    // CLEANUP
    // =========================================================================
    function cleanup() {
        if (state.pollTimer) {
            clearInterval(state.pollTimer);
            state.pollTimer = null;
        }
        if (state.blinkTimer) {
            clearInterval(state.blinkTimer);
            state.blinkTimer = null;
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    return {
        init: function (pageName) {
            cleanup();
            state.currentPage = pageName;
            state.entryValue = '0';

            switch (pageName) {
                case 'Desktop': Desktop.init(); break;
                case 'Auto': Auto.init(); break;
                case 'Numeric': Numeric.init(); break;
                case 'Reverse': Reverse.init(); break;
                case 'Manual': Manual.init(); break;
                case 'Recipe': Recipe.init(); break;
                case 'Maint':
                case 'Maintenance': Maint.init(); break;
                case 'Steps': Steps.init(); break;
                case 'Trends': Trends.init(); break;
                case 'Alarms': Alarms.init(); break;
                default:
                    console.warn('LoadBank: Unknown page "' + pageName + '"');
            }
        },

        cleanup: cleanup,
        navigate: navigate,
        updatePowerStatusColor: updatePowerStatusColor,

        Desktop: Desktop,
        Auto: Auto,
        Numeric: Numeric,
        Reverse: Reverse,
        Manual: Manual,
        Recipe: Recipe,
        Maint: Maint,
        Steps: Steps,
        Trends: Trends,
        Alarms: Alarms
    };

})(TcHmi);

// Auto-detect page and initialize
(function (TcHmi) {
    'use strict';

    TcHmi.EventProvider.register('onInitialized', function (e, data) {
        e.destroy();

        setTimeout(function () {
            var pageMap = {
                'Desktop': 'Desktop',
                'Auto': 'Auto',
                'Numeric': 'Numeric',
                'Reverse': 'Reverse',
                'Manual': 'Manual',
                'Recipe': 'Recipe',
                'Maintenance': 'Maintenance',
                'Steps': 'Steps',
                'Trends': 'Trends',
                'Alarms': 'Alarms'
            };

            for (var id in pageMap) {
                if (TcHmi.Controls.get(id)) {
                    LoadBank.init(pageMap[id]);
                    return;
                }
            }

            console.warn('LoadBank: Could not detect page');
        }, 300);
    });
})(TcHmi);
