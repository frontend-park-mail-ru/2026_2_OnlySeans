import { showFandomError } from '../../services/fandom-notice.js';
import { createPagination, pageFromURL, setPageURL, scrollToList } from './pagination.js';
import { createSpoilerContext } from '../../services/spoiler-context.js';
import { getMyFandoms, getMyFandomFeed, fandomErrorMessage } from '../../api/fandom.js';
import { getMovie, toMovie } from '../../api/movies.js';
import { getMoviePoster } from '../../services/posters.js';
import { store } from '../../modules/store.js';
import { showNotice } from '../../services/notice.js';
import { createCatalogPage } from '../discover/catalog-ui.js';
import { createSpoilerNotice } from './spoiler-notice.js';

import { element, skeletons, showRetry, createThreadCard } from './film-ui.js';

export class MyFandomsPage {
  constructor({navigate}){this.navigate=navigate;}
  render(){
    document.title='Мои обсуждения — Frame';const {page,main}=createCatalogPage(this.navigate);main.className='film-page my-fandoms-page';
    const heading=element('header','my-fandoms-heading');heading.append(element('p','film-eyebrow','Моё кино'),element('h1','','Мои обсуждения'),element('p','film-muted','Фильмы, где вы создавали темы или отвечали. Разговоры, которые продолжаются.'));
    const filmsSection=element('section','my-fandoms-films-section');filmsSection.setAttribute('aria-labelledby','my-fandoms-films-title');const filmsTitle=element('h2','','Мои фильмы');filmsTitle.id='my-fandoms-films-title';const films=element('div','my-fandoms-films');filmsSection.append(filmsTitle,films);
    const feedSection=element('section','my-fandoms-feed-section');const feedTitle=element('h2','','Новое в моих обсуждениях');const status=element('div','fandom-status');status.setAttribute('role','status');const feed=element('div','my-fandoms-feed');let pageNumber=pageFromURL();const paging=createPagination({onChange:number=>{pageNumber=number;setPageURL(number,this.navigate);void loadFeed(true).then(()=>scrollToList(feedTitle));}});feedSection.append(feedTitle,status,feed,paging.element);main.append(heading,createSpoilerNotice(),filmsSection,feedSection);
    const showAuthError=(notify=true)=>{filmsSection.hidden=true;feedSection.hidden=true;if(!main.querySelector('.discussions-auth-error'))main.append(element('p','fandom-empty discussions-auth-error','Войдите, чтобы просматривать свои обсуждения.'));if(notify)showNotice('Войдите, чтобы просматривать свои обсуждения.', {type: 'error', duration: 4000});};
    if(!store.get('user')){showAuthError();return page;}
    const controller=new AbortController();const movies=new Map(),spoilerContexts=new Map();let total=0,items=[],busy=false,disposed=false;const valid=()=>!disposed&&page.isConnected;
    const onError=error=>{if(error.status===401){store.setState({user:null});showAuthError(false);showFandomError(error);return true;}return false;};
    const poster=(movie,width,height)=>{const box=element('span','my-fandoms-poster');const image=element('img');image.src=getMoviePoster(movie)||'';image.alt='';image.width=width;image.height=height;image.loading='lazy';image.addEventListener('error',()=>{image.hidden=true;box.classList.add('poster-unavailable');},{once:true});box.append(image);return box;};
    const filmLink=(movie,compact=false)=>{const link=element('a',compact?'my-fandoms-film-context':'my-fandoms-film');link.href=`/film/${movie.id}/discussion`;link.dataset.link='';link.append(poster(movie,compact?32:64,compact?48:96),element('span','',movie.title));return link;};
    const renderFeed=()=>{
      feed.replaceChildren();feed.removeAttribute('aria-busy');feed.removeAttribute('aria-label');
      for(const thread of items){const movie=movies.get(thread.film_id);const wrapper=element('article','my-fandoms-feed-item');wrapper.append(filmLink(movie,true),createThreadCard(thread,thread.film_id,{compactPinned:false,spoilers:spoilerContexts.get(thread.film_id)}));feed.append(wrapper);}
      if(!items.length)feed.append(element('p','fandom-empty','В ваших обсуждениях пока тихо'));
      paging.update(pageNumber,total,busy);
    };
    const loadFeed=async(reset=false)=>{
      if(busy||!valid())return;busy=true;paging.update(pageNumber,total,true);status.replaceChildren();if(reset){items=[];skeletons(feed);}
      try{
        const data=await getMyFandomFeed({limit:20,offset:(pageNumber-1)*20},{signal:controller.signal});if(!valid())return;if(!Array.isArray(data.threads)||!Number.isInteger(data.total))throw new Error('Invalid feed response');
        const missing=[...new Set(data.threads.map(thread=>thread.film_id))].filter(id=>!movies.has(id));
        const extra=await Promise.all(missing.map(async id=>{try{return await getMovie(id,{signal:controller.signal});}catch(error){if(error.status===404)return{id,title:'Фильм недоступен',poster:''};throw error;}}));if(!valid())return;for(const movie of extra)movies.set(movie.id,movie);
        for(const thread of data.threads){const movie=movies.get(thread.film_id);if(!spoilerContexts.has(movie.id))spoilerContexts.set(movie.id,createSpoilerContext());}if(!valid())return;
        total=data.total;const last=Math.max(1,Math.ceil(total/20));if(pageNumber>last){pageNumber=last;setPageURL(last,this.navigate,{replace:true});const corrected=await getMyFandomFeed({limit:20,offset:(last-1)*20},{signal:controller.signal});if(!valid())return;data.threads=corrected.threads;}items=data.threads;renderFeed();
      }catch(error){if(!valid()||error.name==='AbortError'||onError(error))return;feed.removeAttribute('aria-busy');if(!items.length)feed.replaceChildren();showRetry(status,fandomErrorMessage(error),()=>{void loadFeed(reset);});}
      finally{busy=false;if(valid())paging.update(pageNumber,total);}
    };
    const load=async()=>{
      skeletons(films,2);films.classList.remove('my-fandoms-films--rail');skeletons(feed);feedSection.hidden=false;
      try{
        const collected=[];let filmOffset=0,filmTotal=1;
        while(filmOffset<filmTotal){const data=await getMyFandoms({limit:50,offset:filmOffset},{signal:controller.signal});if(!valid())return;if(!Array.isArray(data.films)||!Number.isInteger(data.total))throw new Error('Invalid films response');collected.push(...data.films.map(toMovie));filmTotal=data.total;filmOffset+=data.films.length;if(!data.films.length)break;}
        movies.clear();for(const movie of collected)movies.set(movie.id,movie);films.replaceChildren();films.removeAttribute('aria-busy');films.removeAttribute('aria-label');
        if(!collected.length){const empty=element('div','fandom-empty');const catalog=element('a','film-button','Перейти в каталог');catalog.href='/films';catalog.dataset.link='';empty.append(element('p','','Здесь появятся обсуждения, в которых вы участвуете. Создайте тему или ответьте в любом фильме'),catalog);films.append(empty);feedSection.hidden=true;return;}
        films.classList.add('my-fandoms-films--rail');films.tabIndex=0;films.setAttribute('aria-label','Мои фильмы — горизонтальная лента');for(const movie of collected)films.append(filmLink(movie));await loadFeed(true);
      }catch(error){if(!valid()||error.name==='AbortError'||onError(error))return;feed.replaceChildren();showRetry(films,fandomErrorMessage(error),load);}
    };
    requestAnimationFrame(()=>{if(!valid())return;const observer=new MutationObserver(()=>{if(page.isConnected)return;disposed=true;controller.abort();observer.disconnect();});observer.observe(page.parentElement,{childList:true});});void load();return page;
  }
}
