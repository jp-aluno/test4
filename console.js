/**
 * @file console.js
 * @description Integrated on-screen debugger with global error catching.
 * @version 1.1.0
 */

!function() {
    "use strict";

    // 1. GLOBAL ERROR CATCHER (Must be defined immediately)
    window.onerror = function (msg, url, line, col, error) {
        var extra = !col ? '' : '\nColumn: ' + col;
        var stack = (error && error.stack) ? '\nStack: ' + error.stack : '';
        
        var formattedMsg = "❌ JAVASCRIPT ERROR:\n" + 
                           "-------------------\n" +
                           "Message: " + msg + "\n" +
                           "File: " + url + "\n" +
                           "Line: " + line + extra + stack;

        // If the custom console is initialized and active, use it.
        // Otherwise, use the legacy alert.
        if (typeof isConsole !== 'undefined' && isConsole) {
            // We pass the error object if available to trigger your stack parser
            console.error(error || formattedMsg);
        } else {
            alert(formattedMsg);
        }

        return false; // Show in browser console as well
    };

    // 2. INITIALIZE VARIABLES
    var isResizing = false;
    var lastY = 0;

    var getParams = (function() {
        var params = {};
        var search = location.search.slice(1).split('&');
        for (var i = 0; i < search.length; i++) {
            if (!search[i]) continue;
            var pair = search[i].split('=');
            params[pair[0]] = pair[1] !== undefined ? decodeURIComponent(pair[1]) : false;
        }
        return function(key) { return params[key] !== undefined ? params[key] : false; };
    })();
    
    var isConsole = getParams("console") === "true";
    var isLink = getParams("link") === "true";

    const consoleStyles = {
        log: { emoji: '🟢', border: '#4CAF50' },
        warn: { emoji: '🟡', border: '#FFEB3B' },
        error: { emoji: '🔴', border: '#F44336' },
        info: { emoji: '🔵', border: '#2196F3' },
        debug: { emoji: '⚪', border: '#FFFFFF' }
    };

    const styles = {
        body: { overflowX: "hidden", height: "100vh" },
        frameContainer: {
            marginTop: "15px", display: "flex", flexDirection: "column",
            alignItems: "center", width: "100%", position: "fixed",
            bottom: "0", left: "0", margin: "0", padding: "0",
            zIndex: "2147483647", backgroundColor: "transparent", boxSizing: "border-box"
        },
        resizeHandle: { backgroundColor: "#444", height: "15px", cursor: "grab", width: "100%" },
        consoleOutput: {
            display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif",
            width: "100%", backgroundColor: "#282828", color: "white",
            padding: "10px", boxSizing: "border-box", overflowY: "scroll", height: "50%"
        },
        consoleEntry: {
            display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.1)",
            padding: "10px", margin: "5px 0", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
        }
    };

    if (isConsole) {
        var logQueue = [];
        var domReady = false;

        var safeAddToConsole = function(msg, type) {
            if (domReady) { addToConsole(msg, type); } 
            else { logQueue.push({ msg: msg, type: type }); }
        };

        var processQueue = function() {
            domReady = true;
            while (logQueue.length > 0) {
                var item = logQueue.shift();
                addToConsole(item.msg, item.type);
            }
        };

        // --- CONSOLE OVERRIDES ---
        try {
            var originalConsoleLog = console.log;
            var originalConsoleWarn = console.warn;
            var originalConsoleError = console.error;
            var originalConsoleDebug = console.debug;
            var originalConsoleInfo = console.info;

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
                var errorArg = args[0];
                safeAddToConsole(errorArg instanceof Error ? errorArg : args.join(' '), 'error');
            };

            console.info = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleInfo) originalConsoleInfo.apply(console, args);
                safeAddToConsole(args.join(' '), 'info');
            };

            console.debug = function() {
                var args = Array.prototype.slice.call(arguments);
                if (originalConsoleDebug) originalConsoleDebug.apply(console, args);
                safeAddToConsole(args.join(' '), 'debug');
            };
        } catch (e) {
            alert("Error setting up console: " + e.message);
        }
   
        function applyStyles(element, styleObject) {
            for (var prop in styleObject) {
                if (styleObject.hasOwnProperty(prop)) {
                    element.style[prop] = styleObject[prop];
                }
            }
        };

        function modifyBody() {
            applyStyles(document.body, styles.body);

            const frameContainer = document.createElement('div');
            frameContainer.id = 'debug-console-root';
            applyStyles(frameContainer, styles.frameContainer);

            const resizeHandle = document.createElement('div');
            resizeHandle.id = 'resizeHandle';
            applyStyles(resizeHandle, styles.resizeHandle);

            const outputContainer = document.createElement('div');
            outputContainer.id = 'consoleOutput';
            applyStyles(outputContainer, styles.consoleOutput);

            frameContainer.appendChild(resizeHandle);
            frameContainer.appendChild(outputContainer);
            (document.body || document.documentElement).appendChild(frameContainer);

            outputContainer.style.height = (window.innerHeight / 3) + "px";

            resizeHandle.addEventListener('mousedown', startResizing);
            document.addEventListener('mousemove', handleResize, { passive: true });
            document.addEventListener('mouseup', stopResizing);
            resizeHandle.addEventListener('touchstart', startResizing, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (isResizing) { e.preventDefault(); handleResize(e); }
            }, { passive: false });
            
            document.addEventListener('touchend', stopResizing, { passive: true });

            function handleResize(e) {
                if (!isResizing) return;
                const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                const deltaY = clientY - lastY;
                const newHeight = outputContainer.clientHeight - deltaY;
                if (newHeight > 50 && newHeight < window.innerHeight - 50) {
                    outputContainer.style.height = newHeight + "px";
                }
                lastY = clientY;
            };
        };

        function addToConsole(message, type) {
            const entry = document.createElement('div');
            applyStyles(entry, styles.consoleEntry);

            const style = consoleStyles[type] || { emoji: '', border: '#000' };
            entry.style.borderLeft = "5px solid " + style.border;

            const emojiElement = document.createElement('span');
            emojiElement.textContent = style.emoji + " ";

            if (type === 'error' && message instanceof Error) {
                const errorNameDiv = document.createElement('div');
                errorNameDiv.style.fontWeight = 'bold';
                errorNameDiv.appendChild(emojiElement);
                errorNameDiv.appendChild(document.createTextNode(message.name + ": " + message.message));

                const errorStackDiv = document.createElement('div');
                errorStackDiv.style.paddingLeft = '20px';
                errorStackDiv.style.fontSize = '0.9em';
                errorStackDiv.style.color = '#ccc';

                const stackEntries = parseStack(message);
                const table = document.createElement('table');
                table.style.borderCollapse = 'collapse';
                table.style.width = '100%';

                stackEntries.forEach(entry => {
                    const row = document.createElement('tr');
                    const fileCell = document.createElement('td');
                    const link = document.createElement('a');
                    link.href = "#";
                    link.textContent = entry.fileName + ":" + entry.lineNumber;
                    link.style.color = 'royalblue';
                    link.onclick = (e) => { e.preventDefault(); fetchFileContent(entry.fullFile, entry.lineNumber); };
                    
                    fileCell.appendChild(link);
                    row.appendChild(fileCell);
                    table.appendChild(row);
                });

                errorStackDiv.appendChild(table);
                entry.appendChild(errorNameDiv);
                entry.appendChild(errorStackDiv);
            } else {
                const messageDiv = document.createElement('div');
                messageDiv.appendChild(emojiElement);
                messageDiv.appendChild(document.createTextNode(String(message)));
                entry.appendChild(messageDiv);
            }

            const out = document.getElementById('consoleOutput');
            if (out) {
                out.appendChild(entry);
                out.scrollTop = out.scrollHeight;
            }
        };

        function fetchFileContent(fileUrl, errorLine) {
            fetch(fileUrl)
                .then(res => res.text())
                .then(data => fullScreen(data, errorLine))
                .catch(err => console.error("Fetch failed: " + err));
        };

        function parseStack(error) {
            const stack = error.stack || "";
            const lines = stack.split('\n');
            const stackArr = [];
            const chromeRegex = /at\s+(?:(.*?)\s+\()?\/?(.+?):(\d+):(\d+)\)?/;
            
            lines.forEach(line => {
                let match = line.match(chromeRegex);
                if (match) {
                    stackArr.push({
                        fileName: match[2].split('/').pop(),
                        fullFile: match[2],
                        lineNumber: parseInt(match[3], 10),
                        columnNumber: parseInt(match[4], 10)
                    });
                }
            });
            return stackArr;
        };

        function escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
        };

        function fullScreen(content, errorLine) {
            const lines = content.split('\n');
            var html = `<html><head><style>
                body { background: #222; color: #ccc; font-family: monospace; padding: 20px; }
                .hl { background: #554400; color: #fff; display: block; }
                .ln { color: #666; margin-right: 1em; }
            </style></head><body>`;
            
            lines.forEach((line, i) => {
                const num = i + 1;
                const cls = num === errorLine ? 'hl' : '';
                html += `<div class="${cls}"><span class="ln">${num}</span>${escapeHtml(line)}</div>`;
            });

            const blob = new Blob([html + "</body></html>"], { type: 'text/html' });
            window.open(URL.createObjectURL(blob));
        };

        function startResizing(e) {
            isResizing = true;
            lastY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        };

        function stopResizing() { isResizing = false; };

        window.addEventListener("load", function() {
            modifyBody();
            processQueue();
        });

        console.debug("Console.js Active");
    };
}();
