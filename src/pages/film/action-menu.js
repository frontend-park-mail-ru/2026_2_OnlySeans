import { element, filmIcon } from './film-ui.js';
let nextMenu=0;
export const createActionMenu = ({label,items,disabled=false}) => {
  const host=element('div','content-actions-menu');const trigger=element('button','content-actions-trigger');trigger.type='button';trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.disabled=disabled;trigger.append(filmIcon('more'));
  const menu=element('div','content-actions-popover');menu.id=`content-actions-${++nextMenu}`;menu.setAttribute('popover','auto');menu.setAttribute('role','menu');menu.setAttribute('aria-label',label);trigger.setAttribute('aria-controls',menu.id);host.append(trigger,menu);
  for(const item of items){const button=element('button','',item.label);button.type='button';button.setAttribute('role','menuitem');button.disabled=Boolean(item.disabled);button.addEventListener('click',()=>{menu.hidePopover();trigger.focus({preventScroll:true});item.onSelect?.();});menu.append(button);}
  const position = () => { const rect=trigger.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;menu.style.left=`${Math.max(12,Math.min(innerWidth-width-12,rect.right-width))}px`;menu.style.top=`${rect.bottom+height+8<innerHeight?rect.bottom+6:Math.max(12,rect.top-height-6)}px`; };
  trigger.addEventListener('click',()=>{if(menu.matches(':popover-open'))menu.hidePopover();else{menu.showPopover();position();menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});}});
  menu.addEventListener('toggle',event=>trigger.setAttribute('aria-expanded',String(event.newState==='open')));
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();menu.hidePopover();trigger.focus({preventScroll:true});return;}if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...menu.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;buttons[next]?.focus();});
  return host;
};
