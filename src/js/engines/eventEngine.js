import { eventMatches } from './conditionEngine.js';
import { calculateEventWeight } from './weightEngine.js';
import { pickWeighted } from '../core/random.js';

const FALLBACK_EVENTS = [
  {
    id: 'fallback_arrival_unpack',
    title: '把箱子打开',
    category: 'basic',
    type: 'life',
    phase: ['arrival'],
    baseWeight: 10,
    once: false,
    text: '房间还不像房间，行李箱摊在地上。你意识到落地不是一个瞬间，而是很多个小动作。',
    choices: [
      {
        text: '先把最常用的东西拿出来',
        effects: { lifeSkill: 2, sanity: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '你找到了转换插头、洗漱包和一件还算干净的外套。生活从可定位物品开始。'
      },
      {
        text: '躺在地毯上缓一会儿',
        effects: { sanity: 2, identity: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '天花板没有给你答案，但至少你确认自己真的到了。'
      }
    ]
  },
  {
    id: 'fallback_adapt_grocery',
    title: '超市路线',
    category: 'basic',
    type: 'life',
    phase: ['adapt'],
    baseWeight: 10,
    once: false,
    text: '你终于弄明白哪家超市便宜，哪趟公交不用在风里等太久。',
    choices: [
      {
        text: '买基础食材，回去自己做',
        effects: { money: 2, lifeSkill: 2, sanity: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '饭不算好吃，但你第一次觉得这个城市可以被一点点学会。'
      },
      {
        text: '买点能让人开心的零食',
        effects: { money: -2, sanity: 3 },
        flagsAdd: ['quiet_progress'],
        resultText: '预算表短暂皱眉，但你的精神状态点了点头。'
      }
    ]
  },
  {
    id: 'fallback_semester_library',
    title: '图书馆固定座位',
    category: 'basic',
    type: 'school',
    phase: ['adapt', 'mid_semester'],
    baseWeight: 9,
    once: false,
    text: '你在图书馆找到一个插座稳定、附近没人吃味道很重午饭的位置。',
    choices: [
      {
        text: '把这周的 reading 补掉',
        effects: { gpa: 3, sanity: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '内容并没有突然变简单，但至少你不再完全被它追着跑。'
      },
      {
        text: '顺手改一版简历',
        effects: { career: 2, english: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '你删掉了几个过度自信的形容词，简历看起来反而更像真的。'
      }
    ]
  },
  {
    id: 'fallback_exam_countdown',
    title: '考试周倒计时',
    category: 'basic',
    type: 'school',
    phase: ['exam'],
    baseWeight: 10,
    once: false,
    text: 'DDL 和考试像天气预报一样每天刷新。你开始认真区分紧急和重要。',
    choices: [
      {
        text: '优先处理最危险的一门',
        effects: { gpa: 3, sanity: -2, identity: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '不是完美策略，但它阻止了一场更大的学术事故。'
      },
      {
        text: '睡够再学',
        effects: { sanity: 3, gpa: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '你没有熬成传奇，但第二天终于能看懂题目了。'
      }
    ]
  },
  {
    id: 'fallback_break_reset',
    title: '假期重置',
    category: 'basic',
    type: 'identity',
    phase: ['break'],
    baseWeight: 10,
    once: false,
    text: '假期没有想象中那么自由。你需要决定，是补回血条，还是继续推进目标。',
    choices: [
      {
        text: '认真休息几天',
        effects: { sanity: 4, money: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '你没有“浪费”假期。你只是在给下一个学期还债之前，先给自己充电。'
      },
      {
        text: '做一点长期有用的准备',
        effects: { career: 2, identity: 2, sanity: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '进展很小，但它属于你，不属于任何人的催促。'
      }
    ]
  },
  {
    id: 'fallback_career_followup',
    title: '发出一封跟进邮件',
    category: 'basic',
    type: 'career',
    phase: ['career_phase'],
    baseWeight: 10,
    once: false,
    text: '你盯着草稿箱里的英文邮件，反复确认语气是不是太卑微或太冒犯。',
    choices: [
      {
        text: '发出去',
        effects: { career: 3, english: 1, sanity: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '邮件没有立刻改变人生，但它把你从等待里往外推了一步。'
      },
      {
        text: '先找人帮你看一眼',
        effects: { social: 2, career: 2 },
        flagsAdd: ['quiet_progress'],
        resultText: '对方改了三处表达。你发现求助有时候也是一种能力。'
      }
    ]
  },
  {
    id: 'fallback_graduation_walk',
    title: '毕业前的那段路',
    category: 'basic',
    type: 'identity',
    phase: ['graduation'],
    baseWeight: 10,
    once: false,
    text: '你走过学校旁边那条已经很熟的路，突然发现自己能说出每家店的关门时间。',
    choices: [
      {
        text: '承认这段生活真的改变过你',
        effects: { identity: 3, sanity: 1 },
        flagsAdd: ['quiet_progress'],
        resultText: '改变没有配乐，但它在你处理问题的方式里留下了证据。'
      },
      {
        text: '把接下来三个月列出来',
        effects: { career: 2, visa: 2, sanity: -1 },
        flagsAdd: ['quiet_progress'],
        resultText: '计划不能保证顺利，但它让未来从一团雾变成几条能走的线。'
      }
    ]
  }
];

export function getNextEvent(state, events, data) {
  const eligible = events.filter(event => eventMatches(state, event));
  state.availableEventCount = eligible.length;
  state.availableEventIds = eligible
    .slice()
    .sort((a, b) => calculateEventWeight(state, b) - calculateEventWeight(state, a))
    .slice(0, 12)
    .map(event => event.id);
  const event = pickWeighted(eligible, e => calculateEventWeight(state, e));
  return event || getFallbackEvent(state);
}

function getFallbackEvent(state) {
  const byPhase = FALLBACK_EVENTS.filter(event => event.phase.includes(state.phase));
  const recentIds = new Set(state.recentEventIds || []);
  const fresh = byPhase.filter(event => !recentIds.has(event.id));
  return pickWeighted(fresh.length ? fresh : byPhase, event => event.baseWeight ?? 10)
    || FALLBACK_EVENTS[0];
}
