/**
 * ThemeManager.js - Load Bank HMI Theme Controller
 * =================================================
 * 
 * Subscribes to HMI_Theme_Dark_Mode PLC variable and switches
 * between LoadBankNavyTheme (dark) and LoadBankLightTheme (light)
 * 
 * PLC Variable: GVL_HMI.HMI_Theme_Dark_Mode : BOOL
 *   - TRUE  = Dark theme (LoadBankNavyTheme)
 *   - FALSE = Light theme (LoadBankLightTheme)
 */

(function (TcHmi) {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    var CONFIG = {
        plcSymbol: '%s%PLC1.GVL_LoadBank_Runtime.LB_HMI_Theme_Dark_Mode%/s%',
        darkTheme: 'LoadBankNavyTheme',
        lightTheme: 'LoadBankLightTheme',
        defaultToDark: true  // Default if PLC read fails
    };

    // =========================================================================
    // STATE
    // =========================================================================
    var state = {
        currentTheme: null,
        initialized: false,
        subscription: null
    };

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    var destroyOnInit = TcHmi.EventProvider.register('onInitialized', function (e, data) {
        e.destroy();
        
        // Small delay to ensure TcHmi is fully ready
        setTimeout(function() {
            console.log('ThemeManager: Initializing...');
            initThemeManager();
        }, 100);
    });

    function initThemeManager() {
        // Read initial value
        readThemeSetting(function(isDarkMode) {
            applyTheme(isDarkMode);
            state.initialized = true;
            console.log('ThemeManager: Initial theme applied - ' + (isDarkMode ? 'Dark' : 'Light'));
        });
        
        // Subscribe to changes
        subscribeToThemeSetting();
    }

    // =========================================================================
    // PLC COMMUNICATION
    // =========================================================================
    function readThemeSetting(callback) {
        TcHmi.Symbol.readEx(CONFIG.plcSymbol, function(result) {
            if (result && result.error === TcHmi.Errors.NONE) {
                callback(result.value === true);
            } else {
                console.warn('ThemeManager: Could not read theme setting, using default');
                callback(CONFIG.defaultToDark);
            }
        });
    }

    function subscribeToThemeSetting() {
        try {
            var symbol = new TcHmi.Symbol(CONFIG.plcSymbol);
            
            state.subscription = symbol.watch(function(result) {
                if (result && result.error === TcHmi.Errors.NONE) {
                    var isDarkMode = result.value === true;
                    
                    // Only apply if different from current
                    var targetTheme = isDarkMode ? CONFIG.darkTheme : CONFIG.lightTheme;
                    if (state.currentTheme !== targetTheme) {
                        applyTheme(isDarkMode);
                        console.log('ThemeManager: Theme changed to ' + (isDarkMode ? 'Dark' : 'Light'));
                    }
                }
            });
            
            console.log('ThemeManager: Subscribed to theme changes');
        } catch (e) {
            console.error('ThemeManager: Failed to subscribe - ' + e.message);
        }
    }

    // =========================================================================
    // THEME APPLICATION
    // =========================================================================
    function applyTheme(isDarkMode) {
        var themeName = isDarkMode ? CONFIG.darkTheme : CONFIG.lightTheme;
        
        try {
            // Use TcHmi's built-in theme switching
            TcHmi.Theme.set(themeName, function(result) {
                if (result === TcHmi.Errors.NONE) {
                    state.currentTheme = themeName;
                    console.log('ThemeManager: Successfully applied ' + themeName);
                    
                    // Dispatch custom event for any listeners
                    dispatchThemeChangeEvent(isDarkMode, themeName);
                } else {
                    console.error('ThemeManager: Failed to apply theme ' + themeName);
                }
            });
        } catch (e) {
            console.error('ThemeManager: Error applying theme - ' + e.message);
        }
    }

    // =========================================================================
    // EVENT DISPATCH
    // =========================================================================
    function dispatchThemeChangeEvent(isDarkMode, themeName) {
        // Create and dispatch a custom event that other scripts can listen to
        var event = new CustomEvent('loadbank-theme-changed', {
            detail: {
                isDarkMode: isDarkMode,
                themeName: themeName,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // =========================================================================
    // PUBLIC API (optional - for manual theme control)
    // =========================================================================
    window.LoadBankThemeManager = {
        /**
         * Get current theme name
         */
        getCurrentTheme: function() {
            return state.currentTheme;
        },
        
        /**
         * Check if dark mode is active
         */
        isDarkMode: function() {
            return state.currentTheme === CONFIG.darkTheme;
        },
        
        /**
         * Manually set theme (also writes to PLC)
         * @param {boolean} darkMode - true for dark, false for light
         */
        setTheme: function(darkMode) {
            TcHmi.Symbol.writeEx(CONFIG.plcSymbol, darkMode, function(result) {
                if (result && result.error === TcHmi.Errors.NONE) {
                    console.log('ThemeManager: Theme preference saved to PLC');
                } else {
                    console.warn('ThemeManager: Could not save theme preference to PLC');
                    // Apply locally anyway
                    applyTheme(darkMode);
                }
            });
        },
        
        /**
         * Toggle between dark and light themes
         */
        toggleTheme: function() {
            var newDarkMode = state.currentTheme !== CONFIG.darkTheme;
            this.setTheme(newDarkMode);
        },
        
        /**
         * Get theme configuration
         */
        getConfig: function() {
            return {
                darkTheme: CONFIG.darkTheme,
                lightTheme: CONFIG.lightTheme,
                plcSymbol: CONFIG.plcSymbol
            };
        }
    };

    // =========================================================================
    // CLEANUP
    // =========================================================================
    TcHmi.EventProvider.register('onDestroyed', function(e, data) {
        if (state.subscription) {
            // Unsubscribe if possible
            state.subscription = null;
        }
        console.log('ThemeManager: Destroyed');
    });

})(TcHmi);
