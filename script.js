document.addEventListener("DOMContentLoaded", () => {
    /* ==========================================================================
       1. GLOBAL STATE & SELECTOR CONFIGURATION LAYER
       ========================================================================== */
    let activeToolId = null;

    // View Components
    const dashboardView = document.getElementById("dashboard-view");
    const workspaceView = document.getElementById("workspace-view");
    const calculatorsGrid = document.getElementById("calculators-root-grid");
    const searchInput = document.getElementById("calc-search");
    const categoryTabs = document.querySelectorAll(".cat-tab");
    
    // Recent Tracking Components
    const recentContainer = document.getElementById("recent-container");
    const recentChipsWrapper = document.getElementById("recent-chips");

    // Workspace Active Regions
    const inputContainer = document.getElementById("input-panel-container");
    const outputContainer = document.getElementById("output-panel-container");
    const breadcrumbHome = document.getElementById("breadcrumb-home");
    const breadcrumbActive = document.getElementById("breadcrumb-active");
    const brandLogo = document.getElementById("brand-logo");

    /* ==========================================================================
       2. ACTIVE GLOBAL DYNAMIC CURRENCY LAYER
       ========================================================================== */
    let currentCurrencyCode = "INR";
    let currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

    const currencySelector = document.getElementById("currency-selector");
    if (currencySelector) {
        currencySelector.addEventListener("change", (e) => {
            currentCurrencyCode = e.target.value;
            const localeMap = { "INR": "en-IN", "USD": "en-US", "EUR": "de-DE", "GBP": "en-GB" };
            
            currencyFormatter = new Intl.NumberFormat(localeMap[currentCurrencyCode] || "en-IN", {
                style: "currency",
                currency: currentCurrencyCode,
                maximumFractionDigits: 0
            });
            
            const openForm = workspaceView.querySelector(".calc-panel:not(.hidden) form");
            if (openForm) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                openForm.dispatchEvent(submitEvent);
            }
        });
    }

    /* ==========================================================================
       3. ENGINE INTERACTIVE MATRIX REGISTRY DEFINITIONS
       ========================================================================== */
    const registry = {
        emi: {
            title: "EMI Loan Calculator",
            renderInputs: () => `
                <div class="calc-panel">
                    <h2>EMI Loan Calculator</h2>
                    <form id="form-emi" novalidate>
                        <div class="input-group">
                            <label for="emi-amount">Principal Loan Amount</label>
                            <input type="number" id="emi-amount" required min="1" step="any" placeholder="e.g., 500000">
                            <span class="error-msg">Please enter a valid loan amount.</span>
                        </div>
                        <div class="input-group">
                            <label for="emi-rate">Annual Interest Rate (%)</label>
                            <input type="number" id="emi-rate" required min="0.1" max="100" step="any" placeholder="e.g., 8.5">
                            <span class="error-msg">Please enter an interest rate between 0.1% and 100%.</span>
                        </div>
                        <div class="input-group">
                            <label for="emi-tenure">Tenure Duration</label>
                            <input type="number" id="emi-tenure" required min="1" max="600" placeholder="e.g., 20">
                            <span class="error-msg">Please enter a duration value between 1 and 600.</span>
                        </div>
                        <div class="radio-toggle-group">
                            <label class="radio-container">
                                <input type="radio" id="emi-type-years" name="emi-type" value="years" checked>
                                <span class="radio-label">Years</span>
                            </label>
                            <label class="radio-container">
                                <input type="radio" id="emi-type-months" name="emi-type" value="months">
                                <span class="radio-label">Months</span>
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Calculate EMI</button>
                        </div>
                    </form>
                </div>
            `,
            calculate: () => {
                const amount = parseFloat(document.getElementById("emi-amount").value) || 0;
                const annualRate = parseFloat(document.getElementById("emi-rate").value) || 0;
                const tenureVal = parseFloat(document.getElementById("emi-tenure").value) || 0;
                const isYears = document.getElementById("emi-type-years").checked;

                const totalMonths = isYears ? tenureVal * 12 : tenureVal;
                const monthlyRate = (annualRate / 12) / 100;

                let emi = 0;
                if (monthlyRate === 0) {
                    emi = totalMonths > 0 ? amount / totalMonths : 0;
                } else if (totalMonths > 0) {
                    emi = amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
                }

                const totalRepayment = emi * totalMonths;
                const totalInterest = totalRepayment - amount;

                let html = `
                    <div class="metrics-grid">
                        <div class="metric-item"><div class="metric-label">Monthly EMI</div><div class="metric-val">${currencyFormatter.format(emi)}</div></div>
                        <div class="metric-item"><div class="metric-label">Principal Amount</div><div class="metric-val">${currencyFormatter.format(amount)}</div></div>
                        <div class="metric-item"><div class="metric-label">Total Interest Paid</div><div class="metric-val">${currencyFormatter.format(totalInterest)}</div></div>
                        <div class="metric-item"><div class="metric-label">Total Payment</div><div class="metric-val">${currencyFormatter.format(totalRepayment)}</div></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>Year</th><th>Principal Component</th><th>Interest Component</th><th>Ending Balance</th></tr></thead>
                            <tbody>
                `;

                let balance = amount;
                const loops = Math.ceil(totalMonths / 12);
                for (let i = 1; i <= loops; i++) {
                    let yearlyInterest = 0;
                    let yearlyPrincipal = 0;
                    for (let m = 0; m < 12; m++) {
                        if (balance <= 0) break;
                        const interestComponent = balance * monthlyRate;
                        let principalComponent = emi - interestComponent;
                        if (principalComponent > balance) principalComponent = balance;
                        yearlyInterest += interestComponent;
                        yearlyPrincipal += principalComponent;
                        balance -= principalComponent;
                    }
                    html += `<tr><td>Year ${i}</td><td>${currencyFormatter.format(yearlyPrincipal)}</td><td>${currencyFormatter.format(yearlyInterest)}</td><td>${currencyFormatter.format(Math.max(0, balance))}</td></tr>`;
                    if (balance <= 0) break;
                }
                html += `</tbody></table></div>`;
                return html;
            }
        },
        sip: {
            title: "SIP Future Value Calculator",
            renderInputs: () => `
                <div class="calc-panel">
                    <h2>SIP Mutual Fund Calculator</h2>
                    <form id="form-sip" novalidate>
                        <div class="input-group">
                            <label for="sip-investment">Monthly Investment Contribution</label>
                            <input type="number" id="sip-investment" required min="1" placeholder="e.g., 5000">
                            <span class="error-msg">Please enter a valid periodic allocation amount.</span>
                        </div>
                        <div class="input-group">
                            <label for="sip-rate">Expected Return Rate Per Annum (%)</label>
                            <input type="number" id="sip-rate" required min="0.1" max="50" step="any" placeholder="e.g., 12">
                            <span class="error-msg">Please enter an expected rate between 0.1% and 50%.</span>
                        </div>
                        <div class="input-group">
                            <label for="sip-years">Investment Period (Years)</label>
                            <input type="number" id="sip-years" required min="1" max="50" placeholder="e.g., 15">
                            <span class="error-msg">Please enter a duration tenure between 1 and 50 years.</span>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Project Wealth</button>
                        </div>
                    </form>
                </div>
            `,
            calculate: () => {
                const monthlyContribution = parseFloat(document.getElementById("sip-investment").value) || 0;
                const annualRate = parseFloat(document.getElementById("sip-rate").value) || 0;
                const years = parseFloat(document.getElementById("sip-years").value) || 0;

                const totalMonths = years * 12;
                const monthlyRate = (annualRate / 12) / 100;
                
                let futureValue = 0;
                if (monthlyRate === 0) {
                    futureValue = monthlyContribution * totalMonths;
                } else if (totalMonths > 0) {
                    futureValue = monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
                }

                const totalInvested = monthlyContribution * totalMonths;
                const wealthGain = futureValue - totalInvested;

                let html = `
                    <div class="metrics-grid">
                        <div class="metric-item"><div class="metric-label">Estimated Future Value</div><div class="metric-val">${currencyFormatter.format(futureValue)}</div></div>
                        <div class="metric-item"><div class="metric-label">Total Cash Deposited</div><div class="metric-val">${currencyFormatter.format(totalInvested)}</div></div>
                        <div class="metric-item"><div class="metric-label">Compounded Return</div><div class="metric-val">${currencyFormatter.format(wealthGain)}</div></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>End of Year</th><th>Total Invested Capital</th><th>Compounded Projected Value</th></tr></thead>
                            <tbody>
                `;

                for (let i = 1; i <= years; i++) {
                    const monthsActive = i * 12;
                    let currentYearFV = monthlyRate === 0 ? monthlyContribution * monthsActive : monthlyContribution * ((Math.pow(1 + monthlyRate, monthsActive) - 1) / monthlyRate) * (1 + monthlyRate);
                    html += `<tr><td>Year ${i}</td><td>${currencyFormatter.format(monthlyContribution * monthsActive)}</td><td>${currencyFormatter.format(currentYearFV)}</td></tr>`;
                }
                html += `</tbody></table></div>`;
                return html;
            }
        },
        fd: {
            title: "Fixed Deposit Maturity Modeler",
            renderInputs: () => `
                <div class="calc-panel">
                    <h2>Fixed Deposit (FD) Calculator</h2>
                    <form id="form-fd" novalidate>
                        <div class="input-group">
                            <label for="fd-principal">Initial Principal Deposit</label>
                            <input type="number" id="fd-principal" required min="1" placeholder="e.g., 100000">
                            <span class="error-msg">Please enter a valid starting balance.</span>
                        </div>
                        <div class="input-group">
                            <label for="fd-rate">Rate of Interest (%)</label>
                            <input type="number" id="fd-rate" required min="0.1" max="30" step="any" placeholder="e.g., 7.1">
                            <span class="error-msg">Please set an interest layout between 0.1% and 30%.</span>
                        </div>
                        <div class="input-group">
                            <label for="fd-years">Duration Tenure (Years)</label>
                            <input type="number" id="fd-years" required min="1" max="30" placeholder="e.g., 5">
                            <span class="error-msg">Please target a timeline tenure between 1 and 30 years.</span>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Calculate Maturity</button>
                        </div>
                    </form>
                </div>
            `,
            calculate: () => {
                const principal = parseFloat(document.getElementById("fd-principal").value) || 0;
                const rate = parseFloat(document.getElementById("fd-rate").value) || 0;
                const years = parseFloat(document.getElementById("fd-years").value) || 0;

                const compoundingFrequency = 4; 
                const maturityValue = principal * Math.pow(1 + (rate / (compoundingFrequency * 100)), compoundingFrequency * years);
                const interestEarned = maturityValue - principal;

                let html = `
                    <div class="metrics-grid">
                        <div class="metric-item"><div class="metric-label">Maturity Value Amount</div><div class="metric-val">${currencyFormatter.format(maturityValue)}</div></div>
                        <div class="metric-item"><div class="metric-label">Initial Balance Invested</div><div class="metric-val">${currencyFormatter.format(principal)}</div></div>
                        <div class="metric-item"><div class="metric-label">Total Yield Interest</div><div class="metric-val">${currencyFormatter.format(interestEarned)}</div></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>Year Frame</th><th>Interest Accumulated</th><th>Ending Account Value</th></tr></thead>
                            <tbody>
                `;

                for (let i = 1; i <= years; i++) {
                    const currentYearFV = principal * Math.pow(1 + (rate / (compoundingFrequency * 100)), compoundingFrequency * i);
                    const currentYearInterest = currentYearFV - principal;
                    html += `<tr><td>Year ${i}</td><td>${currencyFormatter.format(currentYearInterest)}</td><td>${currencyFormatter.format(currentYearFV)}</td></tr>`;
                }
                html += `</tbody></table></div>`;
                return html;
            }
        },
        inflation: {
            title: "Inflation Impact Adjustment",
            renderInputs: () => `
                <div class="calc-panel">
                    <h2>Inflation Impact Calculator</h2>
                    <form id="form-inflation" novalidate>
                        <div class="input-group">
                            <label for="inf-amount">Current Asset Valuation / Capital</label>
                            <input type="number" id="inf-amount" required min="1" placeholder="e.g., 1000000">
                            <span class="error-msg">Please set a functional baseline asset valuation figure.</span>
                        </div>
                        <div class="input-group">
                            <label for="inf-rate">Estimated Dynamic Inflation Rate (%)</label>
                            <input type="number" id="inf-rate" required min="0.1" max="25" step="any" placeholder="e.g., 6">
                            <span class="error-msg">Enter an annualized rate scaling factor percentage between 0.1% and 25%.</span>
                        </div>
                        <div class="input-group">
                            <label for="inf-years">Timeline (Years Horizon)</label>
                            <input type="number" id="inf-years" required min="1" max="50" placeholder="e.g., 10">
                            <span class="error-msg">Set an evaluation horizon period between 1 and 50 years.</span>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Process Value Drop</button>
                        </div>
                    </form>
                </div>
            `,
            calculate: () => {
                const amount = parseFloat(document.getElementById("inf-amount").value) || 0;
                const rate = parseFloat(document.getElementById("inf-rate").value) || 0;
                const years = parseFloat(document.getElementById("inf-years").value) || 0;

                const futurePurchasingPower = amount / Math.pow(1 + (rate / 100), years);
                const lostPurchasingPower = amount - futurePurchasingPower;

                let html = `
                    <div class="metrics-grid">
                        <div class="metric-item"><div class="metric-label">Future Purchasing Capacity</div><div class="metric-val">${currencyFormatter.format(futurePurchasingPower)}</div></div>
                        <div class="metric-item"><div class="metric-label">Real Cash Wealth Decay</div><div class="metric-val">${currencyFormatter.format(lostPurchasingPower)}</div></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>Elapsed Year Horizon</th><th>Real Value Purchase Equivalent</th></tr></thead>
                            <tbody>
                `;

                for (let i = 1; i <= years; i++) {
                    const currentYearFV = amount / Math.pow(1 + (rate / 100), i);
                    html += `<tr><td>Year ${i}</td><td>${currencyFormatter.format(currentYearFV)}</td></tr>`;
                }
                html += `</tbody></table></div>`;
                return html;
            }
        },
        gst: {
            title: "GST/Tax Matrix Terminal Engine",
            renderInputs: () => `
                <div class="calc-panel">
                    <h2>GST/Tax Matrix Terminal</h2>
                    <form id="form-gst" novalidate>
                        <div class="input-group">
                            <label for="gst-amount">Transaction Base Cost Value</label>
                            <input type="number" id="gst-amount" required min="1" placeholder="e.g., 25000">
                            <span class="error-msg">Please specify operational transactional metric cost structures.</span>
                        </div>
                        <div class="input-group">
                            <label for="gst-rate">Tax Slab Rate (%)</label>
                            <select id="gst-rate" name="gst-rate" class="custom-select">
                                <option value="5">5% Standard Base Slab</option>
                                <option value="12">12% Secondary Core Product Slab</option>
                                <option value="18" selected>18% Primary Standard IT Services Slab</option>
                                <option value="28">28% Premium Luxury Dynamic Ceiling Slab</option>
                            </select>
                        </div>
                        <div class="radio-toggle-group">
                            <label class="radio-container">
                                <input type="radio" id="gst-mode-exclusive" name="gst-mode" value="exclusive" checked>
                                <span class="radio-label">GST Exclusive (Add Tax)</span>
                            </label>
                            <label class="radio-container">
                                <input type="radio" id="gst-mode-inclusive" name="gst-mode" value="inclusive">
                                <span class="radio-label">GST Inclusive (Extract Tax)</span>
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Process Invoice Ledger</button>
                        </div>
                    </form>
                </div>
            `,
            calculate: () => {
                const amount = parseFloat(document.getElementById("gst-amount").value) || 0;
                const slabRate = parseFloat(document.getElementById("gst-rate").value) || 0;
                const modeExclusive = document.getElementById("gst-mode-exclusive").checked;

                let taxValue = 0;
                let finalNetGrossAmount = 0;
                let baseCostResultVal = 0;

                if (modeExclusive) {
                    taxValue = amount * (slabRate / 100);
                    finalNetGrossAmount = amount + taxValue;
                    baseCostResultVal = amount;
                } else {
                    baseCostResultVal = amount / (1 + (slabRate / 100));
                    taxValue = amount - baseCostResultVal;
                    finalNetGrossAmount = amount;
                }

                const splitTaxVal = taxValue / 2;

                return `
                    <div class="metrics-grid">
                        <div class="metric-item"><div class="metric-label">Total Invoice Cost Value</div><div class="metric-val">${currencyFormatter.format(finalNetGrossAmount)}</div></div>
                        <div class="metric-item"><div class="metric-label">Raw Net Product Cost</div><div class="metric-val">${currencyFormatter.format(baseCostResultVal)}</div></div>
                        <div class="metric-item"><div class="metric-label">Total Tax Commitment Value</div><div class="metric-val">${currencyFormatter.format(taxValue)}</div></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr><th>Tax Structure Metric Entity</th><th>Ledger Allocation Value</th></tr></thead>
                            <tbody>
                                <tr><td>Central CGST Level Share (50%)</td><td>${currencyFormatter.format(splitTaxVal)}</td></tr>
                                <tr><td>State SGST Level Share (50%)</td><td>${currencyFormatter.format(splitTaxVal)}</td></tr>
                                <tr><td>Gross Aggregate Invoiced Ledger Value</td><td>${currencyFormatter.format(finalNetGrossAmount)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    };

    function renderPlaceholderOutput() {
        outputContainer.innerHTML = `
            <div class="output-placeholder">
                <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                <h3>Computation Matrix Ready</h3>
                <p>Modify local parameters variables and click calculate to execute.</p>
            </div>
        `;
    }

    function routeToWorkspace(id) {
        if (!registry[id]) return;
        activeToolId = id;
        
        inputContainer.innerHTML = registry[id].renderInputs();
        renderPlaceholderOutput();
        
        breadcrumbActive.textContent = registry[id].title;
        dashboardView.classList.add("hidden");
        workspaceView.classList.remove("hidden");
        
        window.scrollTo({ top: 0, behavior: "smooth" });
        updateRecentListTrack(id);
        bindFormActionListeners(id);
    }

    function routeToDashboard() {
        activeToolId = null;
        workspaceView.classList.add("hidden");
        dashboardView.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function bindFormActionListeners(id) {
        const form = inputContainer.querySelector("form");
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            
            let formsAreValid = true;
            const targetRequiredInputsFields = form.querySelectorAll("input[required]");
            
            targetRequiredInputsFields.forEach(elementInput => {
                const parentGroup = elementInput.closest(".input-group");
                if (!elementInput.checkValidity()) {
                    formsAreValid = false;
                    if (parentGroup) parentGroup.classList.add("invalid");
                } else {
                    if (parentGroup) parentGroup.classList.remove("invalid");
                }
            });

            if (!formsAreValid) return;

            outputContainer.innerHTML = registry[id].calculate();
        });

        form.querySelectorAll("input").forEach(field => {
            field.addEventListener("input", () => {
                const group = field.closest(".input-group");
                if (group && field.checkValidity()) group.classList.remove("invalid");
            });
        });
    }

    function updateRecentListTrack(id) {
        let activeRecents = JSON.parse(localStorage.getItem("money_mate_recents") || "[]");
        activeRecents = activeRecents.filter(item => item !== id);
        activeRecents.unshift(id);
        activeRecents = activeRecents.slice(0, 4);
        localStorage.setItem("money_mate_recents", JSON.stringify(activeRecents));
        renderRecentTrackingChips();
    }

    function renderRecentTrackingChips() {
        const activeRecents = JSON.parse(localStorage.getItem("money_mate_recents") || "[]");
        if (activeRecents.length === 0) {
            recentContainer.classList.add("hidden");
            return;
        }

        recentContainer.classList.remove("hidden");
        recentChipsWrapper.innerHTML = "";
        
        activeRecents.forEach(id => {
            if (!registry[id]) return;
            const chip = document.createElement("div");
            chip.className = "recent-chip";
            chip.textContent = registry[id].title.split(" ")[0] + " Tool";
            chip.addEventListener("click", () => routeToWorkspace(id));
            recentChipsWrapper.appendChild(chip);
        });
    }

    function runGlobalGridFilterSearch() {
        const textCriteria = searchInput.value.toLowerCase().trim();
        const targetedTabActiveCategory = document.querySelector(".cat-tab.active").getAttribute("data-category");
        const appCardModulesElements = calculatorsGrid.querySelectorAll(".calc-card");

        appCardModulesElements.forEach(card => {
            const heading = card.querySelector("h3").textContent.toLowerCase();
            const detailsText = card.querySelector("p").textContent.toLowerCase();
            const entityCategory = card.getAttribute("data-category");

            const matchesText = heading.includes(textCriteria) || detailsText.includes(textCriteria);
            const matchesCategory = (targetedTabActiveCategory === "all") || (entityCategory === targetedTabActiveCategory);

            if (matchesText && matchesCategory) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    }

    if (searchInput) searchInput.addEventListener("input", runGlobalGridFilterSearch);

    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            categoryTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            runGlobalGridFilterSearch();
        });
    });

    calculatorsGrid.addEventListener("click", (e) => {
        const launchBtn = e.target.closest(".launch-calc-btn");
        if (!launchBtn) return;
        const parentCard = launchBtn.closest(".calc-card");
        if (parentCard) {
            const toolIdentifier = parentCard.getAttribute("data-id");
            routeToWorkspace(toolIdentifier);
        }
    });

    if (breadcrumbHome) breadcrumbHome.addEventListener("click", (e) => { e.preventDefault(); routeToDashboard(); });
    if (brandLogo) brandLogo.addEventListener("click", (e) => { e.preventDefault(); routeToDashboard(); });

    const themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const targetThemeState = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", targetThemeState);
            localStorage.setItem("money_mate_theme", targetThemeState);
        });
    }

    const cachedTheme = localStorage.getItem("money_mate_theme") || "dark";
    document.documentElement.setAttribute("data-theme", cachedTheme);
    renderRecentTrackingChips();
});
