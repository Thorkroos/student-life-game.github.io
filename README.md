# 开局一张地毯：留学生生存模拟器

一个基于 HTML / CSS / JavaScript / JSON 的纯前端文字选择小游戏。当前版本以澳洲留学为主线，从 O-Week 落地、租房和电话卡开始，经历第一学期、期末、冬季假期、第二学期求职季，最后进入毕业与签证过渡。

游戏不是“留下就是赢”。玩家开局选择的目标，会决定 GPA、Money、Sanity、Visa、Career、Identity 等数值在最终结局中的权重。

## 当前内容

- 角色创建：留学时长、专业大类、家庭背景、出国目标、滑动式初始点数分配
- 随机开局环境：城市与住宿类型会随机分配，并影响部分隐藏事件
- 行政清单：银行账户、电话卡/交通、OSHC、住址更新、USI/学生证、TFN/Super；游玩中只展示已完成项目和对应 buff
- 9 个当前可见核心/路线数值：Money / Sanity / GPA / English / Life Skill / Social / Visa / Career / Identity
- 3 种学制节奏：一年制、一年半、两年制
- 7 个澳洲学期阶段：O-Week、第一学期前后半、期末补交、冬季假期、第二学期求职季、毕业签证过渡
- 108 个事件文件内事件，其中恋爱线暂时隐藏，当前游玩不会触发 dating 事件
- 事件覆盖：租房、homestay、学生公寓、远郊通勤、OSHC、银行卡、交通卡、census date、Turnitin、tutorial、打工、TFN/Super、course progress、学校支持服务、政策信息污染、毕业签证准备、graduate program、推荐信、退租押金、家庭沟通和自我认知
- 动态事件池：每回合根据阶段、城市、住宿、目标、数值和 flags 筛选候选事件，并支持单事件基础权重与情境权重微调
- 本地存档：localStorage
- 通关后显示结算报告和称号

## 运行方式

### GitHub Pages

把整个项目上传到 GitHub 仓库，在 Settings -> Pages 中选择主分支根目录，即可运行。

### 本地测试

浏览器直接打开 `index.html` 可能无法读取 JSON 文件，建议用本地服务器：

```bash
py -m http.server 8000 --bind 127.0.0.1
```

然后打开：

```text
http://127.0.0.1:8000
```

如果你的环境使用 `python` 命令：

```bash
python -m http.server 8000
```

## 项目结构

```text
student-life-game/
├── index.html
├── README.md
├── docs/
├── src/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── core/
│   │   ├── engines/
│   │   ├── systems/
│   │   └── ui/
│   └── data/
│       ├── character/
│       ├── characters/
│       ├── config/
│       ├── endings/
│       ├── events/
│       └── room/
└── tests/
```

## 开发说明

- 不需要构建工具，所有逻辑使用原生 ES modules。
- 事件主要通过 JSON 扩展，入口是 `src/data/events/eventIndex.json`。
- 新增事件时要保证 `id` 唯一，并且 `phase`、`category`、`type`、`choices` 字段完整。
- 事件可以使用 `cityTags`、`accommodationTags`、`goalTags`、`conditions` 和 `contextWeights` 控制路线适配与触发权重。
- 城市和住宿配置在 `src/data/config/cities.json` 与 `src/data/config/accommodations.json`。
- 行政清单配置在 `src/data/config/adminTasks.json`，完成状态由事件添加的 flags 决定。
- 结局评分在 `src/js/engines/endingEngine.js`，目标权重在 `src/data/character/goals.json`。
- 游戏时期和进度 UI 在 `src/js/ui/renderStatusPanel.js` 与 `src/css/style.css`。

## 当前校验

最近一次内容调整后做过以下校验：

- 全部 JSON 可解析
- 全部 JS 语法检查通过
- 事件索引引用文件存在
- 事件 ID 无重复
- 事件家具引用有效
- 多策略批量模拟：随机、保守、目标导向路线均可完整跑完
- 最近一次 1000 局模拟：真实事件 38406 次，fallback 16 次，dating 事件 0 次
- homestay 路线校验：不再触发地毯开局、condition report、中介检查、房东推责、二手家具和退租押金类事件

## 后续可扩展

- 继续增加澳洲不同城市差异事件
- 恢复并扩展恋爱角色专属线
- 增加朋友圈/小红书/微信群 UI
- 增加加拿大、美国、英国路线
- 增加多周目成就和更多隐藏结局
