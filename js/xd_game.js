(function () {
    'use strict';

    // ==================== 常量 ====================
    const API_HOST = 'http://www.horgrix.com';
    const API_PREFIX = '/api/v1';
    const TORCHLIGHT_GAME_IDS = [1974050, 2315040];
    const DEFAULT_STEAM_ID = 1974050;

    // ==================== DOM 引用 ====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const gameBtnsEl = $('#gameBtns');
    const startDateEl = $('#startDate');
    const endDateEl = $('#endDate');
    const quickBtns = $$('.quick-btns button');
    const seasonFilterGroup = $('#seasonFilterGroup');
    const seasonBtnsEl = $('#seasonBtns');
    const seasonTrendWrapper = $('#seasonTrendWrapper');

    // ==================== 状态 ====================
    let games = [];
    let seasonConfigs = [];
    let selectedSeasons = [];
    let selectedSteamId = DEFAULT_STEAM_ID;
    let lineChart = null;
    let heatmapChart = null;
    let seasonTrendChart = null;
    let peakPlayersChart = null;
    let peakPlayersRawData = [];

    // ==================== 工具函数 ====================
    function dateStrToDisplay(dateStr) {
        if (!dateStr || String(dateStr).length !== 8) return '';
        const s = String(dateStr);
        return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    }

    function displayToDateStr(displayStr) {
        return displayStr.replace(/-/g, '');
    }

    function getDefaultDateRange() {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            start: start.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
        };
    }

    function isTorchlightGame() {
        return TORCHLIGHT_GAME_IDS.includes(selectedSteamId);
    }

    // ==================== API 调用 ====================
    async function apiGet(path, params = {}) {
        const url = new URL(API_HOST + API_PREFIX + path);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.set(k, v);
            }
        });
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.url}`);
        return resp.json();
    }

    // ==================== 游戏列表 - 平铺按钮 ====================
    async function loadGames() {
        try {
            games = await apiGet('/xd/games');
            renderGameButtons();
            selectGame(DEFAULT_STEAM_ID);
        } catch (err) {
            console.error('加载游戏列表失败:', err);
        }
    }

    function renderGameButtons() {
        gameBtnsEl.innerHTML = '';
        games.forEach(g => {
            const btn = document.createElement('button');
            btn.textContent = `${g.steam_name} (${g.steam_id})`;
            btn.dataset.steamId = g.steam_id;
            btn.addEventListener('click', () => selectGame(g.steam_id));
            gameBtnsEl.appendChild(btn);
        });
    }

    function selectGame(steamId) {
        selectedSteamId = steamId;
        // 更新按钮 active 态
        gameBtnsEl.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.steamId) === steamId);
        });
        handleGameChange();
    }

    function handleGameChange() {
        const needLoadSeasons = isTorchlightGame() && seasonConfigs.length === 0;
        if (isTorchlightGame()) {
            seasonFilterGroup.classList.remove('disabled');
            seasonTrendWrapper.classList.remove('hidden');
        } else {
            seasonFilterGroup.classList.add('disabled');
            seasonTrendWrapper.classList.add('hidden');
        }
        // 如果需要加载赛季配置，则暂不刷新，等 loadSeasonConfigs 完成后再刷新
        if (!needLoadSeasons) {
            refreshCharts();
        }
        if (needLoadSeasons) {
            loadSeasonConfigs();
        }
    }

    // ==================== 赛季配置 - 平铺按钮多选 ====================
    async function loadSeasonConfigs() {
        try {
            seasonConfigs = await apiGet('/xd/games/torchlight/season/configs');
            // 按 ss 倒序
            seasonConfigs.sort((a, b) => b.ss - a.ss);
            renderSeasonButtons();
            // 默认选前2个
            selectedSeasons = seasonConfigs.slice(0, 2).map(s => s.ss);
            updateSeasonButtonStates();
            // 赛季数据加载完毕后刷新图表
            refreshCharts();
        } catch (err) {
            console.error('加载赛季配置失败:', err);
        }
    }

    function renderSeasonButtons() {
        seasonBtnsEl.innerHTML = '';
        seasonConfigs.forEach(season => {
            const btn = document.createElement('button');
            btn.dataset.ss = season.ss;
            btn.innerHTML = `
                <span>SS${season.ss}</span>
                <span class="ss-date-range">${dateStrToDisplay(String(season.start_date))} ~ ${dateStrToDisplay(String(season.end_date))}</span>
            `;
            btn.addEventListener('click', () => {
                const ssVal = parseInt(btn.dataset.ss);
                if (selectedSeasons.includes(ssVal)) {
                    selectedSeasons = selectedSeasons.filter(s => s !== ssVal);
                } else {
                    selectedSeasons.push(ssVal);
                }
                updateSeasonButtonStates();
                refreshCharts();
            });
            seasonBtnsEl.appendChild(btn);
        });
    }

    function updateSeasonButtonStates() {
        seasonBtnsEl.querySelectorAll('button').forEach(b => {
            const ssVal = parseInt(b.dataset.ss);
            b.classList.toggle('active', selectedSeasons.includes(ssVal));
        });
    }

    // ==================== 快捷日期 ====================
    function setQuickDate(days, months, years) {
        const end = new Date();
        const start = new Date();
        if (days) start.setDate(start.getDate() - days);
        if (months) start.setMonth(start.getMonth() - months);
        if (years) start.setFullYear(start.getFullYear() - years);
        startDateEl.value = start.toISOString().slice(0, 10);
        endDateEl.value = end.toISOString().slice(0, 10);

        quickBtns.forEach(b => b.classList.remove('active'));
        const matchBtn = document.querySelector(`.quick-btns button[data-days="${days}"], .quick-btns button[data-months="${months}"], .quick-btns button[data-years="${years}"]`);
        if (matchBtn) matchBtn.classList.add('active');

        refreshCharts();
    }

    // ==================== 图表 - Steam 实时排行榜 (Line) ====================
    async function fetchHourlyRankData() {
        const startStr = displayToDateStr(startDateEl.value);
        const endStr = displayToDateStr(endDateEl.value);
        return apiGet('/steam/region_rank', {
            start_date: startStr,
            end_date: endStr,
            steam_id: selectedSteamId,
            type: 'hourly',
        });
    }

    function renderLineChart(data) {
        const container = $('#chartLine');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        const regionMap = {};
        const allDates = new Set();
        data.forEach(d => {
            const key = d.region;
            if (!regionMap[key]) regionMap[key] = {};
            const dateStr = String(d.stat_date);
            regionMap[key][dateStr] = d.rank;
            allDates.add(dateStr);
        });

        const sortedDates = Array.from(allDates).sort();
        const regions = Object.keys(regionMap).sort();

        const series = regions.map(region => ({
            name: region,
            data: sortedDates.map(d => regionMap[region][d] ?? null),
        }));

        const options = {
            chart: {
                type: 'line',
                height: 560,
                background: 'transparent',
                foreColor: '#b0c8d8',
                dropShadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 0.5,
                },
                zoom: { enabled: true },
                toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
            },
            title: {
                text: 'Steam 实时排行榜图表',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#97c786', '#7dc3ea', '#ffa600', '#f46a64', '#fcaaa6'],
            dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#e0e0e0'] } },
            stroke: { curve: 'smooth', width: 2 },
            legend: { position: 'top', labels: { colors: '#b0c8d8' } },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                categories: sortedDates,
                title: { text: 'stat_date', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' }, rotate: -45 },
            },
            yaxis: {
                title: { text: 'Rank', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
                reversed: true,
            },
            series: series,
            tooltip: { theme: 'dark' },
        };

        if (lineChart) lineChart.destroy();
        lineChart = new ApexCharts(container, options);
        lineChart.render();
    }

    // ==================== 图表 - Steam 周排行榜 (Heatmap) ====================
    async function fetchWeeklyRankData() {
        const startStr = displayToDateStr(startDateEl.value);
        const endStr = displayToDateStr(endDateEl.value);
        return apiGet('/steam/region_rank', {
            start_date: startStr,
            end_date: endStr,
            steam_id: selectedSteamId,
            type: 'weekly',
        });
    }

    function renderHeatmapChart(data) {
        const container = $('#chartHeatmap');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        const regionMap = {};
        const allDates = new Set();
        data.forEach(d => {
            const key = d.region;
            if (!regionMap[key]) regionMap[key] = {};
            const dateStr = String(d.stat_date);
            regionMap[key][dateStr] = d.rank;
            allDates.add(dateStr);
        });

        const sortedDates = Array.from(allDates).sort();
        const regions = Object.keys(regionMap).sort();

        const series = regions.map(region => ({
            name: region,
            data: sortedDates.map(d => ({
                x: d,
                y: regionMap[region][d] ?? null,
            })),
        }));

        const options = {
            chart: {
                type: 'heatmap',
                height: 720,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
            },
            title: {
                text: 'Steam 周排行榜图表',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            dataLabels: { enabled: true, style: { fontSize: '10px', colors: ['#fff'] } },
            legend: { position: 'top', labels: { colors: '#b0c8d8' } },
            grid: { borderColor: '#2a3a4a' },
            plotOptions: {
                heatmap: {
                    colorScale: {
                        ranges: [
                            { from: 1, to: 10, name: 'top10', color: '#831A21' },
                            { from: 11, to: 20, name: 'top20', color: '#A13D3B' },
                            { from: 21, to: 30, name: 'top30', color: '#C16D58' },
                            { from: 31, to: 40, name: 'top40', color: '#ECD0B4' },
                            { from: 41, to: 50, name: 'top50', color: '#F2EBE5' },
                            { from: 51, to: 60, name: 'top60', color: '#C8D6E7' },
                            { from: 61, to: 70, name: 'top70', color: '#9EBCDB' },
                            { from: 71, to: 80, name: 'top80', color: '#7091C7' },
                            { from: 81, to: 90, name: 'top90', color: '#4E70AF' },
                            { from: 91, to: 100, name: 'top100', color: '#375093' },
                        ],
                        gradientLegend: {
                            enabled: true,
                            width: '80%',
                            thickness: 10,
                            showHoverValue: true,
                        },
                    },
                },
            },
            xaxis: {
                categories: sortedDates,
                title: { text: 'stat_date', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' }, rotate: -45 },
            },
            yaxis: {
                title: { text: 'Region', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            series: series,
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (val) {
                        return 'Rank: ' + val;
                    },
                },
            },
        };

        if (heatmapChart) heatmapChart.destroy();
        heatmapChart = new ApexCharts(container, options);
        heatmapChart.render();
    }

    // ==================== 图表 - Steam 火炬之光 赛季玩家趋势对比图 (Line) ====================
    async function fetchSeasonPlayersData() {
        if (!isTorchlightGame() || selectedSeasons.length === 0) {
            return [];
        }
        return apiGet('/xd/games/torchlight/seasons/players', {
            seasons: selectedSeasons.join(','),
            steam_id: selectedSteamId,
        });
    }

    function renderSeasonTrendChart(data) {
        const container = $('#chartSeasonTrend');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据（请选择火炬之光游戏并选择赛季）</div>';
            return;
        }

        const ssMap = {};
        data.forEach(d => {
            const key = String(d.ss);
            if (!ssMap[key]) ssMap[key] = {};
            ssMap[key][d.ss_day] = d.peak_players;
        });

        const allDays = new Set();
        Object.values(ssMap).forEach(map => Object.keys(map).forEach(day => allDays.add(parseInt(day))));
        const sortedDays = Array.from(allDays).sort((a, b) => a - b);

        const ssKeys = Object.keys(ssMap).sort((a, b) => parseInt(b) - parseInt(a));

        const series = ssKeys.map(ss => ({
            name: 'SS' + ss,
            data: sortedDays.map(day => ssMap[ss][day] ?? null),
        }));

        const options = {
            chart: {
                type: 'line',
                height: 560,
                background: 'transparent',
                foreColor: '#b0c8d8',
                dropShadow: {
                    enabled: true,
                    color: '#000',
                    top: 18,
                    left: 7,
                    blur: 10,
                    opacity: 0.5,
                },
                zoom: { enabled: true },
                toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
            },
            title: {
                text: 'Steam 火炬之光 赛季玩家趋势对比图',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            legend: { position: 'top', labels: { colors: '#b0c8d8' } },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                categories: sortedDays,
                title: { text: 'ss_day', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: 'peak_players', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
                    },
                },
            },
            series: series,
            tooltip: { theme: 'dark' },
        };

        if (seasonTrendChart) seasonTrendChart.destroy();
        seasonTrendChart = new ApexCharts(container, options);
        seasonTrendChart.render();
    }

    // ==================== 图表 - Steam 峰值玩家趋势图 (Area) ====================
    async function fetchPeakPlayersData() {
        return apiGet('/steam/players', {
            steam_id: selectedSteamId,
        });
    }

    function resetZoomCss(e) {
        const parent = e.target.closest('.zoom-btns');
        if (parent) {
            parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        }
        e.target.classList.add('active');
    }

    function getRangeMs(range) {
        if (range === 'all') return null; // ALL = 全量数据
        const map = {
            '1d': 24 * 60 * 60 * 1000,
            '1m': 30 * 24 * 60 * 60 * 1000,
            '3m': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000,
        };
        return map[range] || 0;
    }

    function renderPeakPlayersChart(data) {
        const container = $('#chartPeakPlayers');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 保存原始数据供缩放使用
        peakPlayersRawData = data;

        // API 返回 [[timestamp, peak_players], ...]
        const seriesData = data.map(item => ({
            x: item[0],
            y: item[1],
        }));

        // X轴 min 取数据最后一个元素的时间戳
        const lastTimestamp = data[data.length - 1][0];

        const options = {
            chart: {
                type: 'area',
                height: 480,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { autoScaleYaxis: true },
                toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
                events: {
                    mounted: function () {
                        bindZoomButtons();
                    },
                },
            },
            title: {
                text: 'Steam 峰值玩家趋势图',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'vertical',
                    opacityFrom: 0.5,
                    opacityTo: 0.1,
                    stops: [0, 100],
                },
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                type: 'datetime',
                min: lastTimestamp,
                tickAmount: 12,
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: 'Peak Players', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
                    },
                },
            },
            tooltip: {
                theme: 'dark',
                x: {
                    format: 'yyyyMMdd',
                },
            },
            series: [{
                name: 'Peak Players',
                data: seriesData,
            }],
        };

        if (peakPlayersChart) peakPlayersChart.destroy();
        peakPlayersChart = new ApexCharts(container, options);
        peakPlayersChart.render();

        // 清除缩放按钮 active
        document.querySelectorAll('#peakZoomBtns button').forEach(b => b.classList.remove('active'));
    }

    function bindZoomButtons() {
        if (!peakPlayersChart || peakPlayersRawData.length === 0) return;

        const firstTimestamp = peakPlayersRawData[0][0];
        const zoomBtns = document.querySelectorAll('#peakZoomBtns button');

        zoomBtns.forEach(btn => {
            // 移除旧监听器（避免重复绑定）
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', function (e) {
                resetZoomCss(e);
                const range = this.dataset.range;
                const rangeMs = getRangeMs(range);

                if (!peakPlayersChart) return;

                let xMin, xMax;
                if (rangeMs === null) {
                    // ALL: 全部数据范围
                    const lastTimestamp = peakPlayersRawData[peakPlayersRawData.length - 1][0];
                    xMin = lastTimestamp;
                    xMax = firstTimestamp;
                } else {
                    xMin = firstTimestamp - rangeMs;
                    xMax = firstTimestamp;
                }

                // 根据 X 范围筛选可见数据的 Y 值，动态计算 Y 轴 range
                const visibleY = peakPlayersRawData
                    .filter(item => item[0] >= xMin && item[0] <= xMax)
                    .map(item => item[1]);

                let yMin = 0;
                let yMax = 100;
                if (visibleY.length > 0) {
                    const rawMin = Math.min(...visibleY);
                    const rawMax = Math.max(...visibleY);
                    const padding = (rawMax - rawMin) * 0.1 || rawMax * 0.1 || 10;
                    yMin = Math.max(0, Math.floor(rawMin - padding));
                    yMax = Math.ceil(rawMax + padding);
                }

                peakPlayersChart.updateOptions({
                    xaxis: { min: xMin, max: xMax },
                    yaxis: { min: yMin, max: yMax },
                }, false, true);
            });
        });
    }

    // ==================== 刷新图表 ====================
    async function refreshCharts() {
        try {
            const [hourlyData, weeklyData, seasonData, peakPlayersData] = await Promise.all([
                fetchHourlyRankData(),
                fetchWeeklyRankData(),
                fetchSeasonPlayersData(),
                fetchPeakPlayersData(),
            ]);
            renderLineChart(hourlyData);
            renderHeatmapChart(weeklyData);
            renderSeasonTrendChart(seasonData);
            renderPeakPlayersChart(peakPlayersData);
        } catch (err) {
            console.error('刷新图表失败:', err);
        }
    }

    // ==================== 事件绑定 ====================
    function bindEvents() {
        // 日期变更
        startDateEl.addEventListener('change', () => {
            quickBtns.forEach(b => b.classList.remove('active'));
            refreshCharts();
        });
        endDateEl.addEventListener('change', () => {
            quickBtns.forEach(b => b.classList.remove('active'));
            refreshCharts();
        });

        // 快捷日期
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days) || 0;
                const months = parseInt(btn.dataset.months) || 0;
                const years = parseInt(btn.dataset.years) || 0;
                setQuickDate(days || undefined, months || undefined, years || undefined);
            });
        });
    }

    // ==================== 初始化 ====================
    function init() {
        const { start, end } = getDefaultDateRange();
        startDateEl.value = start;
        endDateEl.value = end;

        // 默认 30 天高亮
        const btn30 = document.querySelector('.quick-btns button[data-days="30"]');
        if (btn30) btn30.classList.add('active');

        bindEvents();
        loadGames();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();