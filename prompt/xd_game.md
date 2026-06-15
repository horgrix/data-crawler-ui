# 心动长青游戏数据追踪
使用 apexcharts 图表框架 构建关键指标的统计图表

api host ： http://www.horgrix.com
api prefix：/api/v1

# 代码实现
css/
js/xd_game.js
htm/xd_game.html

# 缓存
所有查询缓存10分钟

# 页面布局
## 查询条件
页面顶部 如果向下滑动离开屏幕，则悬浮在顶部
### 游戏筛选
数据来源：/xd/games
数据格式
[{"steam_id": 1234, "steam_name": "xxx"}]
单选，默认选中 steam_id = 1974050 
展示方式：平铺开，多个选择按钮
### 分割线 
宽度 5px，左右各5px距离
### 分割线
宽度 5px，左右各5px距离
### 赛季选择
如果游戏筛选没有选择steam_id = 1974050 或 steam_id = 2315040 则禁用
数据来源：/xd/games/torchlight/season/configs
数据格式：[{
    "start_date": 202060101,
    "end_date": 20260606,
    "ss": 11,
}]
多选，按ss倒序展示，默认选择2个
展示方式：平铺开，多个选择按钮
## 图表


# 图表
## Steam 实时排行榜图表
### 使用图表：line
title：Steam 实时排行榜图表
图例：top
阴影设置：dropShadow: {
    enabled: true,
    color: '#000',
    top: 18,
    left: 7,
    blur: 10,
    opacity: 0.5,
}
x轴 stat_date
series：[{
    {
      name: region,
      data: [rank],
    },
}]
数据标签：显示
颜色设置：
colors: ['#97c786','#7dc3ea', '#ffa600', '#f46a64', '#fcaaa6'],
### 数据获取
数据从 http://www.horgrix.com/api/v1/steam/region_rank 获取
参数：
start_date 格式yyyymmdd 查询条件的日期筛选的开始时间
end_date 格式yyyymmdd 查询条件的日期筛选的结束时间
steam_id 查询条件的游戏筛选选择的steam_id
type 设置为 hourly
返回的数据结构：
[{
    "stat_date": 20260505 06,
    "steam_id": 12345,
    "rank": 1,
    "region": "HK",
}]

## Steam 周排行榜图表
### 使用图表：heatmap
title：Steam 周排行榜图表
图例：top
数据标签：显示
x轴 stat_date
series：[{
      name: region,
      data: rank}]
颜色配置     
colorScale: {
    ranges: [
    {
        from: 1,
        to: 10,
        name: 'top10',
        color: '#831A21',
    },
    {
      from: 11,
      to: 20,
      name: 'top20',
      color: '#A13D3B',
    },
    {
      from: 21,
      to: 30,
      name: 'top30',
      color: '#C16D58',
    },
    {
      from: 31,
      to: 40,
      name: 'top40',
      color: '#ECD0B4',
    },
    {
      from: 41,
      to: 50,
      name: 'top50',
      color: '#F2EBE5',
    },
    {
      from: 51,
      to: 60,
      name: 'top60',
      color: '#C8D6E7',
    },
    {
      from: 61,
      to: 70,
      name: 'top70',
      color: '#9EBCDB',
    },
    {
      from: 71,
      to: 80,
      name: 'top80',
      color: '#7091C7',
    },
    {
      from: 81,
      to: 90,
      name: 'top90',
      color: '#4E70AF',
    },
    {
      from: 91,
      to: 100,
      name: 'top100',
      color: '#375093',
    }
    ],
    // Render the discrete ranges as a smooth gradient strip instead of the
    // categorical legend. Hovering a band highlights the cells in that range
    // and dims the rest; hovering a cell slides the arrow to its value.
    gradientLegend: {
        enabled: true,
        width: '80%',
        thickness: 10,
        showHoverValue: true,
    },
}
### 数据获取
数据从 http://www.horgrix.com/api/v1/steam/region_rank 获取
参数：
start_date 格式yyyymmdd 查询条件的日期筛选的开始时间
end_date 格式yyyymmdd 查询条件的日期筛选的结束时间
steam_id 查询条件的游戏筛选选择的steam_id
type 设置为 weekly
返回的数据结构：
[{
    "stat_date": 20260505,
    "steam_id": 12345,
    "rank": 1,
    "region": "HK",
}]

## Steam 火炬之光 赛季玩家趋势对比图
如果查询条件的游戏筛选没有选择steam_id = 1974050 或 steam_id = 2315040 则隐藏
### 使用图表：line
图例：top
阴影设置：dropShadow: {
    enabled: true,
    color: '#000',
    top: 18,
    left: 7,
    blur: 10,
    opacity: 0.5,
}
x轴 ss_day
series：[{
    {
      name: ss,
      data: [peak_players],
    },
}]
颜色设置：
colors: ['#7dc3ea', '#ffa600', '#f46a64', '#97c786', '#fcaaa6'],
### 数据获取
数据从 /xd/games/torchlight/seasons/players 获取
参数：
seasons 查询条件的赛季选择的ss，格式为12,11,10
steam_id 查询条件的游戏筛选选择的steam_id
返回的数据结构：
[{
    "ss": 12,
    "ss_day": 1,
    "steam_id": 12323,
    "peak_players": 12345,
}]

## Steam 峰值玩家趋势图
图表左上角添加4个按钮 1天 1月 3月 1年 ALL
给每个按钮添加
document.querySelector('#按钮的id').addEventListener('click', function (e) {
  resetCssClasses(e)

  chart.zoomX(
    相对时间,
    api返回结果第一个元素的时间戳,
  )
})
### 使用图表：area
title：Steam 峰值玩家趋势图
y轴：y轴值可以动态根据所选范围数据改变最大最小值
x轴：{
    type: 'datetime',
    min: 取api返回结果最后一个元素的时间戳,
    tickAmount: 12,
},
tooltip: {
    x: {
      format: 'yyyymmdd',
    },
  },
series: [
    {
      data: api返回结果
    }
]
### 数据获取
数据从 steam/players 获取
参数：
steam_id 查询条件的游戏筛选选择的steam_id
返回的数据结构：
[[时间戳, 峰值玩家数]]