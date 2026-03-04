(() => {
    // 1. Use const and let
    let isResizing = false;
    let lastY = 0;

    // 2. Modern URLSearchParams (replaces the manual loop)
    const params = new URLSearchParams(window.location.search);
    const isConsole = params.get("console") === "true";

    const consoleStyles = {
        log: { emoji: '🟢', border: '#4CAF50' },
        warn: { emoji: '🟡', border: '#FFEB3B' },
        error: { emoji: '🔴', border: '#F44336' },
        info: { emoji: '🔵', border: '#2196F3' },
        debug: { emoji: '⚪', border: '#FFFFFF' }
    };

    const styles = {
        body: { margin: "0", padding: "0", overflowX: "hidden", height: "100vh" },
        frameContainer: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "fixed", bottom: "0", zIndex: "9999" },
        resizeHandle: { backgroundColor: "#444", height: "15px", cursor: "grab", width: "100%" },
        consoleOutput: { display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", width: "100%", backgroundColor: "#282828", color: "white", padding: "10px", boxSizing: "border-box", overflowY: "scroll", height: "33vh" },
        consoleEntry: { display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.1)", padding: "10px", margin: "5px 0", borderRadius: "5px" }
    };

    if (isConsole) {
        // 3. Arrow function for error catcher
        window.onerror = (msg, url, line) => {
            console.error(`${msg} at ${line}`);
            return false;
        };

        const originalConsole = { ...console }; // Spread operator to clone
        let logQueue = [];
        let domReady = false;

        const applyStyles = (element, styleObject) => {
            Object.assign(element.style, styleObject); // Object.assign is much cleaner
        };

        const addToConsole = (message, type) => {
            const output = document.getElementById('consoleOutput');
            if (!output) return;

            const entry = document.createElement('div');
            applyStyles(entry, styles.consoleEntry);
            
            const { emoji, border } = consoleStyles[type] || { emoji: '', border: '#000' };
            entry.style.borderLeft = `5px solid ${border}`; // Template literal
            entry.innerHTML = `<span>${emoji} ${message}</span>`;
            
            output.appendChild(entry);
            output.scrollTop = output.scrollHeight;
        };

        const safeAddToConsole = (msg, type) => {
            domReady ? addToConsole(msg, type) : logQueue.push({ msg, type });
        };

        // 4. Overriding using Rest Parameters (...)
        ['log', 'warn', 'error', 'debug'].forEach(method => {
            console[method] = (...args) => {
                originalConsole[method]?.(...args);
                safeAddToConsole(args.join(' '), method);
            };
        });

        const modifyBody = () => {
            applyStyles(document.body, styles.body);

            const frame = document.createElement('div');
            const handle = document.createElement('div');
            const output = document.createElement('div');

            frame.id = 'frameContainer';
            handle.id = 'resizeHandle';
            output.id = 'consoleOutput';

            applyStyles(frame, styles.frameContainer);
            applyStyles(handle, styles.resizeHandle);
            applyStyles(output, styles.consoleOutput);

            frame.append(handle, output); // append() can take multiple elements
            document.body.appendChild(frame);

            domReady = true;
            logQueue.forEach(item => addToConsole(item.msg, item.type));
            logQueue = [];
        };

        window.addEventListener("load", modifyBody);
        console.log("ES6 Console initialized! 🚀");
    }
})();
