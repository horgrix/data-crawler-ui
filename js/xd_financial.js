(function () {
    'use strict';

    // ==================== 常量 ====================
    const API_HOST = 'https://api.horgrix.com';
    const API_PREFIX = '/api/v2/financial';
    const DEFAULT_OFFSET = 3;
    const ALL_PERIODS = ['H1', 'H2', 'FY'];

    // ==================== DOM 引用 ====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const yearBtnsEl = $('#yearBtns');
    const periodBtnsEl = $('#periodBtns');

    // ==================== 状态 ====================
    let selectedOffset = DEFAULT_OFFSET;
    let selectedPeriods = new Set(ALL_PERIODS); // 默认全选
    let financialChart = null;
    let marginChart = null;
    let operationalChart = null;
    let expenseChart = null;
    let revenueShareChart = null;
    let businessMarginChart = null;
    let gameRevenueCategoryChart = null;
    let gameRevenueMethodChart = null;

    // ==================== 工具函数 ====================
    function getCurrentYear() {
        return new Date().getFullYear();
    }

    // ==================== API 调用 ====================
    async function apiGet(path, params = {}) {
        const url = new URL(API_HOST + API_PREFIX + path);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                // 支持多值参数：数组添加多次同名参数 period=H1&period=H2
                if (Array.isArray(v)) {
                    v.forEach(item => url.searchParams.append(k, item));
                } else {
                    url.searchParams.set(k, v);
                }
            }
        });
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.url}`);
        return resp.json();
    }

    // ==================== 财务数据获取 ====================
    async function fetchFinancialData() {
        const endYear = getCurrentYear();
        const startYear = endYear - selectedOffset;
        const periodsArr = Array.from(selectedPeriods);
        return apiGet('/xd/core-financial-report', {
            start_year: startYear,
            end_year: endYear,
            period: periodsArr.length > 0 ? periodsArr : undefined,
        });
    }

    // ==================== 年份选择按钮 ====================
    function renderYearButtons() {
        yearBtnsEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function () {
                const offset = parseInt(this.dataset.offset);
                if (offset === selectedOffset) return;
                selectedOffset = offset;
                updateYearButtonStates();
                refreshChart();
            });
        });
        updateYearButtonStates();
    }

    function updateYearButtonStates() {
        yearBtnsEl.querySelectorAll('button').forEach(b => {
            const offset = parseInt(b.dataset.offset);
            b.classList.toggle('active', offset === selectedOffset);
        });
    }

    // ==================== 财报类型选择按钮 ====================
    function renderPeriodButtons() {
        periodBtnsEl.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function () {
                const period = this.dataset.period;
                if (selectedPeriods.has(period)) {
                    // 至少保留一个选中
                    if (selectedPeriods.size <= 1) return;
                    selectedPeriods.delete(period);
                } else {
                    selectedPeriods.add(period);
                }
                updatePeriodButtonStates();
                refreshCharts();
            });
        });
        updatePeriodButtonStates();
    }

    function updatePeriodButtonStates() {
        periodBtnsEl.querySelectorAll('button').forEach(b => {
            const period = b.dataset.period;
            b.classList.toggle('active', selectedPeriods.has(period));
        });
    }

    // ==================== 图表渲染 ====================
    function renderFinancialChart(data) {
        const container = $('#chartFinancial');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 series 数据：使用 { x: period, y: value } 格式
        const revenueSeries = data.map(d => ({ x: d.period, y: d.revenue }));
        const grossProfitSeries = data.map(d => ({ x: d.period, y: d.gross_profit }));
        const profitAttrSeries = data.map(d => ({ x: d.period, y: d.profit_attr_to_shareholders }));
        const adjustedProfitAttrSeries = data.map(d => ({ x: d.period, y: d.adjusted_profit_attr_to_shareholders }));

        // 构建 xaxis groups：按 report_year 分组，cols = 当前选中的财报类型数量
        const colsPerYear = selectedPeriods.size;
        const groups = [];
        const seenYears = new Set();
        data.forEach(d => {
            if (!seenYears.has(d.report_year)) {
                seenYears.add(d.report_year);
                groups.push({ title: String(d.report_year), cols: colsPerYear });
            }
        });

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            title: {
                text: '财务指标（收入、毛利、溢利）',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded',
                },
            },
            stroke: {
                show: true,
                width: 1,
                colors: ['transparent'],
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                type: 'category',
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val;
                    },
                },
                group: {
                    style: {
                        fontSize: '10px',
                        fontWeight: 700,
                    },
                    groups: groups,
                },
            },
            yaxis: {
                title: { text: '金额(人民币)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                        return val;
                    },
                },
            },
            series: [
                {
                    name: '营收',
                    data: revenueSeries,
                },
                {
                    name: '毛利',
                    data: grossProfitSeries,
                },
                {
                    name: '净利润',
                    data: profitAttrSeries,
                },
                {
                    name: '扣非净利润',
                    data: adjustedProfitAttrSeries,
                },
            ],
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (val) {
                        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + 'B (人民币)';
                        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M (人民币)';
                        return val + 'K (人民币)';
                    },
                },
            },
        };

        if (financialChart) financialChart.destroy();
        financialChart = new ApexCharts(container, options);
        financialChart.render();
    }

    // ==================== 利润率趋势图表渲染 ====================
    function renderMarginChart(data) {
        const container = $('#chartMargin');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 series 数据：使用 { x: period, y: value } 格式
        const grossProfitMarginSeries = data.map(d => ({ x: d.period, y: d.gross_profit_margin }));
        const profitAttrMarginSeries = data.map(d => ({ x: d.period, y: d.profit_attr_to_shareholders_margin }));
        const adjustedProfitAttrMarginSeries = data.map(d => ({ x: d.period, y: d.adjusted_profit_attr_to_shareholders_margin }));

        // 构建 xaxis groups：按 report_year 分组，cols = 当前选中的财报类型数量
        const colsPerYear = selectedPeriods.size;
        const groups = [];
        const seenYears = new Set();
        data.forEach(d => {
            if (!seenYears.has(d.report_year)) {
                seenYears.add(d.report_year);
                groups.push({ title: String(d.report_year), cols: colsPerYear });
            }
        });

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            title: {
                text: '利润率趋势',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded',
                },
            },
            stroke: {
                show: true,
                width: 1,
                colors: ['transparent'],
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                type: 'category',
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val;
                    },
                },
                group: {
                    style: {
                        fontSize: '10px',
                        fontWeight: 700,
                    },
                    groups: groups,
                },
            },
            yaxis: {
                title: { text: '百分比(%)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val + '%';
                    },
                },
            },
            series: [
                {
                    name: '毛利率',
                    data: grossProfitMarginSeries,
                },
                {
                    name: '净利润率',
                    data: profitAttrMarginSeries,
                },
                {
                    name: '扣非净利润率',
                    data: adjustedProfitAttrMarginSeries,
                },
            ],
            tooltip: {
                theme: 'dark',
                y: [
                    {
                        title: {
                            formatter: function (val) {
                                return val + ' (%)：';
                            },
                        },
                    },
                    {
                        title: {
                            formatter: function (val) {
                                return val + ' (%)：';
                            },
                        },
                    },
                    {
                        title: {
                            formatter: function (val) {
                                return val + ' (%)：';
                            },
                        },
                    },
                ],
            },
        };

        if (marginChart) marginChart.destroy();
        marginChart = new ApexCharts(container, options);
        marginChart.render();
    }

    // ==================== 运营指标图表渲染 ====================
    function renderOperationalChart(data) {
        const container = $('#chartOperational');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 series 数据：使用 { x: period, y: value } 格式
        const onlineGamesMauSeries = data.map(d => ({ x: d.period, y: d.online_games_mau }));
        const onlineGamesMpuSeries = data.map(d => ({ x: d.period, y: d.online_games_mpu }));
        const taptapChinaAppMauSeries = data.map(d => ({ x: d.period, y: d.taptap_china_app_mau }));
        const taptapInternationalAppMauSeries = data.map(d => ({ x: d.period, y: d.taptap_international_app_mau }));

        // 构建 xaxis groups：按 report_year 分组，cols = 当前选中的财报类型数量
        const colsPerYear = selectedPeriods.size;
        const groups = [];
        const seenYears = new Set();
        data.forEach(d => {
            if (!seenYears.has(d.report_year)) {
                seenYears.add(d.report_year);
                groups.push({ title: String(d.report_year), cols: colsPerYear });
            }
        });

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            title: {
                text: '运营数据',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded',
                },
            },
            stroke: {
                show: true,
                width: 1,
                colors: ['transparent'],
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                type: 'category',
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val;
                    },
                },
                group: {
                    style: {
                        fontSize: '10px',
                        fontWeight: 700,
                    },
                    groups: groups,
                },
            },
            yaxis: {
                title: { text: '用户数', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                        return val;
                    },
                },
            },
            series: [
                {
                    name: '网络游戏平均月活跃用户',
                    data: onlineGamesMauSeries,
                },
                {
                    name: '网络游戏平均月付费用户',
                    data: onlineGamesMpuSeries,
                },
                {
                    name: 'TapTap中国版App平均月活跃用户',
                    data: taptapChinaAppMauSeries,
                },
                {
                    name: 'TapTap国际版App平均月活跃用户',
                    data: taptapInternationalAppMauSeries,
                },
            ],
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function (val) {
                        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'B';
                        if (val >= 1000) return (val / 1000).toFixed(1) + 'M';
                        return val;
                    },
                },
            },
        };

        if (operationalChart) operationalChart.destroy();
        operationalChart = new ApexCharts(container, options);
        operationalChart.render();
    }

    // ==================== 运营数据获取 ====================
    async function fetchOperationalData() {
        const endYear = getCurrentYear();
        const startYear = endYear - selectedOffset;
        const periodsArr = Array.from(selectedPeriods);
        return apiGet('/xd/core-operational-report', {
            start_year: startYear,
            end_year: endYear,
            period: periodsArr.length > 0 ? periodsArr : undefined,
        });
    }

    // ==================== 费用数据图表渲染 ====================
    function renderExpenseChart(data) {
        const container = $('#chartExpense');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 labels：report_year + period
        const labels = data.map(d => d.report_year + ' ' + d.period);

        // 构建 series 数据：简单值数组
        const sellingMarketingSeries = data.map(d => d.selling_and_marketing_expenses);
        const rdSeries = data.map(d => d.research_and_development_expenses);
        const gaSeries = data.map(d => d.general_and_administrative_expenses);
        const sellingMarketingRatioSeries = data.map(d => d.selling_and_marketing_expenses_ratio);
        const rdRatioSeries = data.map(d => d.research_and_development_expenses_ratio);
        const gaRatioSeries = data.map(d => d.general_and_administrative_expenses_ratio);

        const options = {
            chart: {
                type: 'line',
                height: 600,
                stacked: false,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            title: {
                text: '费用数据',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
            dataLabels: {
                enabled: false,
            },
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            labels: labels,
            stroke: {
                width: [0, 4, 0, 4, 0, 4],
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                type: 'category',
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                },
            },
            yaxis: [
                {
                    title: { text: '销售及营销开支(人民币)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                            if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                            return val;
                        },
                    },
                },
                {
                    opposite: true,
                    title: { text: '销售及营销开支占比(%)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            return val + '%';
                        },
                    },
                },
                {
                    title: { text: '研发开支(人民币)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                            if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                            return val;
                        },
                    },
                },
                {
                    opposite: true,
                    title: { text: '研发开支占比(%)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            return val + '%';
                        },
                    },
                },
                {
                    title: { text: '一般及行政开支(人民币)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                            if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                            return val;
                        },
                    },
                },
                {
                    opposite: true,
                    title: { text: '一般及行政开支占比(%)', style: { color: '#b0c8d8' } },
                    labels: {
                        style: { colors: '#b0c8d8' },
                        formatter: function (val) {
                            return val + '%';
                        },
                    },
                },
            ],
            series: [
                {
                    name: '销售及营销开支',
                    type: 'column',
                    data: sellingMarketingSeries,
                },
                {
                    name: '销售及营销开支占比(%)',
                    type: 'line',
                    data: sellingMarketingRatioSeries,
                },
                {
                    name: '研发开支',
                    type: 'column',
                    data: rdSeries,
                },
                {
                    name: '研发开支占比(%)',
                    type: 'line',
                    data: rdRatioSeries,
                },
                {
                    name: '一般及行政开支',
                    type: 'column',
                    data: gaSeries,
                },
                {
                    name: '一般及行政开支占比(%)',
                    type: 'line',
                    data: gaRatioSeries,
                },
            ],
            tooltip: {
                theme: 'dark',
            },
        };

        if (expenseChart) expenseChart.destroy();
        expenseChart = new ApexCharts(container, options);
        expenseChart.render();
    }

    // ==================== 费用数据获取 ====================
    async function fetchExpenseData() {
        const endYear = getCurrentYear();
        const startYear = endYear - selectedOffset;
        const periodsArr = Array.from(selectedPeriods);
        return apiGet('/xd/expense-report', {
            start_year: startYear,
            end_year: endYear,
            period: periodsArr.length > 0 ? periodsArr : undefined,
        });
    }

    // ==================== 业务收入占比 - 堆叠百分比柱状图 ====================
    function renderRevenueShareChart(data) {
        const container = $('#chartRevenueShare');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 categories：report_year + period
        const categories = data.map(d => d.report_year + ' ' + d.period);

        const gameRevenueSeries = data.map(d => d.game_revenue);
        const taptapRevenueSeries = data.map(d => d.taptap_platform_revenue);

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                width: '100%',
                stacked: true,
                stackType: '100%',
                background: 'transparent',
                foreColor: '#b0c8d8',
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            title: {
                text: '业务收入占比',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            stroke: {
                width: 1,
                colors: ['#fff'],
            },
            fill: {
                opacity: 1,
            },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                categories: categories,
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: '占比(%)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val + '%';
                    },
                },
            },
            series: [
                { name: '游戏收入', data: gameRevenueSeries },
                { name: 'TapTap收入', data: taptapRevenueSeries },
            ],
            tooltip: { theme: 'dark' },
        };

        if (revenueShareChart) revenueShareChart.destroy();
        revenueShareChart = new ApexCharts(container, options);
        revenueShareChart.render();
    }

    // ==================== 业务毛利率趋势 - 折线图 ====================
    function renderBusinessMarginChart(data) {
        const container = $('#chartBusinessMargin');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        // 构建 categories：report_year + period
        const categories = data.map(d => d.report_year + ' ' + d.period);

        const gameMarginSeries = data.map(d => d.game_gross_profit_margin);
        const taptapMarginSeries = data.map(d => d.taptap_platform_gross_profit_margin);

        const options = {
            chart: {
                height: 600,
                type: 'line',
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
                zoom: { enabled: false },
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            dataLabels: { enabled: true },
            stroke: { curve: 'smooth' },
            title: {
                text: '业务毛利率趋势',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            grid: {
                borderColor: '#2a3a4a',
                row: {
                    colors: ['#1a2a3a', 'transparent'],
                    opacity: 0.5,
                },
            },
            markers: { size: 1 },
            xaxis: {
                categories: categories,
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: '毛利率(%)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        return val + '%';
                    },
                },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
            legend: {
                position: 'top',
                floating: true,
                labels: { colors: '#b0c8d8' },
            },
            series: [
                { name: '游戏业务毛利率(%)', data: gameMarginSeries },
                { name: 'TapTap业务毛利率(%)', data: taptapMarginSeries },
            ],
            tooltip: { theme: 'dark' },
        };

        if (businessMarginChart) businessMarginChart.destroy();
        businessMarginChart = new ApexCharts(container, options);
        businessMarginChart.render();
    }

    // ==================== 游戏业务收入分类 - 堆叠柱状图 ====================
    function renderGameRevenueCategoryChart(data) {
        const container = $('#chartGameRevenueCategory');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        const categories = data.map(d => d.report_year + ' ' + d.period);

        const onlineGameSeries = data.map(d => d.online_game_revenue);
        const paidGameSeries = data.map(d => d.paid_game_revenue);
        const otherGameSeries = data.map(d => d.other_game_revenue);

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                stacked: true,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: { show: true },
            },
            title: {
                text: '游戏业务收入分类',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: { position: 'bottom', offsetX: -10, offsetY: 0 },
                    },
                },
            ],
            plotOptions: {
                bar: {
                    horizontal: false,
                    dataLabels: {
                        total: {
                            enabled: true,
                            style: { fontSize: '13px', fontWeight: 900 },
                            formatter: function (val) {
                                if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                                if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                                return val;
                            },
                        },
                    },
                },
            },
            fill: { opacity: 1 },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                categories: categories,
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: '金额(人民币)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                        return val;
                    },
                },
            },
            series: [
                { name: '网络游戏收入(人民币)', data: onlineGameSeries },
                { name: '付费游戏收入(人民币)', data: paidGameSeries },
                { name: '其他|游戏内营销及推广(人民币)', data: otherGameSeries },
            ],
            tooltip: { theme: 'dark' },
        };

        if (gameRevenueCategoryChart) gameRevenueCategoryChart.destroy();
        gameRevenueCategoryChart = new ApexCharts(container, options);
        gameRevenueCategoryChart.render();
    }

    // ==================== 游戏业务按收入確認方法分类 - 堆叠柱状图 ====================
    function renderGameRevenueMethodChart(data) {
        const container = $('#chartGameRevenueMethod');
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#7a9ab0;">暂无数据</div>';
            return;
        }

        const categories = data.map(d => d.report_year + ' ' + d.period);

        const grossBasisSeries = data.map(d => d.gross_basis_revenue);
        const netBasisSeries = data.map(d => d.net_basis_revenue);

        const options = {
            chart: {
                type: 'bar',
                height: 600,
                stacked: true,
                background: 'transparent',
                foreColor: '#b0c8d8',
                zoom: { enabled: true },
                toolbar: { show: true },
            },
            title: {
                text: '游戏业务按收入確認方法分类',
                align: 'center',
                style: { fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' },
            },
            colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
            legend: {
                position: 'top',
                labels: { colors: '#b0c8d8' },
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: { position: 'bottom', offsetX: -10, offsetY: 0 },
                    },
                },
            ],
            plotOptions: {
                bar: {
                    horizontal: false,
                    dataLabels: {
                        total: {
                            enabled: true,
                            style: { fontSize: '13px', fontWeight: 900 },
                            formatter: function (val) {
                                if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                                if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                                return val;
                            },
                        },
                    },
                },
            },
            fill: { opacity: 1 },
            grid: { borderColor: '#2a3a4a' },
            xaxis: {
                categories: categories,
                title: { text: '报告期', style: { color: '#b0c8d8' } },
                labels: { style: { colors: '#b0c8d8' } },
            },
            yaxis: {
                title: { text: '金额(人民币)', style: { color: '#b0c8d8' } },
                labels: {
                    style: { colors: '#b0c8d8' },
                    formatter: function (val) {
                        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'B';
                        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'M';
                        return val;
                    },
                },
            },
            series: [
                { name: '按总额基准确认的收入(人民币)', data: grossBasisSeries },
                { name: '按净额基准确认的收入(人民币)', data: netBasisSeries },
            ],
            tooltip: { theme: 'dark' },
        };

        if (gameRevenueMethodChart) gameRevenueMethodChart.destroy();
        gameRevenueMethodChart = new ApexCharts(container, options);
        gameRevenueMethodChart.render();
    }

    // ==================== 游戏业务收入数据获取 ====================
    async function fetchGameRevenueData() {
        const endYear = getCurrentYear();
        const startYear = endYear - selectedOffset;
        const periodsArr = Array.from(selectedPeriods);
        return apiGet('/xd/revenue-game-report', {
            start_year: startYear,
            end_year: endYear,
            period: periodsArr.length > 0 ? periodsArr : undefined,
        });
    }

    // ==================== 收入报告数据获取 ====================
    async function fetchRevenueData() {
        const endYear = getCurrentYear();
        const startYear = endYear - selectedOffset;
        const periodsArr = Array.from(selectedPeriods);
        return apiGet('/xd/revenue-report', {
            start_year: startYear,
            end_year: endYear,
            period: periodsArr.length > 0 ? periodsArr : undefined,
        });
    }

    // ==================== 刷新图表 ====================
    async function refreshCharts() {
        try {
            const financialData = await fetchFinancialData();
            renderFinancialChart(financialData);
            renderMarginChart(financialData);
            const operationalData = await fetchOperationalData();
            renderOperationalChart(operationalData);
            const expenseData = await fetchExpenseData();
            renderExpenseChart(expenseData);
            const revenueData = await fetchRevenueData();
            renderRevenueShareChart(revenueData);
            renderBusinessMarginChart(revenueData);
            const gameRevenueData = await fetchGameRevenueData();
            renderGameRevenueCategoryChart(gameRevenueData);
            renderGameRevenueMethodChart(gameRevenueData);
        } catch (err) {
            console.error('刷新图表失败:', err);
            const errHtml = '<div style="text-align:center;padding:60px;color:#f46a64;">数据加载失败，请稍后重试</div>';
            ['chartFinancial', 'chartMargin', 'chartOperational', 'chartExpense', 'chartRevenueShare', 'chartBusinessMargin', 'chartGameRevenueCategory', 'chartGameRevenueMethod'].forEach(id => {
                const el = $('#' + id);
                if (el) el.innerHTML = errHtml;
            });
        }
    }

    function refreshChart() {
        refreshCharts();
    }

    // ==================== 初始化 ====================
    function init() {
        renderYearButtons();
        renderPeriodButtons();
        refreshCharts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();