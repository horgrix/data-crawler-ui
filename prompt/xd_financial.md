# 心动长青游戏数据追踪
使用 apexcharts 图表框架 构建关键指标的统计图表

api host ： https://api.horgrix.com
api prefix：/api/v2/financial

# 代码实现
css/
js/xd_financial.js
htm/xd_financial.html

# 页面布局
## 查询条件
页面顶部 如果向下滑动离开屏幕，则悬浮在顶部
### 年份选择
时间范围选择按钮：近3年 offset = 3，近5年 offset = 5，近10年 offset = 10
展示方式：平铺开
默认选中 近3年
end_year = 今年的年份，start_year = end_year - offset
### 财报类型选择
类型选择按钮：H1(上半年) period=H1、H2(下半年) period = H2、FY(全年) period = FY
展示方式：平铺开
默认全选，任何时候都必须有一个被选中
## 图表


# 图表
## 财务指标（收入、毛利、溢利）
### 使用图表：bar
title：财务指标（收入、毛利、溢利）
chart: {
    type: 'bar',
    height: 600,
}
x轴设置
xaxis: {
    type: 'category',
    labels: {
      formatter: function (val) {
        return val
      },
    },
    group: {
      style: {
        fontSize: '10px',
        fontWeight: 700,
      },
      groups: [
        { title: report_year, cols: 查询条件的财报类型选择按钮选中几个 },
      ],
    },
  },
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
series: [
    {
      name: '营收',
      data: [
        {
          x: period,
          y: revenue,
        }
      ]
    },
    {
      name: '毛利',
      data: [
        {
          x: period,
          y: gross_profit,
        }
      ]
    },
    {
      name: '净利润',
      data: [
        {
          x: period,
          y: profit_attr_to_shareholders,
        }
      ]
    },
    {
      name: '扣非净利润',
      data: [
        {
          x: period,
          y: adjusted_profit_attr_to_shareholders,
        }
      ]
    },
  ]
### 数据获取
数据从 /xd/core-financial-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 13,
    "report_year": 2025,
    "period": "H1",
    "revenue": 3081986,
    "gross_profit": 2252758,
    "gross_profit_margin": 73.1,
    "profit_for_year": 810596,
    "profit_for_year_margin": 26.3,
    "profit_attr_to_shareholders": 754856,
    "profit_attr_to_shareholders_margin": 24.49,
    "adjusted_profit_for_year": 852855,
    "adjusted_profit_for_year_margin": 27.67,
    "adjusted_profit_attr_to_shareholders": 795650,
    "adjusted_profit_attr_to_shareholders_margin": 25.81,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  }
]

## 利润率趋势
### 使用图表：bar
title：利润率趋势
chart: {
    type: 'bar',
    height: 600,
}
x轴设置
xaxis: {
    type: 'category',
    labels: {
      formatter: function (val) {
        return val
      },
    },
    group: {
      style: {
        fontSize: '10px',
        fontWeight: 700,
      },
      groups: [
        { title: report_year, cols: 查询条件的财报类型选择按钮选中几个 },
      ],
    },
  },
tooltip: {
    y: [
      {
        title: {
          formatter: function (val) {
            return val + ' (%)：'
          },
        },
      },
      {
        title: {
          formatter: function (val) {
            return val + ' (%)：'
          },
        },
      },
      {
        title: {
          formatter: function (val) {
            return val + ' (%)：'
          },
        },
      },
    ],
  },
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
series: [
    {
      name: '毛利率',
      data: [
        {
          x: period,
          y: gross_profit_margin,
        }
      ]
    },
    {
      name: '净利润率',
      data: [
        {
          x: period,
          y: profit_attr_to_shareholders_margin,
        }
      ]
    },
    {
      name: '扣非净利润率',
      data: [
        {
          x: period,
          y: adjusted_profit_attr_to_shareholders_margin,
        }
      ]
    },
  ]
### 数据获取
数据从 /xd/core-financial-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 13,
    "report_year": 2025,
    "period": "H1",
    "revenue": 3081986,
    "gross_profit": 2252758,
    "gross_profit_margin": 73.1,
    "profit_for_year": 810596,
    "profit_for_year_margin": 26.3,
    "profit_attr_to_shareholders": 754856,
    "profit_attr_to_shareholders_margin": 24.49,
    "adjusted_profit_for_year": 852855,
    "adjusted_profit_for_year_margin": 27.67,
    "adjusted_profit_attr_to_shareholders": 795650,
    "adjusted_profit_attr_to_shareholders_margin": 25.81,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  }
]

## 运营数据
### 使用图表：bar
title：运营数据
chart: {
    type: 'bar',
    height: 600,
}
x轴设置
xaxis: {
    type: 'category',
    labels: {
      formatter: function (val) {
        return val
      },
    },
    group: {
      style: {
        fontSize: '10px',
        fontWeight: 700,
      },
      groups: [
        { title: report_year, cols: 查询条件的财报类型选择按钮选中几个 },
      ],
    },
  },
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
series: [
    {
      name: '网络游戏平均月活跃用户',
      data: [
        {
          x: period,
          y: online_games_mau,
        }
      ]
    },
    {
      name: '网络游戏平均月付费用户',
      data: [
        {
          x: period,
          y: online_games_mpu,
        }
      ]
    },
    {
      name: 'TapTap中国版App平均月活跃用户',
      data: [
        {
          x: period,
          y: taptap_china_app_mau,
        }
      ]
    },
    {
      name: 'TapTap国际版App平均月活跃用户',
      data: [
        {
          x: period,
          y: taptap_international_app_mau,
        }
      ]
    },
  ]
### 数据获取
数据从 /xd/core-operational-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 15,
    "report_year": 2025,
    "period": "FY",
    "online_games_mau": 11347,
    "online_games_mpu": 1284,
    "taptap_china_app_mau": 44974,
    "taptap_international_app_mau": 4325,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  }
]

## 费用数据
### 使用图表：line
title：费用数据
chart: {
    height: 600,
    type: 'line',
    stacked: false,
  },
dataLabels: {
    enabled: false,
  },
stroke: {
    width: [0, 4, 0, 4, 0, 4],
  },
yaxis: [
    {
        title: { text: '销售及营销开支(人民币)', style: { color: '#b0c8d8' } },
    },
    {
        opposite: true,
        title: { text: '销售及营销开支占比(%)', style: { color: '#b0c8d8' } },
    },
    {
        title: { text: '研发开支(人民币)', style: { color: '#b0c8d8' } },
    },
    {
        opposite: true,
        title: { text: '研发开支占比(%)', style: { color: '#b0c8d8' } },
    },
    {
        title: { text: '一般及行政开支(人民币)', style: { color: '#b0c8d8' } },
    },
    {
        opposite: true,
        title: { text: '一般及行政开支占比(%)', style: { color: '#b0c8d8' } },
    },
  ],
labels: [
    report_year period
  ]
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
series: [
    {
      name: '销售及营销开支',
      type: 'column',
      data: [selling_and_marketing_expenses],
    },
    {
      name: '销售及营销开支占比(%)',
      type: 'line',
      data: [selling_and_marketing_expenses_ratio],
    },
    {
      name: '研发开支',
      type: 'column',
      data: [research_and_development_expenses],
    },
    {
      name: '研发开支占比(%)',
      type: 'line',
      data: [research_and_development_expenses_ratio],
    },
    {
      name: '一般及行政开支',
      type: 'column',
      data: [general_and_administrative_expenses],
    },
    {
      name: '一般及行政开支占比(%)',
      type: 'line',
      data: [general_and_administrative_expenses_ratio],
    },
  ],
### 数据获取
数据从 /xd/expense-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 15,
    "report_year": 2025,
    "period": "FY",
    "revenue": 5763739,
    "selling_and_marketing_expenses": 1435931,
    "selling_and_marketing_expenses_ratio": 24.91,
    "research_and_development_expenses": 981400,
    "research_and_development_expenses_ratio": 17.03,
    "general_and_administrative_expenses": 212639,
    "general_and_administrative_expenses_ratio": 3.69,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  },
]

## 业务收入占比
### 使用图表：bar
chart: {
    type: 'bar',
    height: 600,
    width: 100%,
    stacked: true,
    stackType: '100%',
  },
stroke: {
    width: 1,
    colors: ['#fff'],
  },
  title: {
    text: '业务收入占比',
  },
  xaxis: {
    categories: [report_year period],
  },
fill: {
    opacity: 1,
},
legend: {
  position: 'top'
}
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
series: [
    {
      name: '游戏收入',
      data: [game_revenue]
    },
    {
      name: 'TapTap收入',
      data: [taptap_platform_revenue]
    }
  ],
### 使用图表：line
chart: {
  height: 600,
  type: 'line',
  dropShadow: {
    enabled: true,
    color: '#000',
    top: 18,
    left: 7,
    blur: 10,
    opacity: 0.5,
  },
  zoom: {
    enabled: false,
  },
},
dataLabels: {
    enabled: true,
  },
stroke: {
    curve: 'smooth',
  },
title: {
    text: '业务毛利率趋势',
  },
grid: {
    borderColor: '#e7e7e7',
    row: {
      colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.5,
    },
  },
markers: {
    size: 1,
  },
xaxis: {
    categories: [report_year period],
    title: {
      text: '报告期',
    },
  },
yaxis: {
    title: {
      text: '毛利率(%)',
    }
  },
legend: {
    position: 'top',
    floating: true
},
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6', '#375093'],
series: [
    {
      name: '游戏业务毛利率(%)',
      data: [game_gross_profit_margin],
    },
    {
      name: 'TapTap业务毛利率(%)',
      data: [taptap_platform_gross_profit_margin],
    },
  ],
### 数据获取
数据从 /xd/revenue-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 15,
    "report_year": 2025,
    "period": "FY",
    "game_revenue": 3796067,
    "game_cost": 1237147,
    "game_gross_profit": 2558920,
    "game_gross_profit_margin": 67.41,
    "taptap_platform_revenue": 1967672,
    "taptap_platform_cost": 272037,
    "taptap_platform_gross_profit": 1695635,
    "taptap_platform_gross_profit_margin": 86.18,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  }
]

## 游戏业务收入分类
两个图表1行2列展示
### 使用图表：bar
title：游戏业务收入分类
chart: {
  type: 'bar',
  height: 600,
  stacked: true,
  toolbar: {
    show: true,
  },
  zoom: {
    enabled: true,
  },
},
responsive: [
  {
    breakpoint: 480,
    options: {
      legend: {
        position: 'bottom',
        offsetX: -10,
        offsetY: 0,
      },
    },
  },
],
plotOptions: {
  bar: {
    horizontal: false,
    borderRadius: 10,
    dataLabels: {
      total: {
        enabled: true,
        style: {
          fontSize: '13px',
          fontWeight: 900,
        },
      },
    },
  },
},
xaxis: {
  categories: [report_year period],
  title: {
    text: '报告期',
  },
},
legend: {
  position: 'top',
},
fill: {
  opacity: 1,
},
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
series: [
    {
      name: '网络游戏收入(人民币)',
      data: [online_game_revenue],
    },
    {
      name: '付费游戏收入(人民币)',
      data: [paid_game_revenue],
    },
    {
      name: '其他|游戏内营销及推广(人民币)',
      data: [other_game_revenue],
    }
  ]
### 使用图表：bar
title：游戏业务按收入確認方法分类
chart: {
  type: 'bar',
  height: 600,
  stacked: true,
  toolbar: {
    show: true,
  },
  zoom: {
    enabled: true,
  },
},
responsive: [
  {
    breakpoint: 480,
    options: {
      legend: {
        position: 'bottom',
        offsetX: -10,
        offsetY: 0,
      },
    },
  },
],
plotOptions: {
  bar: {
    horizontal: false,
    borderRadius: 10,
    dataLabels: {
      total: {
        enabled: true,
        style: {
          fontSize: '13px',
          fontWeight: 900,
        },
      },
    },
  },
},
xaxis: {
  categories: [report_year period],
  title: {
    text: '报告期',
  },
},
legend: {
  position: 'top',
},
fill: {
  opacity: 1,
},
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
series: [
    {
      name: '按总额基准确认的收入(人民币)',
      data: [gross_basis_revenue],
    },
    {
      name: '按净额基准确认的收入(人民币)',
      data: [net_basis_revenue],
    },
  ]
### 数据获取
数据从 /xd/revenue-game-report 获取
参数：
start_year 查询条件的年份选择start_year
end_year 查询条件的年份选择end_year
period 查询条件的财报类型选择period，该参数支持多值查询, 
返回的数据结构：
[
  {
    "id": 15,
    "report_year": 2025,
    "period": "FY",
    "game_operation_revenue": 3724419,
    "online_game_revenue": 3596400,
    "paid_game_revenue": 128019,
    "gross_basis_revenue": 3219762,
    "net_basis_revenue": 504657,
    "other_game_revenue": 71648,
    "created_at": "2026-06-22 20:24:35",
    "updated_at": "2026-06-22 20:24:35"
  }
]