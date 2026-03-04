/**
 * @file console.js
 * @description Mobile-friendly on-screen console debugger.
 * @version 1.1.0
 * @compatibility Minimal ES Version: ES5
 * @target Chrome 39+, Firefox 4+, Safari 5+
 */
!function() {
    // 1. Initialize variables using 'var' for legacy support
    var isResizing = false;
    var lastY = 0;

    // 2. Legacy URL Parameter Extractor (replaces Map)
    var getParams = (function() {
        var params = {};
        var search = location.search.slice(1);
        if (search) {
            var parts = search.split('&');
            for (var i = 0; i < parts.length; i++) {
                if (!parts[i]) continue;
                var pair = parts[i].split('=');
                params[pair[0]] = pair[1] !== undefined ? decodeURIComponent(pair[1]) : false;
            }
        }
        return function(key) { 
            return params[key] !== undefined ? params[key] : false; 
        };
    })();

    var isConsole = getParams("console") === "true";

    var consoleStyles = {
        log: { emoji: '🟢', border: '#4CAF50' },
        warn: { emoji: '🟡', border: '#FFEB3B' },
        error: { emoji: '🔴', border: '#F44336' },
        info: { emoji: '🔵', border: '#2196F3' },
        debug: { emoji: '⚪', border: '#FFFFFF' }
    };

    var styles = {
        body: { margin: "0", padding: "0", overflowX: "hidden", height: "100vh" },
        frameContainer: { marginTop: "15px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "fixed", bottom: "0", zIndex: "9999" },
        resizeHandle: { backgroundColor: "#444", height: "15px", cursor: "ns-resize", width: "100%" },
        consoleOutput: { display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", width: "100%", backgroundColor: "#282828", color: "white", padding: "10px", boxSizing: "border-box", overflowY: "scroll", height: "50%" },
        consoleEntry: { display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.1)", padding: "10px", margin: "5px 0", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }
    };

    if (isConsole) {
        try {
            var originalConsoleLog = console.log;
            var originalConsoleWarn = console.warn;
            var originalConsoleError = console.error;
            var originalConsoleDebug = console.debug;

            var logQueue = [];
            var domReady = false;

            function safeAddToConsole(msg, type) {
                if (domReady) {
                    addToConsole(msg, type);
                } else {
                    logQueue.push({ msg: msg, type: type });
                }
            }

            function processQueue() {
                domReady = true;
                for (var i = 0; i < logQueue.length; i++) {
                    addToConsole(logQueue[i].msg, logQueue[i].type);
                }
                logQueue = [];
            }

            // Override methods using 'arguments' object (replaces ...args)
            console.log = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleLog) originalConsoleLog.apply(console, args);
                safeAddToConsole(args.join(' '), 'log');
            };

            console.warn = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleWarn) originalConsoleWarn.apply(console, args);
                safeAddToConsole(args.join(' '), 'warn');
            };

            console.error = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleError) originalConsoleError.apply(console, args);
                var error = args[0];
                safeAddToConsole(error instanceof Error ? error : String(error), 'error');
            };

            console.info = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleDebug) originalConsoleDebug.apply(console, args);
                safeAddToConsole(args.join(' '), 'info');
            };

            console.debug = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleDebug) originalConsoleDebug.apply(console, args);
                safeAddToConsole(args.join(' '), 'debug');
            };
        } catch (e) {
            alert("Debug setup error: " + e.message);
        }

        // ES5 Style applier (replaces Proxy/Object.assign)
        function applyStyles(element, styleObject) {
            for (var prop in styleObject) {
                if (styleObject.hasOwnProperty(prop)) {
                    element.style[prop] = styleObject[prop];
                }
            }
        }

        function modifyBody() {
            applyStyles(document.body, styles.body);

            var frameContainer = document.createElement('div');
            frameContainer.id = 'frameContainer';
            applyStyles(frameContainer, styles.frameContainer);

            var resizeHandle = document.createElement('div');
            resizeHandle.id = 'resizeHandle';
            applyStyles(resizeHandle, styles.resizeHandle);

            var outputContainer = document.createElement('div');
            outputContainer.id = 'consoleOutput';
            applyStyles(outputContainer, styles.consoleOutput);

            frameContainer.appendChild(resizeHandle);
            frameContainer.appendChild(outputContainer);
            document.body.appendChild(frameContainer);

            outputContainer.style.height = (window.screen.height / 3) + "px";

            // Event Handlers
            resizeHandle.addEventListener('mousedown', startResizing);
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResizing);
            resizeHandle.addEventListener('touchstart', startResizing);
            document.addEventListener('touchmove', function(e) {
                if (isResizing) {
                    if (e.cancelable) e.preventDefault();
                    handleResize(e);
                }
            });
            document.addEventListener('touchend', stopResizing);

            function handleResize(e) {
                if (!isResizing) return;
                var clientY = e.clientY || (e.touches && e.touches[0].clientY);
                var deltaY = clientY - lastY;
                var newHeight = outputContainer.clientHeight - deltaY;
                
                if (newHeight > 50 && newHeight < window.innerHeight - 50) {
                    outputContainer.style.height = newHeight + "px";
                }
                lastY = clientY;
            }
        }

        function addToConsole(message, type) {
            var output = document.getElementById('consoleOutput');
            if (!output) return;

            var entry = document.createElement('div');
            applyStyles(entry, styles.consoleEntry);

            var config = consoleStyles[type] || { emoji: '', border: '#000' };
            entry.style.borderLeft = "5px solid " + config.border;

            var content = document.createElement('div');
            content.innerHTML = '<span style="margin-right:8px">' + config.emoji + '</span>' + 
                                (message && message.message ? message.message : message);
            
            entry.appendChild(content);
            output.appendChild(entry);
            output.scrollTop = output.scrollHeight;
        }

        function startResizing(e) {
            isResizing = true;
            lastY = e.clientY || (e.touches && e.touches[0].clientY);
            document.body.style.cursor = 'ns-resize';
        }

        function stopResizing() {
            isResizing = false;
            document.body.style.cursor = 'default';
        }

        window.addEventListener("load", function() {
            modifyBody();
            processQueue();
        });

        console.debug("Console.js loaded (Legacy Mode)");
    }
}();
