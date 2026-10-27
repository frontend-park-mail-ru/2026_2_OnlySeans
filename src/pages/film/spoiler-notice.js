import { element, filmIcon } from './film-ui.js';
const KEY='frame:discussion:spoiler-notice-hidden';
export const createSpoilerNotice = () => {
  const notice=element('aside','spoiler-notice');notice.setAttribute('aria-label','Предупреждение о спойлерах');
  try{if(sessionStorage.getItem(KEY)==='1'||localStorage.getItem(KEY)==='1')return notice;}catch{/* Storage unavailable: keep the warning visible. */}
  const copy=element('div','spoiler-notice__copy');copy.append(element('span','','Здесь могут быть спойлеры — раскрывайте их по желанию.'));
  const actions=element('div','spoiler-notice__actions');
  for(const [label,persistent]of [['Понятно',false],['Больше не показывать',true]]){const button=element('button','',label);button.type='button';button.addEventListener('click',()=>{try{(persistent?localStorage:sessionStorage).setItem(KEY,'1');notice.remove();}catch{/* Keep visible if storage cannot persist the choice. */}});actions.append(button);}
  notice.append(filmIcon('eye'),copy,actions);return notice;
};
