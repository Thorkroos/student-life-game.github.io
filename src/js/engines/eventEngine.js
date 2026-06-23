import { eventMatches } from './conditionEngine.js';
import { calculateEventWeight } from './weightEngine.js';
import { pickWeighted } from '../core/random.js';

const FALLBACK_EVENT = {
  id: 'fallback_breath',
  title: '普通的一天',
  category: 'basic',
  type: 'identity',
  phase: ['arrival', 'adapt', 'mid_semester', 'exam', 'break', 'career_phase', 'graduation'],
  once: false,
  text: '这两周没有发生什么大事。你只是上课、做饭、洗衣服、回消息，然后在某个晚上突然意识到，普通地撑过去也是一种进度。',
  choices: [
    {
      text: '整理一下生活，继续往前走',
      effects: { sanity: 2, identity: 1, lifeSkill: 1 },
      flagsAdd: ['quiet_progress'],
      resultText: '没有戏剧性反转，但你把垃圾倒了，把邮件回了，把明天留给了明天。'
    }
  ]
};

export function getNextEvent(state, events, data) {
  const eligible = events.filter(event => eventMatches(state, event));
  const event = pickWeighted(eligible, e => calculateEventWeight(state, e));
  return event || FALLBACK_EVENT;
}
