export const TOP_LEVEL_VIEWS=new Set(['learners','assessments','toolkit']);
export const SWIPE_EDGE_PX=30;
export const SWIPE_DISTANCE_PX=80;
export const SWIPE_DIRECTION_RATIO=1.35;

export const sameNavigationState=(a,b)=>a?.view===b?.view&&a?.id===b?.id&&a?.primaryUnit===b?.primaryUnit;

export function createNavigation(initial={view:'learners'}){
  let current={...initial},history=[];
  return{
    current:()=>({...current}),
    history:()=>history.map(x=>({...x})),
    navigate(next,{replace=false,topLevel=false}={}){
      const target={...next};
      if(topLevel||TOP_LEVEL_VIEWS.has(target.view)&&!target.id){history=[];current=target;return this.current()}
      if(!replace&&!sameNavigationState(current,target))history.push(current);
      current=target;return this.current();
    },
    canGoBack:()=>history.length>0,
    back(){if(!history.length)return null;current=history.pop();return this.current()},
    seed(parent,currentState){history=parent?[{...parent}]:[];current={...currentState}}
  };
}

const blockedSelector='input,textarea,select,button,a,audio,video,canvas,[contenteditable],[data-swipe-back-ignore],.signature-pad-wrap,.media-grid,.media-preview,.knowledge-list,[data-horizontal-scroll]';
export function isSwipeBlockedTarget(target){return !!target?.closest?.(blockedSelector)}
export function swipeBackDecision({startX,startY,endX,endY,target,canGoBack=true}){
  if(!canGoBack||startX>SWIPE_EDGE_PX||startX<0||isSwipeBlockedTarget(target))return false;
  const dx=endX-startX,dy=Math.abs(endY-startY);
  return dx>=SWIPE_DISTANCE_PX&&dx>dy*SWIPE_DIRECTION_RATIO;
}
