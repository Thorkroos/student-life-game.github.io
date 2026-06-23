# 开局一张地毯：留学生生存模拟器

一个基于 HTML / CSS / JavaScript / JSON 的纯前端文字选择小游戏。第一版背景暂定澳洲留学，从“地毯、枕头、落地灯”开局，到毕业时根据隐藏数值进入 HE / NE / BE / TE 不同结局。

## 功能

- 角色创建：留学时长、专业大类、家庭背景、出国目标、初始点数分配
- 8 个主数值 + 2 个路线值：Money / Sanity / GPA / English / Life Skill / Social / Visa / Career / Love / Identity
- 基础事件、隐藏事件、进阶事件三层事件池
- 按阶段、专业、目标、数值、flag 过滤事件
- 权重随机抽取事件
- 选择影响数值、flag、家具和结局路线
- 本地存档：localStorage
- 通关后显示完整结算报告

## 运行方式

### 方式一：GitHub Pages

把整个项目上传到 GitHub 仓库，在 Settings → Pages 中选择主分支根目录，即可运行。

### 方式二：本地测试

由于浏览器直接打开 `index.html` 可能无法读取 JSON 文件，建议用本地服务器：

```bash
python -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

## 项目结构

```text
student-life-game/
├── index.html
├── README.md
├── docs/
├── src/
│   ├── css/
│   ├── js/
│   └── data/
└── tests/
```

## 当前版本

v0.1 可运行原型。重点是跑通主循环、事件系统、数值变化、存档和结局判定。

## 后续可扩展

- 增加更多事件文本
- 增加角色头像和房间插画
- 增加小红书/朋友圈/微信群 UI
- 增加加拿大、美国、英国路线
- 增加多周目成就和更多隐藏结局
