/* ==========================================================================
   1. CENTRAL PORTFOLIO ARCHITECTURE CONFIGURATION
   ========================================================================== */
const AppConfig = {
    brandName: "Money Mate",
    developer: "Aveena Labs",
    version: "1.0.0",
    storageKeys: {
        theme: "mm_theme_state",
        recents: "mm_recent_calculators"
    },
    calculators: {
        emi: { title: "EMI Calculator", cat: "loans" },
        loan: { title: "Loan Balance Analyzer", cat: "loans" },
        sip: { title: "SIP Wealth Estimator", cat: "investments" },
        fd: { title: "Fixed Deposit (FD) Tool", cat: "investments" },
        gst: { title: "GST Tax Calculator", cat: "tax" }
    }
};

/* ==========================================================================
   2. DOM ELEMENT REGISTRY & STATE INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const body = document.documentElement;
    const themeToggle = document.getElementById("theme-toggle");
    const brandLogo = document.getElementById("brand-logo");
    const homeView = document.getElementById("home-view");
    const workspaceView = document.getElementById("workspace-view");
    const breadcrumbHome = document.getElementById("breadcrumb-home");
    const breadcrumbCurrent = document.getElementById("breadcrumb-current");
    
    const calcSearch = document.getElementById("calc-search");
    const categoryTabs = document.querySelectorAll(".cat-tab");
    const toolsGrid = document.getElementById("tools-grid");
    const recentContainer = document.getElementById("recent-container");
    const recentChips = document.getElementById("recent-chips");
    
    const blankState = document.getElementById("output-blank-state");
    const displayState = document.getElementById("output-display-state");
    const metricsTarget = document.getElementById("metrics-target");
    const tableScrollArea = document.getElementById("table-scroll-area");
    const scheduleTable = document.getElementById("schedule-table");
    const btnCopyMetrics = document.getElementById("btn-copy-metrics");
    const btnShareMetrics = document.getElementById("btn-share-metrics");
    const relatedLinksContainer = document.getElementById("related-links-container");

    let coreCurrentTool = null;

    /* ==========================================================================
       3. PREMIUM THEME MANAGER (DARK / LIGHT EXECUTION)
       ========================================================================== */
    const savedTheme = localStorage.getItem(AppConfig.storageKeys.theme) || "light";
    body.setAttribute("data-theme", savedTheme);

    themeToggle.addEventListener("click", () => {
        const activeTheme = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
        body.setAttribute("data-theme", activeTheme);
        localStorage.setItem(AppConfig.storageKeys.theme, activeTheme);
    });

    /* ==========================================================================
       4. CLIENT STATE ENGINE (RECENT MATRIX TRACKING)
       ========================================================================== */
    function trackRecentEngagement(calcKey) {
        let recents = JSON.parse(localStorage.getItem(AppConfig.storageKeys.recents)) || [];
        recents = recents.filter(item => item !== calcKey);
        recents.unshift(calcKey);
        if (recents.length > 4) recents.pop();
        localStorage.setItem(AppConfig.storageKeys.recents, JSON.stringify(recents));
        renderRecentChips();
    }

    function renderRecentChips() {
        const recents = JSON.parse(localStorage.getItem(AppConfig.storageKeys.recents)) || [];
        if (recents.length === 0) {
            recentContainer.classList.add("hidden");
            return;
        }
        recentContainer.classList.remove("hidden");
        recentChips.innerHTML = "";
        recents.forEach(key => {
            if (AppConfig.calculators[key]) {
                const chip = document.createElement("button");
                chip.className = "recent-chip";
                chip.innerText = AppConfig.calculators[key].title;
                chip.addEventListener("click", () => routingSwitch(key));
                recentChips.appendChild(chip);
            }
        });
    }

    /* ==========================================================================
       5. INDEX SEARCH ENGINE & INTERACTIVE FILTER LAYER
       ========================================================================== */
    function processDashboardDiscovery() {
        const searchQuery = calcSearch.value.toLowerCase().trim();
        const targetedCategory = document.querySelector(".cat-tab.active").getAttribute("data-category");
        const cards = toolsGrid.querySelectorAll(".calc-card");

        cards.forEach(card => {
            const calcKey = card.getAttribute("data-calc");
            const cardCategory = card.getAttribute("data-cat");
            const searchableTitle = AppConfig.calculators[calcKey].title.toLowerCase();
            const searchableDesc = card.querySelector("p").innerText.toLowerCase();

            const matchSearch = searchableTitle.includes(searchQuery) || searchableDesc.includes(searchQuery);
            const matchCategory = (targetedCategory === "all") || (cardCategory === targetedCategory);

            if (matchSearch && matchCategory) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    }

    calcSearch.addEventListener("input", processDashboardDiscovery);
    
    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            categoryTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            processDashboardDiscovery();
        });
    });

    /* ==========================================================================
       6. SYSTEM WORKSPACE ROUTING MANAGEMENT
       ========================================================================== */
    function routingSwitch(calcKey = null) {
        if (!calcKey) {
            coreCurrentTool = null;
            workspaceView.classList.add("hidden");
            homeView.classList.remove("hidden");
            window.scrollTo(0, 0);
            return;
        }

        coreCurrentTool = calcKey;
        homeView.classList.add("hidden");
        workspaceView.classList.remove("hidden");
        
        document.querySelectorAll(".calc-panel").forEach(p => p.classList.add("hidden"));
        document.getElementById(`panel-${calcKey}`).classList.remove("hidden");
        
        breadcrumbCurrent.innerText = AppConfig.calculators[calcKey].title;
        clearReportingState();
        renderCrossLinking(calcKey);
        trackRecentEngagement(calcKey);
        window.scrollTo(0, 0);
    }

    document.querySelectorAll(".open-calc-btn").forEach(btn => {
        btn.addEventListener("click", () => routingSwitch(btn.getAttribute("data-target")));
    });

    breadcrumbHome.addEventListener("click", (e) => { e.preventDefault(); routingSwitch(); });
    brandLogo.addEventListener("click", (e) => { e.preventDefault(); routingSwitch(); });

    function renderCrossLinking(activeKey) {
        relatedLinksContainer.innerHTML = "";
        Object.keys(AppConfig.calculators).forEach(key => {
            if (key !== activeKey) {
                const link = document.createElement("button");
                link.className = "recent-chip";
                link.innerText = AppConfig.calculators[key].title;
                link.addEventListener("click", () => routingSwitch(key));
                relatedLinksContainer.appendChild(link);
            }
        });
    }

    function clearReportingState() {
        blankState.classList.remove("hidden");
        displayState.classList.add("hidden");
        tableScrollArea.classList.add("hidden");
        metricsTarget.innerHTML = "";
        scheduleTable.querySelector("thead").innerHTML = "";
        scheduleTable.querySelector("tbody").innerHTML = "";
    }
    /* ==========================================================================
       7. UI PRESENTATION ENGINE & FORM INITIALIZER
       ========================================================================== */
    function displayComputedOutputs(metrics, scheduleData = null, columnHeaders = []) {
        blankState.classList.add("hidden");
        displayState.classList.remove("hidden");
        metricsTarget.innerHTML = "";

        metrics.forEach(m => {
            const wrap = document.createElement("div");
            wrap.className = "metric-item";
            wrap.innerHTML = `<div class="metric-label">${m.label}</div><div class="metric-val">${m.value}</div>`;
            metricsTarget.appendChild(wrap);
        });

        if (scheduleData && scheduleData.length > 0 && columnHeaders.length > 0) {
            tableScrollArea.classList.remove("hidden");
            
            let theadMarkup = "<tr>";
            columnHeaders.forEach(h => theadMarkup += `<th>${h}</th>`);
            theadMarkup += "</tr>";
            scheduleTable.querySelector("thead").innerHTML = theadMarkup;

            let tbodyMarkup = "";
            scheduleData.forEach(row => {
                tbodyMarkup += "<tr>";
                row.forEach(cell => tbodyMarkup += `<td>${cell}</td>`);
                tbodyMarkup += "</tr>";
            });
            scheduleTable.querySelector("tbody").innerHTML = tbodyMarkup;
        } else {
            tableScrollArea.classList.add("hidden");
        }
    }

    function checkDOMFormValidity(form) {
        let isPass = true;
        form.querySelectorAll("input[required]").forEach(input => {
            const container = input.closest(".input-group");
            const parseVal = parseFloat(input.value);
            const minBoundary = parseFloat(input.getAttribute("min"));
            const maxBoundary = parseFloat(input.getAttribute("max"));

            let currentValid = true;
            if (isNaN(parseVal) || parseVal < minBoundary || parseVal > maxBoundary) {
                currentValid = false;
                isPass = false;
            }

            if (!currentValid) {
                container.classList.add("invalid");
            } else {
                container.classList.remove("invalid");
            }
        });
        return isPass;
    }

    document.querySelectorAll(".reset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetedForm = e.target.closest("form");
            targetedForm.reset();
            targetedForm.querySelectorAll(".input-group").forEach(g => g.classList.remove("invalid"));
            clearReportingState();
        });
    });

    /* ==========================================================================
       8. MATH COMPUTATION UTILITIES
       ========================================================================== */
    const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2 });

    // 1. EMI CALCULATOR ENGINE
    document.getElementById("form-emi").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkDOMFormValidity(e.target)) return;

        const p = parseFloat(document.getElementById("emi-principal").value);
        const rAnnu = parseFloat(document.getElementById("emi-rate").value);
        const tYrs = parseFloat(document.getElementById("emi-tenure").value);

        const rMth = (rAnnu / 12) / 100;
        const totalMths = tYrs * 12;

        const emi = (p * rMth * Math.pow(1 + rMth, totalMths)) / (Math.pow(1 + rMth, totalMths) - 1);
        const totalPayout = emi * totalMths;
        const aggregateInterest = totalPayout - p;

        const summaryMetrics = [
            { label: "Monthly EMI Payment", value: currencyFormatter.format(emi) },
            { label: "Principal Invested", value: currencyFormatter.format(p) },
            { label: "Total Interest Due", value: currencyFormatter.format(aggregateInterest) },
            { label: "Total Asset Cost", value: currencyFormatter.format(totalPayout) }
        ];

        let balance = p;
        const scheduleMatrix = [];
        for (let m = 1; m <= totalMths; m++) {
            const interestPayment = balance * rMth;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;
            if (balance < 0) balance = 0;

            if (m % 12 === 0 || m === totalMths) {
                scheduleMatrix.push([
                    `Year ${Math.ceil(m / 12)}`,
                    currencyFormatter.format(emi * (m % 12 === 0 ? 12 : (m % 12))),
                    currencyFormatter.format(principalPayment),
                    currencyFormatter.format(interestPayment),
                    currencyFormatter.format(balance)
                ]);
            }
        }
        displayComputedOutputs(summaryMetrics, scheduleMatrix, ["Timeline Horizon", "Yearly Total", "Principal Share", "Interest Share", "Outstanding Principal"]);
    });

    // 2. LOAN CALCULATOR ENGINE
    document.getElementById("form-loan").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkDOMFormValidity(e.target)) return;

        const p = parseFloat(document.getElementById("loan-principal").value);
        const rAnnu = parseFloat(document.getElementById("loan-rate").value);
        const mthsTotal = parseFloat(document.getElementById("loan-duration").value);
        const rMth = (rAnnu / 12) / 100;

        const monthlyInstallment = (p * rMth * Math.pow(1 + rMth, mthsTotal)) / (Math.pow(1 + rMth, mthsTotal) - 1);
        const totalGrossCost = monthlyInstallment * mthsTotal;
        const combinedInterest = totalGrossCost - p;

        const metricsArray = [
            { label: "Estimated Installment / Mo.", value: currencyFormatter.format(monthlyInstallment) },
            { label: "Total Principal Core", value: currencyFormatter.format(p) },
            { label: "Aggregate Interest Weight", value: currencyFormatter.format(combinedInterest) },
            { label: "Total Financial Commitment", value: currencyFormatter.format(totalGrossCost) }
        ];

        let balance = p;
        const linearTable = [];
        const intervalStep = Math.max(1, Math.floor(mthsTotal / 10));

        for (let i = 1; i <= mthsTotal; i++) {
            const internalInterest = balance * rMth;
            const internalPrincipal = monthlyInstallment - internalInterest;
            balance -= internalPrincipal;
            if (balance < 0) balance = 0;

            if (i === 1 || i % intervalStep === 0 || i === mthsTotal) {
                linearTable.push([
                    `Month ${i}`,
                    currencyFormatter.format(monthlyInstallment),
                    currencyFormatter.format(internalPrincipal),
                    currencyFormatter.format(internalInterest),
                    currencyFormatter.format(balance)
                ]);
            }
        }
        displayComputedOutputs(metricsArray, linearTable, ["Interval Point", "Payment Rate", "Principal Comp.", "Interest Comp.", "Remaining Portfolio Balance"]);
    });

    // 3. SIP CALCULATOR ENGINE
    document.getElementById("form-sip").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkDOMFormValidity(e.target)) return;

        const mthInvest = parseFloat(document.getElementById("sip-monthly").value);
        const annualRate = parseFloat(document.getElementById("sip-rate").value);
        const lifecycleYrs = parseFloat(document.getElementById("sip-years").value);

        const totalIntervals = lifecycleYrs * 12;
        const monthlyYieldRate = (annualRate / 12) / 100;
        const baseInvested = mthInvest * totalIntervals;
        
        const compoundTerminalVal = mthInvest * ((Math.pow(1 + monthlyYieldRate, totalIntervals) - 1) / monthlyYieldRate) * (1 + monthlyYieldRate);
        const wealthAppreciation = compoundTerminalVal - baseInvested;

        const arrayMetrics = [
            { label: "Aggregate Cash Investment", value: currencyFormatter.format(baseInvested) },
            { label: "Compounded Interest Accrued", value: currencyFormatter.format(wealthAppreciation) },
            { label: "Total Wealth Outlook", value: currencyFormatter.format(compoundTerminalVal) }
        ];

        const pathTable = [];
        let rollingInvestedSum = 0;
        for (let y = 1; y <= lifecycleYrs; y++) {
            rollingInvestedSum += (mthInvest * 12);
            const currentIntervalCount = y * 12;
            const pointValue = mthInvest * ((Math.pow(1 + monthlyYieldRate, currentIntervalCount) - 1) / monthlyYieldRate) * (1 + monthlyYieldRate);
            const pointInterest = pointValue - rollingInvestedSum;

            pathTable.push([
                `End of Year ${y}`,
                currencyFormatter.format(rollingInvestedSum),
                currencyFormatter.format(pointInterest),
                currencyFormatter.format(pointValue)
            ]);
        }
        displayComputedOutputs(arrayMetrics, pathTable, ["Timeline Milestone", "Cumulative Capital", "Dynamic Compound Wealth", "Aggregate Valuation"]);
    });

    // 4. FIXED DEPOSIT CALCULATOR ENGINE
    document.getElementById("form-fd").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkDOMFormValidity(e.target)) return;

        const principal = parseFloat(document.getElementById("fd-principal").value);
        const ratePerAnnum = parseFloat(document.getElementById("fd-rate").value);
        const operationalYears = parseFloat(document.getElementById("fd-years").value);

        const compoundFrequencePerAnnu = 4; 
        const futureMaturityTarget = principal * Math.pow(1 + (ratePerAnnum / 100 / compoundFrequencePerAnnu), compoundFrequencePerAnnu * operationalYears);
        const netInterestHarvested = futureMaturityTarget - principal;

        const fdMetrics = [
            { label: "Principal Asset Allocation", value: currencyFormatter.format(principal) },
            { label: "Accrued Fixed Interest Yield", value: currencyFormatter.format(netInterestHarvested) },
            { label: "Terminal Maturity Allocation", value: currencyFormatter.format(futureMaturityTarget) }
        ];

        const historyMatrix = [];
        for (let yearStep = 1; yearStep <= operationalYears; yearStep++) {
            const stepMaturity = principal * Math.pow(1 + (ratePerAnnum / 100 / compoundFrequencePerAnnu), compoundFrequencePerAnnu * yearStep);
            const stepInterest = stepMaturity - principal;
            historyMatrix.push([
                `Year Horizon ${yearStep}`,
                currencyFormatter.format(principal),
                currencyFormatter.format(stepInterest),
                currencyFormatter.format(stepMaturity)
            ]);
        }
        displayComputedOutputs(fdMetrics, historyMatrix, ["Horizon Step", "Base Principal", "Aggregate Yield To Date", "Maturity Valuation Projection"]);
    });

    // 5. GST TAX CALCULATOR ENGINE
    document.getElementById("form-gst").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkDOMFormValidity(e.target)) return;

        const financialAmount = parseFloat(document.getElementById("gst-amount").value);
        const designatedSlabRate = parseFloat(document.getElementById("gst-slab").value);
        const directionalTaxMode = document.querySelector('input[name="gst-mode"]:checked').value;

        let derivedNetVal = 0, calculatedTaxWeight = 0, completeGrossVal = 0;

        if (directionalTaxMode === "add") {
            derivedNetVal = financialAmount;
            calculatedTaxWeight = (financialAmount * designatedSlabRate) / 100;
            completeGrossVal = financialAmount + calculatedTaxWeight;
        } else {
            completeGrossVal = financialAmount;
            derivedNetVal = financialAmount / (1 + (designatedSlabRate / 100));
            calculatedTaxWeight = financialAmount - derivedNetVal;
        }

        const componentsOutput = [
            { label: "Net Operation Price (Pre-Tax)", value: currencyFormatter.format(derivedNetVal) },
            { label: "Calculated Central Tax Burden", value: currencyFormatter.format(calculatedTaxWeight) },
            { label: "Gross Total Price (Post-Tax)", value: currencyFormatter.format(completeGrossVal) }
        ];

        const tabularTaxBreakdown = [
            ["Tax Core Component Base", percentFormatter.format(designatedSlabRate / 100), currencyFormatter.format(calculatedTaxWeight)],
            ["Central Component Fraction (CGST 50%)", percentFormatter.format((designatedSlabRate / 2) / 100), currencyFormatter.format(calculatedTaxWeight / 2)],
            ["State Component Fraction (SGST 50%)", percentFormatter.format((designatedSlabRate / 2) / 100), currencyFormatter.format(calculatedTaxWeight / 2)]
        ];
        displayComputedOutputs(componentsOutput, tabularTaxBreakdown, ["Structural Tax Partition", "Allocated Fraction Rate", "Calculated Component Value"]);
    });

    /* ==========================================================================
       9. SYSTEM METRICS UTILITIES (COPY & SHARE ENGAGEMENT ENGINE)
       ========================================================================== */
    btnCopyMetrics.addEventListener("click", () => {
        const itemDumps = [];
        displayState.querySelectorAll(".metric-item").forEach(item => {
            const label = item.querySelector(".metric-label").innerText;
            const val = item.querySelector(".metric-val").innerText;
            itemDumps.push(`${label}: ${val}`);
        });
        
        const compiledStringText = `--- ${AppConfig.calculators[coreCurrentTool].title} Output Report (${AppConfig.brandName}) ---\n` + itemDumps.join("\n");
        
        navigator.clipboard.writeText(compiledStringText).then(() => {
            const preservedButtonLabel = btnCopyMetrics.innerText;
            btnCopyMetrics.innerText = "Copied!";
            setTimeout(() => btnCopyMetrics.innerText = preservedButtonLabel, 2000);
        }).catch(() => alert("Clipboard write failed."));
    });

    btnShareMetrics.addEventListener("click", () => {
        const structuralShareUrl = `${window.location.origin}${window.location.pathname}?tool=${coreCurrentTool}`;
        if (navigator.share) {
            navigator.share({
                title: `${AppConfig.calculators[coreCurrentTool].title} - ${AppConfig.brandName}`,
                text: `Execute calculations with ${AppConfig.brandName}.`,
                url: structuralShareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(structuralShareUrl).then(() => {
                const preservedShareLabel = btnShareMetrics.innerText;
                btnShareMetrics.innerText = "Link Saved!";
                setTimeout(() => btnShareMetrics.innerText = preservedShareLabel, 2000);
            });
        }
    });

    /* ==========================================================================
       10. DEPLOYMENT DEACTION DEEP LINK INITIALIZER
       ========================================================================== */
    const runtimeQueryUrlParameters = new URLSearchParams(window.location.search);
    const deepLinkTargetKey = runtimeQueryUrlParameters.get("tool");
    if (deepLinkTargetKey && AppConfig.calculators[deepLinkTargetKey]) {
        routingSwitch(deepLinkTargetKey);
    } else {
        renderRecentChips();
    }
});
