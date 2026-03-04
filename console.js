!function() {
    // 1. Use 'var' for old phone support
    var isResizing = false;
    var lastY = 0;

    var getParams = (function() {
        var params = {};
        var search = location.search.slice(1);
        if (!search) return function() { return false; };
        
        var parts = search.split('&');
        for (var i = 0; i < parts.length; i++) {
            var pair = parts[i].split('=');
            params[pair[0]] = pair[1] !== undefined ? decodeURIComponent(pair[1]) : false;
        }
        return function(key) { return params[key] || false; };
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
        resizeHandle: { backgroundColor: "#444", height: "15px", cursor: "grab", width: "100%" },
        consoleOutput: { display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", width: "100%", backgroundColor: "#282828", color: "white", padding: "10px", boxSizing: "border-box", overflowY: "scroll", height: "50%" },
        consoleEntry: { display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.1)", padding: "10px", margin: "5px 0", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }
    };

    if (isConsole) {
        // GLOBAL ERROR CATCHER (Great for old phones)
        window.onerror = function(msg, url, line) {
            console.error(msg + " at " + line);
            return false;
        };

        var originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };

        var logQueue = [];
        var domReady = false;

        function safeAddToConsole(msg, type) {
            if (domReady) {
                addToConsole(msg, type);
            } else {
                logQueue.push({ msg: msg, type: type });
            }
        }

        // Re-writing overrides to avoid spread operators (...)
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            if (originalConsole.log) originalConsole.log.apply(console, args);
            safeAddToConsole(args.join(' '), 'log');
        };

        console.error = function() {
            var args = Array.prototype.slice.call(arguments);
            if (originalConsole.error) originalConsole.error.apply(console, args);
            safeAddToConsole(args.join(' '), 'error');
        };

        function applyStyles(element, styleObject) {
            for (var prop in styleObject) {
                if (styleObject.hasOwnProperty(prop)) {
                    element.style[prop] = styleObject[prop];
                }
            }
        }

        function addToConsole(message, type) {
            var output = document.getElementById('consoleOutput');
            if (!output) return;

            var entry = document.createElement('div');
            applyStyles(entry, styles.consoleEntry);
            
            var style = consoleStyles[type] || { emoji: '', border: '#000' };
            entry.style.borderLeft = "5px solid " + style.border;
            entry.innerHTML = "<span>" + style.emoji + " " + message + "</span>";
            
            output.appendChild(entry);
            output.scrollTop = output.scrollHeight;
        }

        function modifyBody() {
            applyStyles(document.body, styles.body);

            var frame = document.createElement('div');
            frame.id = 'frameContainer';
            applyStyles(frame, styles.frameContainer);

            var handle = document.createElement('div');
            handle.id = 'resizeHandle';
            applyStyles(handle, styles.resizeHandle);

            var output = document.createElement('div');
            output.id = 'consoleOutput';
            applyStyles(output, styles.consoleOutput);

            frame.appendChild(handle);
            frame.appendChild(output);
            document.body.appendChild(frame);

            domReady = true;
            for (var i = 0; i < logQueue.length; i++) {
                addToConsole(logQueue[i].msg, logQueue[i].type);
            }
            logQueue = [];
        }

        window.addEventListener("load", modifyBody);
        
        console.log("Console initialized!");
    }
}();
