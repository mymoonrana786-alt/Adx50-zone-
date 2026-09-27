// =========================================================================
// UI Inspector & Tab Navigation for 30 Quant Integrators & ADX 50 Analysis
// =========================================================================

let activeInspectorTab = 'tab_30_matrix';
let activeInspectorFilter = 'ALL';
let currentInspectedSymbol = null;
let compareSymbolA = null;
let compareSymbolB = null;
let activeCompareFilter = 'ALL';

// =========================================================================
// Sparkline SVG Generator (15-Period Movement Micro-Chart)
// =========================================================================
function renderSparklineSvg(series, status, width = 120, height = 26) {
    if (!series || !Array.isArray(series) || series.length < 2) {
        return `<div class="h-6 flex items-center justify-center text-[9.5px] text-slate-500 font-mono italic">No 15p Data</div>`;
    }

    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = (max - min) === 0 ? 1 : (max - min);
    const pad = 2;
    const innerH = height - (pad * 2);
    const stepX = width / (series.length - 1);

    const points = series.map((val, idx) => {
        const x = idx * stepX;
        const y = height - pad - (((val - min) / range) * innerH);
        return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const lastP = points[points.length - 1];

    let strokeColor = '#38bdf8'; // sky
    let gradientStart = 'rgba(56, 189, 248, 0.4)';
    let gradientEnd = 'rgba(56, 189, 248, 0.0)';

    if (status === 'BULLISH') {
        strokeColor = '#10b981'; // emerald
        gradientStart = 'rgba(16, 185, 129, 0.4)';
        gradientEnd = 'rgba(16, 185, 129, 0.0)';
    } else if (status === 'BEARISH') {
        strokeColor = '#f43f5e'; // rose
        gradientStart = 'rgba(244, 63, 94, 0.4)';
        gradientEnd = 'rgba(244, 63, 94, 0.0)';
    } else if (status === 'REVERSAL') {
        strokeColor = '#f59e0b'; // amber
        gradientStart = 'rgba(245, 158, 11, 0.4)';
        gradientEnd = 'rgba(245, 158, 11, 0.0)';
    }

    const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
    const gradId = `sparkGrad_${Math.random().toString(36).substring(2, 9)}`;

    return `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-6 overflow-visible block" preserveAspectRatio="none">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${gradientStart}" />
                    <stop offset="100%" stop-color="${gradientEnd}" />
                </linearGradient>
            </defs>
            <path d="${fillD}" fill="url(#${gradId})" />
            <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${lastP.x}" cy="${lastP.y}" r="2.5" fill="${strokeColor}" />
            <circle cx="${lastP.x}" cy="${lastP.y}" r="4.5" fill="none" stroke="${strokeColor}" stroke-width="0.75" opacity="0.6" />
        </svg>
    `;
}

function switchInspectorTab(tabId) {
    activeInspectorTab = tabId;
    ['tab_30_matrix', 'tab_compare', 'tab_adx50', 'tab_plan', 'tab_depth'].forEach(id => {
        const btn = document.getElementById(`btn_${id}`);
        const pane = document.getElementById(`pane_${id}`);
        if (btn && pane) {
            if (id === tabId) {
                btn.className = "px-3 py-2 text-xs font-bold text-brand-400 border-b-2 border-brand-500 transition-colors flex items-center gap-1.5 whitespace-nowrap";
                pane.classList.remove('hidden');
            } else {
                btn.className = "px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap";
                pane.classList.add('hidden');
            }
        }
    });
    if (tabId === 'tab_compare') {
        renderComparisonView();
    }
    if (window.lucide) lucide.createIcons();
}

function open30Comparison(symbolA, symbolB) {
    compareSymbolA = symbolA || currentInspectedSymbol;
    if (symbolB) {
        compareSymbolB = symbolB;
    } else if (!compareSymbolB || compareSymbolB === compareSymbolA) {
        const alt = window.scannedData?.find(d => d.symbol !== compareSymbolA);
        compareSymbolB = alt ? alt.symbol : compareSymbolA;
    }
    open30MatrixInspector(compareSymbolA);
    switchInspectorTab('tab_compare');
}

function swapCompareCoins() {
    const temp = compareSymbolA;
    compareSymbolA = compareSymbolB;
    compareSymbolB = temp;
    currentInspectedSymbol = compareSymbolA;
    renderComparisonView();
}

function setCompareTarget(targetSymbol) {
    compareSymbolB = targetSymbol;
    renderComparisonView();
}

function quickSetCompare(preset) {
    if (!window.scannedData || window.scannedData.length === 0) return;
    
    let target = null;
    if (preset === 'TOP_BULL') {
        target = window.scannedData.find(d => d.symbol !== compareSymbolA && (d.signal.includes('PUMP') || (d.quant30 && d.quant30.bull30Count >= 18)));
    } else if (preset === 'TOP_BEAR') {
        target = window.scannedData.find(d => d.symbol !== compareSymbolA && (d.signal.includes('DUMP') || (d.quant30 && d.quant30.bear30Count >= 18)));
    } else if (preset === 'ADX50') {
        target = window.scannedData.find(d => d.symbol !== compareSymbolA && d.adx >= 50);
    } else if (preset === 'BTCUSDT') {
        target = window.scannedData.find(d => d.symbol === 'BTCUSDT' && d.symbol !== compareSymbolA);
    } else if (preset === 'ETHUSDT') {
        target = window.scannedData.find(d => d.symbol === 'ETHUSDT' && d.symbol !== compareSymbolA);
    }

    if (!target) {
        target = window.scannedData.find(d => d.symbol !== compareSymbolA);
    }

    if (target) {
        compareSymbolB = target.symbol;
        renderComparisonView();
    }
}

function setCompareFilter(filterType) {
    activeCompareFilter = filterType;
    document.querySelectorAll('.cmp-filter-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-500/20', 'text-indigo-300', 'border-indigo-500/40', 'font-bold');
        btn.classList.add('bg-slate-800', 'text-slate-400', 'border-slate-700');
    });
    const activeBtn = document.getElementById(`cmpFilter_${filterType}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-800', 'text-slate-400', 'border-slate-700');
        activeBtn.classList.add('bg-indigo-500/20', 'text-indigo-300', 'border-indigo-500/40', 'font-bold');
    }
    renderCompareRows();
}

function renderComparisonView() {
    if (!window.scannedData || window.scannedData.length === 0) return;

    if (!compareSymbolA) {
        compareSymbolA = currentInspectedSymbol || window.scannedData[0].symbol;
    }
    if (!compareSymbolB || compareSymbolB === compareSymbolA) {
        const alt = window.scannedData.find(d => d.symbol !== compareSymbolA);
        compareSymbolB = alt ? alt.symbol : compareSymbolA;
    }

    const coinA = window.scannedData.find(d => d.symbol === compareSymbolA);
    const coinB = window.scannedData.find(d => d.symbol === compareSymbolB);
    if (!coinA || !coinB) return;

    // Header Card A
    const symA = document.getElementById('cmpCoinA_symbol');
    const prA = document.getElementById('cmpCoinA_price');
    const chA = document.getElementById('cmpCoinA_change');
    const bdgA = document.getElementById('cmpCoinA_badge');
    const adxA = document.getElementById('cmpCoinA_adx');
    const scA = document.getElementById('cmpCoinA_score');

    if (symA) symA.innerText = coinA.symbol;
    if (prA) prA.innerText = formatPrice(coinA.price);
    if (chA) {
        chA.innerText = `${coinA.priceChangePercent > 0 ? '+' : ''}${coinA.priceChangePercent.toFixed(2)}%`;
        chA.className = `text-xs font-mono font-bold ${coinA.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (bdgA) {
        bdgA.innerText = coinA.signal;
        bdgA.className = `px-2 py-0.5 rounded text-[10px] font-black uppercase border ${coinA.badgeClass}`;
    }
    if (adxA) adxA.innerHTML = coinA.adx >= 50 ? `<strong class="text-rose-400">🔥 15m ADX: ${coinA.adx}</strong>` : `15m ADX: ${coinA.adx}`;
    if (scA) scA.innerText = `${coinA.quant30 ? coinA.quant30.dominant30Count : coinA.dominantCount}/30 (${coinA.quant30 ? coinA.quant30.score30 : coinA.score}%)`;

    // Dropdown B
    const selectB = document.getElementById('cmpCoinB_select');
    if (selectB) {
        selectB.innerHTML = window.scannedData.map(d => {
            const isSel = d.symbol === compareSymbolB;
            return `<option value="${d.symbol}" ${isSel ? 'selected' : ''}>${d.symbol} (${d.signal} | ${d.priceChangePercent > 0 ? '+' : ''}${d.priceChangePercent.toFixed(1)}%)</option>`;
        }).join('');
    }

    // Header Card B
    const bdgB = document.getElementById('cmpCoinB_badge');
    const adxB = document.getElementById('cmpCoinB_adx');
    const scB = document.getElementById('cmpCoinB_score');

    if (bdgB) {
        bdgB.innerText = coinB.signal;
        bdgB.className = `px-2 py-0.5 rounded text-[10px] font-black uppercase border ${coinB.badgeClass}`;
    }
    if (adxB) adxB.innerHTML = coinB.adx >= 50 ? `<strong class="text-rose-400">🔥 15m ADX: ${coinB.adx}</strong>` : `15m ADX: ${coinB.adx}`;
    if (scB) scB.innerText = `${coinB.quant30 ? coinB.quant30.dominant30Count : coinB.dominantCount}/30 (${coinB.quant30 ? coinB.quant30.score30 : coinB.score}%)`;

    // Calculate Agreement & Divergence Statistics across all 30 indicators
    let agreeCount = 0;
    let directConflictCount = 0;
    const allA = coinA.quant30?.all30 || [];
    const allB = coinB.quant30?.all30 || [];

    for (let id = 1; id <= 30; id++) {
        const indA = allA.find(i => i.id === id);
        const indB = allB.find(i => i.id === id);
        if (indA && indB) {
            if (indA.status === indB.status) {
                agreeCount++;
            } else if ((indA.status === 'BULLISH' && indB.status === 'BEARISH') || (indA.status === 'BEARISH' && indB.status === 'BULLISH')) {
                directConflictCount++;
            }
        }
    }

    const agreePct = Math.round((agreeCount / 30) * 100);
    const agreeScoreEl = document.getElementById('cmpAgreementScore');
    if (agreeScoreEl) {
        agreeScoreEl.innerText = `${agreeCount}/30 In Agreement (${agreePct}% Correlation)`;
        agreeScoreEl.className = `px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-black border ${agreePct >= 65 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : (agreePct <= 35 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40')}`;
    }

    // Urdu Relative Strength & Spread Strategy Verdict
    const relTextEl = document.getElementById('cmpRelativeStrengthText');
    const recEl = document.getElementById('cmpPairTradeRecommendation');

    const bullA = coinA.quant30 ? coinA.quant30.bull30Count : 15;
    const bullB = coinB.quant30 ? coinB.quant30.bull30Count : 15;

    let verdictUr = "";
    let spreadBadge = "";

    if (directConflictCount >= 8 || Math.abs(bullA - bullB) >= 7) {
        if (bullA > bullB) {
            verdictUr = `⚡ طاقتور ڈائیورجنس الفا: ${coinA.symbol} میں ادارہ جاتی بائنگ (${bullA}/30 بلش) ${coinB.symbol} (${bullB}/30 بلش) سے نمایاں طور پر زیادہ ہے۔ پیئر ٹریڈنگ کا بہترین موقع۔`;
            spreadBadge = `Spread: Long ${coinA.symbol} / Short ${coinB.symbol}`;
        } else {
            verdictUr = `⚡ طاقتور ڈائیورجنس الفا: ${coinB.symbol} میں ادارہ جاتی بائنگ (${bullB}/30 بلش) ${coinA.symbol} (${bullA}/30 بلش) سے زیادہ ہے۔ شارٹ/لونگ اسپیریڈ فعال۔`;
            spreadBadge = `Spread: Long ${coinB.symbol} / Short ${coinA.symbol}`;
        }
    } else if (agreePct >= 70) {
        if (bullA >= 18 && bullB >= 18) {
            verdictUr = `🟢 مارکیٹ وائیڈ بلش ہم آہنگی: دونوں کوائنز میں سمارٹ منی فلو اور ڈیلٹا یکساں سمت میں ہیں (${agreeCount}/30 انڈیکیٹرز متفق)۔ مجموعی مارکیٹ میں مضبوط تیزی۔`;
            spreadBadge = `Both Long: Synchronized Bull`;
        } else if (coinA.quant30?.bear30Count >= 18 && coinB.quant30?.bear30Count >= 18) {
            verdictUr = `🔴 مارکیٹ وائیڈ بیئرش ہم آہنگی: دونوں کوائنز میں سیلنگ کا پریشر اور VSA ڈسٹری بیوشن متفق ہے۔`;
            spreadBadge = `Both Short: Synchronized Bear`;
        } else {
            verdictUr = `ہم آہنگ فلو: دونوں کوائنز کے 30 انڈیکیٹرز میں ${agreePct}% مطابقت موجود ہے۔`;
            spreadBadge = `Correlated: ${agreePct}% In-Sync`;
        }
    } else {
        verdictUr = `مخلوط فلو: ${agreeCount}/30 انڈیکیٹرز ایک سمت میں ہیں جبکہ ${directConflictCount} انڈیکیٹرز میں واضح اختلاف ہے۔ سلیکٹو انٹری لیں۔`;
        spreadBadge = `Selective: ${agreeCount}/30 In-Sync`;
    }

    if (relTextEl) relTextEl.innerText = verdictUr;
    if (recEl) recEl.innerText = spreadBadge;

    renderCompareRows();
}

function renderCompareRows() {
    const container = document.getElementById('compareCardsContainer');
    if (!container || !window.scannedData) return;

    const coinA = window.scannedData.find(d => d.symbol === compareSymbolA);
    const coinB = window.scannedData.find(d => d.symbol === compareSymbolB);
    if (!coinA || !coinB || !coinA.quant30 || !coinB.quant30) return;

    const search = (document.getElementById('searchCompareInput')?.value || '').toLowerCase();
    const allA = coinA.quant30.all30 || [];
    const allB = coinB.quant30.all30 || [];

    const rows = QUANT_30_DEFINITIONS.filter(def => {
        const matchesSearch = def.nameEn.toLowerCase().includes(search) || 
                              def.nameUr.includes(search) || 
                              def.code.toLowerCase().includes(search) ||
                              def.id.toString() === search;

        const indA = allA.find(i => i.id === def.id);
        const indB = allB.find(i => i.id === def.id);
        if (!indA || !indB) return matchesSearch;

        const isDivergent = indA.status !== indB.status;
        const isConvergent = indA.status === indB.status;

        let matchesFilter = true;
        if (activeCompareFilter === 'DIVERGENT') matchesFilter = isDivergent;
        else if (activeCompareFilter === 'CONVERGENT') matchesFilter = isConvergent;

        return matchesSearch && matchesFilter;
    });

    if (rows.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                موجودہ سرچ یا فلٹر سے کوئی انڈیکیٹر میچ نہیں ہوا۔ فلٹر "All 30 Indicators" پر ری سیٹ کریں۔
            </div>
        `;
        return;
    }

    container.innerHTML = rows.map(def => {
        const indA = allA.find(i => i.id === def.id) || { value: '--', status: 'NEUTRAL', meaning: def.descUr, sparkline: [] };
        const indB = allB.find(i => i.id === def.id) || { value: '--', status: 'NEUTRAL', meaning: def.descUr, sparkline: [] };

        const isDivergent = indA.status !== indB.status && (indA.status !== 'NEUTRAL' && indB.status !== 'NEUTRAL');
        const isExactSync = indA.status === indB.status && indA.status !== 'NEUTRAL';

        let syncBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">Neutral Sync</span>`;
        let rowBorder = "border-slate-800 bg-slate-950/70";

        if (isDivergent) {
            syncBadge = `<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">⚡ Major Divergence (الٹ)</span>`;
            rowBorder = "border-amber-500/40 bg-amber-950/10 shadow-sm shadow-amber-500/5";
        } else if (isExactSync) {
            syncBadge = indA.status === 'BULLISH' 
                ? `<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🟢 Both Bullish (متفقہ)</span>`
                : `<span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">🔴 Both Bearish (متفقہ)</span>`;
            rowBorder = indA.status === 'BULLISH' ? "border-emerald-500/30 bg-emerald-950/10" : "border-rose-500/30 bg-rose-950/10";
        }

        const getBadgeStyle = (status) => {
            if (status === 'BULLISH') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            if (status === 'BEARISH') return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            return 'bg-slate-800 text-slate-300 border-slate-700';
        };

        const getValColor = (status) => {
            if (status === 'BULLISH') return 'text-emerald-300';
            if (status === 'BEARISH') return 'text-rose-300';
            return 'text-slate-200';
        };

        return `
            <div class="p-3.5 rounded-xl border ${rowBorder} space-y-2.5 transition-all hover:border-indigo-500/50">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                    <div class="flex items-center gap-2.5">
                        <span class="w-6 h-6 rounded-lg bg-slate-800 text-brand-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                            ${def.id}
                        </span>
                        <div>
                            <span class="text-xs sm:text-sm font-bold text-slate-100">${def.nameEn}</span>
                            <span class="text-xs font-semibold text-brand-400/90 ml-1.5">${def.nameUr}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">${def.category}</span>
                        ${syncBadge}
                    </div>
                </div>

                <!-- Side-by-Side Dual Columns -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- Column A -->
                    <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/90 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-black text-amber-300 flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                                ${coinA.symbol}
                            </span>
                            <span class="px-2 py-0.5 text-[9.5px] font-black rounded border uppercase ${getBadgeStyle(indA.status)}">
                                ${indA.status}
                            </span>
                        </div>
                        <div class="flex items-baseline justify-between text-xs font-mono">
                            <span class="text-slate-400 text-[10px]">Live Reading:</span>
                            <span class="font-bold text-sm ${getValColor(indA.status)}">${indA.value}</span>
                        </div>
                        <div class="h-6">
                            ${renderSparklineSvg(indA.sparkline, indA.status, 120, 24)}
                        </div>
                        <div class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/70 p-2 rounded border border-slate-800/80">
                            <strong class="text-amber-400/90 block mb-0.5 font-semibold">${coinA.symbol} مطلب:</strong>
                            ${indA.meaning}
                        </div>
                    </div>

                    <!-- Column B -->
                    <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/90 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-black text-sky-300 flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                                ${coinB.symbol}
                            </span>
                            <span class="px-2 py-0.5 text-[9.5px] font-black rounded border uppercase ${getBadgeStyle(indB.status)}">
                                ${indB.status}
                            </span>
                        </div>
                        <div class="flex items-baseline justify-between text-xs font-mono">
                            <span class="text-slate-400 text-[10px]">Live Reading:</span>
                            <span class="font-bold text-sm ${getValColor(indB.status)}">${indB.value}</span>
                        </div>
                        <div class="h-6">
                            ${renderSparklineSvg(indB.sparkline, indB.status, 120, 24)}
                        </div>
                        <div class="text-[11px] text-slate-300 leading-relaxed bg-slate-950/70 p-2 rounded border border-slate-800/80">
                            <strong class="text-sky-400/90 block mb-0.5 font-semibold">${coinB.symbol} مطلب:</strong>
                            ${indB.meaning}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function setInspectorFilter(filterType) {
    activeInspectorFilter = filterType;
    document.querySelectorAll('.filter-30-btn').forEach(btn => {
        btn.classList.remove('bg-brand-500/20', 'text-brand-300', 'border-brand-500/40');
        btn.classList.add('bg-slate-800', 'text-slate-400', 'border-slate-700');
    });
    const activeBtn = document.getElementById(`filter30_${filterType}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-800', 'text-slate-400', 'border-slate-700');
        activeBtn.classList.add('bg-brand-500/20', 'text-brand-300', 'border-brand-500/40');
    }
    render30CardsList();
}

function render30CardsList() {
    const container = document.getElementById('quant30CardsContainer');
    if (!container || !window.scannedData) return;
    const item = window.scannedData.find(d => d.symbol === currentInspectedSymbol);
    if (!item || !item.quant30) return;

    const searchTerm = (document.getElementById('search30Input')?.value || '').toLowerCase();

    let list = item.quant30.all30.filter(ind => {
        const matchesSearch = ind.nameEn.toLowerCase().includes(searchTerm) || 
                              ind.nameUr.includes(searchTerm) || 
                              ind.code.toLowerCase().includes(searchTerm);
        
        let matchesFilter = true;
        if (activeInspectorFilter === 'BULL') matchesFilter = ind.status === 'BULLISH';
        else if (activeInspectorFilter === 'BEAR') matchesFilter = ind.status === 'BEARISH';
        else if (activeInspectorFilter === 'REVERSAL') matchesFilter = ind.adx50Role === 'REVERSAL_CRITICAL' || ind.meaning.includes('ریورسل') || ind.meaning.includes('باؤنس');
        else if (activeInspectorFilter === 'SQUEEZE') matchesFilter = ind.adx50Role === 'SQUEEZE_FUEL' || ind.adx50Role === 'CONTINUATION_MOMENTUM' || ind.meaning.includes('سکویز');

        return matchesSearch && matchesFilter;
    });

    if (list.length === 0) {
        container.innerHTML = `
            <div class="col-span-full p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
                کوئی انڈیکیٹر موجودہ سرچ یا فلٹر سے میچ نہیں ہوا۔ تمام 30 انڈیکیٹرز دیکھنے کے لیے فلٹر ری سیٹ کریں۔
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(ind => {
        let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
        let cardBorder = "border-slate-800 bg-slate-950/80";
        let valColor = "text-slate-200";

        if (ind.status === 'BULLISH') {
            badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
            cardBorder = "border-emerald-500/30 bg-emerald-950/15";
            valColor = "text-emerald-300";
        } else if (ind.status === 'BEARISH') {
            badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
            cardBorder = "border-rose-500/30 bg-rose-950/15";
            valColor = "text-rose-300";
        } else {
            badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/35";
            cardBorder = "border-slate-800 bg-slate-950/70";
            valColor = "text-amber-200";
        }

        const isReversalCritical = ind.adx50Role === 'REVERSAL_CRITICAL';
        const roleTag = isReversalCritical 
            ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Reversal Key</span>`
            : `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">${ind.category}</span>`;

        return `
            <div class="p-3.5 rounded-xl border ${cardBorder} flex flex-col justify-between space-y-2 transition-all hover:border-brand-500/50">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-slate-800/90 text-brand-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                            ${ind.id}
                        </span>
                        <div>
                            <h4 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                <span>${ind.nameEn}</span>
                            </h4>
                            <div class="text-[11px] font-semibold text-brand-400/90 mt-0.5">${ind.nameUr}</div>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 text-[9.5px] font-black rounded border uppercase tracking-wider ${badgeColor} shrink-0">
                        ${ind.status}
                    </span>
                </div>

                <div class="p-2 rounded-lg bg-slate-900/90 border border-slate-850 flex items-center justify-between">
                    <div>
                        <div class="text-[9.5px] text-slate-400 uppercase font-medium">Live Value / ریڈنگ</div>
                        <div class="text-xs font-mono font-bold ${valColor} mt-0.5">${ind.value}</div>
                    </div>
                    ${roleTag}
                </div>

                <!-- 15-Period Movement Sparkline -->
                <div class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div class="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${ind.status === 'BULLISH' ? 'bg-emerald-400' : (ind.status === 'BEARISH' ? 'bg-rose-400' : 'bg-amber-400')}"></span>
                            <span class="text-slate-300 font-semibold">15-Period Micro Flow</span>
                        </span>
                        <span class="${ind.trendDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                            ${ind.trendDelta >= 0 ? '▲ +' : '▼ '}${ind.trendDelta}%
                        </span>
                    </div>
                    ${renderSparklineSvg(ind.sparkline, ind.status)}
                </div>

                <div class="space-y-1 text-xs">
                    <div class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                        <strong class="text-brand-400 block mb-0.5 font-semibold">موجودہ لیول اور مطلب:</strong>
                        ${ind.meaning}
                    </div>
                    <div class="text-[10.5px] text-slate-400 leading-relaxed bg-brand-500/5 p-2 rounded-lg border border-brand-500/20">
                        <strong class="text-amber-300 block mb-0.5 font-semibold flex items-center gap-1">
                            <i data-lucide="flame" class="w-3 h-3 text-amber-400"></i>
                            15m ADX ≥ 50 پر اثر و حکمت عملی:
                        </strong>
                        ${ind.adx50Synergy}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function open30MatrixInspector(symbol) {
    currentInspectedSymbol = symbol;
    compareSymbolA = symbol;
    if (!compareSymbolB || compareSymbolB === symbol) {
        const alt = window.scannedData?.find(d => d.symbol !== symbol);
        if (alt) compareSymbolB = alt.symbol;
    }
    const item = window.scannedData?.find(d => d.symbol === symbol);
    if (!item) return;

    // Header info
    document.getElementById('inspSymbol').innerText = item.symbol;
    document.getElementById('inspPrice').innerText = formatPrice(item.price);
    
    const changeEl = document.getElementById('inspChange');
    if (changeEl) {
        changeEl.innerText = `${item.priceChangePercent > 0 ? '+' : ''}${item.priceChangePercent.toFixed(2)}%`;
        changeEl.className = `text-xs px-2 py-0.5 rounded font-bold font-mono ${item.priceChangePercent >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`;
    }

    const adxEl = document.getElementById('inspAdxBadge');
    if (adxEl) {
        if (item.adx >= 50) {
            adxEl.className = "text-xs px-2.5 py-0.5 rounded-full font-black font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse";
            adxEl.innerHTML = `🔥 15m ADX: ${item.adx} (HYPER-TREND / CLIMAX)`;
        } else {
            adxEl.className = "text-xs px-2.5 py-0.5 rounded-full font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
            adxEl.innerText = `15m ADX: ${item.adx}`;
        }
    }

    // Tab 1 Count badges
    if (item.quant30) {
        document.getElementById('inspScore30').innerText = `${item.quant30.score30}%`;
        document.getElementById('inspRatio30').innerText = `(${item.quant30.dominant30Count}/30 Tools Agree)`;
        document.getElementById('inspBull30').innerText = `${item.quant30.bull30Count} Bullish`;
        document.getElementById('inspBear30').innerText = `${item.quant30.bear30Count} Bearish`;
        document.getElementById('inspNeut30').innerText = `${item.quant30.neutral30Count} Neutral`;

        // ADX 50 Tab Data
        document.getElementById('adx50RegimeTitle').innerText = item.quant30.adx50Regime.replace(/_/g, ' ');
        document.getElementById('adx50VerdictText').innerText = item.quant30.adx50VerdictUr;
        document.getElementById('adx50RevScore').innerText = `${item.quant30.reversalScore}/100`;
        document.getElementById('adx50ContScore').innerText = `${item.quant30.continuationScore}/100`;
        document.getElementById('adx50RevBar').style.width = `${Math.min(100, item.quant30.reversalScore)}%`;
        document.getElementById('adx50ContBar').style.width = `${Math.min(100, item.quant30.continuationScore)}%`;

        document.getElementById('adx50ZscoreVal').innerText = `${item.quant30.zScore}σ`;
        document.getElementById('adx50VpinVal').innerText = `${item.quant30.vpin}`;
        document.getElementById('adx50HurstVal').innerText = `${item.quant30.hurst}`;
    }

    // Trade Plan Tab Data
    if (item.plan) {
        document.getElementById('inspPlanDir').innerText = item.plan.direction;
        document.getElementById('inspPlanDir').className = `px-2.5 py-0.5 rounded font-black text-xs border ${item.plan.directionColor}`;
        document.getElementById('inspPlanEntry').innerText = `$${item.plan.entry}`;
        document.getElementById('inspPlanSl').innerText = `$${item.plan.sl} (-${item.plan.slPct}%)`;
        document.getElementById('inspPlanTp1').innerText = `$${item.plan.tp1} (+${item.plan.tp1Pct}%)`;
        document.getElementById('inspPlanTp2').innerText = `$${item.plan.tp2} (+${item.plan.tp2Pct}%)`;
        document.getElementById('inspPlanRrr').innerText = `1 : ${item.plan.rrr}`;
    }

    // Order Book & Depth Tab Data
    document.getElementById('inspL2Depth').innerText = `${item.depthRatio}% Bids / ${100 - item.depthRatio}% Asks`;
    document.getElementById('inspL2Bar').style.width = `${item.depthRatio}%`;
    document.getElementById('inspHvnPoc').innerText = item.hvnData?.pocPrice ? `$${formatPrice(item.hvnData.pocPrice)} (${item.hvnData.volText})` : '--';
    document.getElementById('inspFundingRate').innerText = `${item.fundingRatePct > 0 ? '+' : ''}${item.fundingRatePct}%`;
    document.getElementById('inspOpenInterest').innerText = item.oiFormatted || '--';

    // Set Binance Link
    const linkEl = document.getElementById('inspBinanceLink');
    if (linkEl) linkEl.href = `https://www.binance.com/en/futures/${item.symbol}`;

    // Render Cards in Tab 1
    render30CardsList();

    // Default to Tab 1
    switchInspectorTab('tab_30_matrix');

    // Show modal
    const modal = document.getElementById('quant30InspectorModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function close30Inspector() {
    const modal = document.getElementById('quant30InspectorModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function copyQuant30Report() {
    const item = window.scannedData?.find(d => d.symbol === currentInspectedSymbol);
    if (!item || !item.quant30) return;

    let text = `⚡ BINANCE FUTURES 30-QUANT MATRIX REPORT: ${item.symbol}\n`;
    text += `Price: $${item.price} | 24h: ${item.priceChangePercent}% | 15m ADX: ${item.adx}\n`;
    text += `30-Matrix Confluence: ${item.quant30.dominant30Count}/30 (${item.quant30.score30}%)\n`;
    text += `ADX 50 Verdict: ${item.quant30.adx50VerdictUr}\n\n`;
    text += `🎯 Execution Plan:\n• Direction: ${item.plan?.direction}\n• Entry: $${item.plan?.entry}\n• SL: $${item.plan?.sl}\n• TP1: $${item.plan?.tp1}\n• TP2: $${item.plan?.tp2}\n\n`;
    text += `📊 TOP 30 INTEGRATORS:\n`;

    item.quant30.all30.forEach(i => {
        text += `${i.id}. ${i.nameEn} (${i.nameUr}): ${i.value} [${i.status}]\n   مطلب: ${i.meaning}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyReportBtnText');
        if (btn) {
            btn.innerText = "رپورٹ کاپی ہو گئی!";
            setTimeout(() => { btn.innerText = "Copy 30-Report"; }, 2000);
        }
    });
}

// Open 30-Quant Matrix in a Brand New Browser Tab
function open30InNewTab(symbol) {
    const item = window.scannedData?.find(d => d.symbol === symbol);
    if (!item) {
        alert("پہلے اسکین چلائیں تاکہ کوائن کا ڈیٹا دستیاب ہو سکے!");
        return;
    }
    
    // Fallback if quant30 not yet ready
    if (!item.quant30 && typeof evaluateAll30Indicators === 'function') {
        item.quant30 = evaluateAll30Indicators({
            symbol: item.symbol,
            currentPrice: item.price,
            klines15m: [],
            klines1m: [],
            depthData: null,
            adxData: { adx: item.adx || 30, pDI: 20, nDI: 20 },
            fundingRatePct: item.fundingRatePct || 0.01,
            quoteVolume24h: item.quoteVolume || 10000000
        });
    }

    const htmlContent = generateStandalone30ReportHtml(item);
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
        // Fallback if popup blocker is active
        open30MatrixInspector(symbol);
        return;
    }
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
}

function generateStandalone30ReportHtml(item) {
    const isAdx50 = item.adx >= 50;
    const q30 = item.quant30 || { all30: [], score30: item.score, dominant30Count: item.dominantCount, adx50Regime: 'NORMAL', adx50VerdictUr: '' };
    
    const cardsHtml = (q30.all30 || []).map(ind => {
        let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
        let cardBorder = "border-slate-800 bg-slate-900/90";
        let valColor = "text-slate-200";

        if (ind.status === 'BULLISH') {
            badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
            cardBorder = "border-emerald-500/40 bg-emerald-950/20";
            valColor = "text-emerald-300";
        } else if (ind.status === 'BEARISH') {
            badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
            cardBorder = "border-rose-500/40 bg-rose-950/20";
            valColor = "text-rose-300";
        } else {
            badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/35";
            cardBorder = "border-slate-800 bg-slate-900/70";
            valColor = "text-amber-200";
        }

        const isReversalCritical = ind.adx50Role === 'REVERSAL_CRITICAL';
        const roleTag = isReversalCritical 
            ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">⭐ Reversal Key</span>`
            : `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">${ind.category}</span>`;

        return `
            <div class="p-4 rounded-xl border ${cardBorder} flex flex-col justify-between space-y-3 shadow-md hover:border-amber-500/50 transition-all">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                        <span class="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 font-black font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                            ${ind.id}
                        </span>
                        <div>
                            <h4 class="text-xs sm:text-sm font-bold text-slate-100">${ind.nameEn}</h4>
                            <div class="text-xs font-semibold text-amber-400 mt-0.5">${ind.nameUr}</div>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 text-[10px] font-black rounded border uppercase tracking-wider ${badgeColor} shrink-0">
                        ${ind.status}
                    </span>
                </div>

                <div class="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase font-semibold">Live Level / موجودہ ریڈنگ</div>
                        <div class="text-sm font-mono font-bold ${valColor} mt-0.5">${ind.value}</div>
                    </div>
                    ${roleTag}
                </div>

                <!-- 15-Period Sparkline Micro-Chart -->
                <div class="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 space-y-1">
                    <div class="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${ind.status === 'BULLISH' ? 'bg-emerald-400' : (ind.status === 'BEARISH' ? 'bg-rose-400' : 'bg-amber-400')}"></span>
                            <span class="text-slate-300 font-semibold">15-Period Trend Track</span>
                        </span>
                        <span class="${ind.trendDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                            ${ind.trendDelta >= 0 ? '▲ +' : '▼ '}${ind.trendDelta}%
                        </span>
                    </div>
                    ${renderSparklineSvg(ind.sparkline, ind.status)}
                </div>

                <div class="space-y-2 text-xs">
                    <div class="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                        <strong class="text-amber-400 block mb-1 font-bold">موجودہ لیول اور مطلب:</strong>
                        ${ind.meaning}
                    </div>
                    <div class="text-[11.5px] text-slate-300 leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                        <strong class="text-amber-300 block mb-1 font-bold flex items-center gap-1">
                            🔥 15m ADX ≥ 50 پر اثر و حکمت عملی:
                        </strong>
                        ${ind.adx50Synergy}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const plan = item.plan || { direction: 'NEUTRAL', entry: '0', sl: '0', tp1: '0', tp2: '0', rrr: '2.0' };

    return `<!DOCTYPE html>
<html lang="ur" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.symbol} - 30-Quant Matrix & 15m ADX 50 لائیو معائنہ رپورٹ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: { 400: '#fbbf24', 500: '#f0b90b', 600: '#d9a708' },
                        slate: { 850: '#141c2b', 900: '#0f172a', 950: '#0b0f17' }
                    }
                }
            }
        }
    </script>
    <style>
        .pulse-subtle { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 font-sans antialiased selection:bg-brand-500 selection:text-slate-950">
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header Bar -->
        <header class="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3.5">
                <div class="p-3 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
                    <span class="text-2xl font-black">⚡</span>
                </div>
                <div>
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <h1 class="text-2xl font-black text-white font-mono tracking-tight">${item.symbol}</h1>
                        <span class="text-xs px-2.5 py-1 rounded-full font-black font-mono ${item.priceChangePercent >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
                            ${item.priceChangePercent > 0 ? '+' : ''}${item.priceChangePercent.toFixed(2)}%
                        </span>
                        <span class="text-xs px-3 py-1 rounded-full font-black font-mono ${isAdx50 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}">
                            ${isAdx50 ? '🔥 15m ADX: ' + item.adx + ' (HYPER-TREND / CLIMAX)' : '15m ADX: ' + item.adx}
                        </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span class="text-slate-100 font-bold text-sm">$${item.price}</span>
                        <span>•</span>
                        <span class="text-amber-400 font-bold">30 Quant Matrix Institutional Deep Breakdown</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2.5 flex-wrap">
                <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors">
                    🖨️ Print / Save PDF
                </button>
                <a href="https://www.binance.com/en/futures/${item.symbol}" target="_blank" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-xl text-xs font-black transition-colors">
                    📈 Open Binance Chart
                </a>
            </div>
        </header>

        <!-- Confluence & ADX 50 Banner -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl border border-brand-500/30 bg-slate-900/90 space-y-1">
                <div class="text-xs text-slate-400 font-semibold uppercase">30-Matrix Confluence Score</div>
                <div class="text-2xl font-black font-mono text-brand-400">${q30.dominant30Count}/30 Tools Agree (${q30.score30}%)</div>
                <div class="text-xs text-slate-300 font-mono flex items-center gap-2 pt-1">
                    <span class="text-emerald-400 font-bold">${q30.bull30Count || 0} Bullish</span> •
                    <span class="text-rose-400 font-bold">${q30.bear30Count || 0} Bearish</span> •
                    <span class="text-slate-400">${q30.neutral30Count || 0} Neutral</span>
                </div>
            </div>

            <div class="p-4 rounded-xl border border-rose-500/30 bg-slate-900/90 space-y-1 md:col-span-2">
                <div class="text-xs text-rose-400 font-bold uppercase flex items-center gap-1.5">
                    <span>🔥 15m ADX ≥ 50 Regime Verdict (اے ڈی ایکس 50 فیصلہ):</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
                    ${q30.adx50VerdictUr || "15 منٹ ADX کے مطابق ٹرینڈ کی رفتار متوازن ہے۔"}
                </p>
                <div class="text-[11px] text-slate-400 pt-1">
                    Reversal Climax Power: <strong class="text-amber-400">${q30.reversalScore || 0}/100</strong> | Parabolic Squeeze Power: <strong class="text-emerald-400">${q30.continuationScore || 0}/100</strong>
                </div>
            </div>
        </div>

        <!-- Trade Execution Plan -->
        <div class="p-4 rounded-xl border border-emerald-500/40 bg-slate-900/80 space-y-2.5">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-300">🎯 Recommended Institutional Trade Execution Plan</span>
                <span class="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">RRR: 1 : ${plan.rrr}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div class="text-[10px] text-slate-400 uppercase font-semibold">Direction & Entry</div>
                    <div class="text-sm font-bold font-mono text-emerald-400 mt-0.5">${plan.direction} @ $${plan.entry}</div>
                </div>
                <div class="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30">
                    <div class="text-[10px] text-rose-400 uppercase font-semibold">Stop Loss</div>
                    <div class="text-sm font-bold font-mono text-rose-300 mt-0.5">$${plan.sl} (-${plan.slPct || 1.5}%)</div>
                </div>
                <div class="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <div class="text-[10px] text-emerald-400 uppercase font-semibold">Take Profit 1</div>
                    <div class="text-sm font-bold font-mono text-emerald-300 mt-0.5">$${plan.tp1} (+${plan.tp1Pct || 2.2}%)</div>
                </div>
                <div class="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <div class="text-[10px] text-emerald-400 uppercase font-semibold">Take Profit 2</div>
                    <div class="text-sm font-bold font-mono text-emerald-300 mt-0.5">$${plan.tp2} (+${plan.tp2Pct || 4.5}%)</div>
                </div>
            </div>
        </div>

        <!-- Section Title for 30 Indicators -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>مکمل 30 انڈیکیٹرز معائنہ اور لائیو پوزیشنز (All 30 Indicators Live)</span>
            </h2>
            <span class="text-xs text-slate-400 font-mono">15m & 1m Binance Live Data</span>
        </div>

        <!-- 30 Indicators Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${cardsHtml}
        </div>

        <footer class="p-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
            Binance Futures 30-Quant Matrix & 15m ADX 50 Analysis Suite • Real-time Order Flow Intelligence
        </footer>
    </div>
</body>
</html>`;
}

