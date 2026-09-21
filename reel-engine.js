(function(){
  if(window.__reelInit) return; window.__reelInit=true;

  var ICO={cup:'\u2615', chess:'\u265e', cal:String.fromCodePoint(0x1F5D3), salt:String.fromCodePoint(0x1F9C2)};
  var SCRIPT=[
    {s:'00a', cap:'Six patients wait on the case board. The visitor opens The Restless Heart.', find:'CONTINUE', wait:2800},
    {s:'0a',  cap:'A comic page sets the scene: midnight, Baker Street.', find:'BEGIN THE CASE', wait:3000},
    {s:'3a',  cap:'The report gives the vitals and bloods \u2014 three flagged, three perfectly normal.', find:'ENTER THE APARTMENT', wait:3000},
    {s:'2b',  cap:'Tapping a magnifier opens the note \u2014 collect every finding, not just the obvious ones.', hot:0, pop:true, bag:{i:ICO.cup,t:'Espresso \u2014 7 cups'}, wait:6200},
    {s:'2b',  cap:'Bag it or dismiss it \u2014 some finds are harmless, and ruling them out counts.', hot:1, pop:true, bag:{i:ICO.chess,t:'Midnight chess log'}, wait:6200},
    {s:'2b',  cap:'Three rooms to search \u2014 the rail moves between them.', find:'BEDROOM', wait:2400},
    {s:'2c',  cap:'The bedroom: a planner showing a punishing daily schedule.', hot:0, pop:true, bag:{i:ICO.cal,t:'Weekly planner'}, wait:6200},
    {s:'2c',  cap:'The satchel travels with the player from room to room.', find:'KITCHEN', wait:2600},
    {s:'2d',  cap:'The kitchen holds the diet clues \u2014 not all of them are bad habits.', hot:0, pop:true, bag:{i:ICO.salt,t:'Salt cellar \u2014 refilled'}, wait:6200},
    {s:'2d',  cap:'With the satchel full, the evidence goes to the doctor.', find:'TAKE TO DR. FAIRWEATHER', wait:2800},
    {s:'3b',  cap:'The player assembles a diagnosis from what they collected.', find:'SEND REPORT', wait:3400},
    {s:'3c',  cap:'Dr. Fairweather delivers the verdict and explains the medicine.', wait:4600}
  ];

  var BAND=112;
  var st8={step:0, shown:null, bagged:[], timers:[], on:false};
  var cursor, ring, caption, bar, root;

  function timer(ms,fn){ st8.timers.push(setTimeout(fn,ms)); }
  function clearTimers(){ st8.timers.forEach(clearTimeout); st8.timers=[]; }
  function screens(){ return document.querySelectorAll('[data-reel]'); }
  function screenOf(id){ return document.querySelector('[data-reel="'+id+'"]'); }
  function shown(){ return st8.shown?screenOf(st8.shown):null; }

  function fit(node){
    var availH=Math.max(window.innerHeight-BAND,200);
    var s=Math.min(window.innerWidth/1920, availH/1080);
    node.style.left='50%';
    node.style.top=Math.round(availH/2)+'px';
    node.style.transform='translate(-50%,-50%) scale('+s+')';
  }

  function chrome(){
    if(cursor) return;
    root=document.createElement('div');
    root.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9000;';
    cursor=document.createElement('div');
    cursor.style.cssText='position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,242,214,0.92);border:3px solid #0e0805;box-shadow:0 3px 10px rgba(0,0,0,0.6);left:50%;top:60%;transition:left 900ms cubic-bezier(.4,.05,.25,1),top 900ms cubic-bezier(.4,.05,.25,1);';
    ring=document.createElement('div');
    ring.style.cssText='position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e6c878;opacity:0;';
    caption=document.createElement('div');
    caption.style.cssText='position:fixed;left:50%;top:0;transform:translateX(-50%);background:#f0e6cf;color:#1a1206;border:4px solid #0e0805;box-shadow:6px 6px 0 #0e0805;padding:12px 24px;font-family:"Libre Caslon Text",serif;font-size:20px;line-height:1.25;text-align:center;white-space:nowrap;max-width:92vw;';
    bar=document.createElement('div');
    bar.style.cssText='position:fixed;left:0;top:0;height:5px;width:0;background:#d9b45c;transition:width 300ms linear;';
    [ring,cursor,caption,bar].forEach(function(n){ root.appendChild(n); });
    document.body.appendChild(root);
  }

  function placeCaption(){
    var sc=shown(); if(!sc||!caption) return;
    var b=sc.getBoundingClientRect();
    var ch=caption.getBoundingClientRect().height||60;
    var gap=window.innerHeight-b.bottom;
    caption.style.top=Math.round(b.bottom+Math.max((gap-ch)/2,6))+'px';
  }

  function tapAt(x,y){
    ring.style.transition='none'; ring.style.left=x+'px'; ring.style.top=y+'px';
    ring.style.transform='scale(0.5)'; ring.style.opacity='0.9';
    timer(20,function(){
      ring.style.transition='transform 520ms ease-out,opacity 520ms ease-out';
      ring.style.transform='scale(2.7)'; ring.style.opacity='0';
    });
    cursor.style.transition='transform 160ms ease-out'; cursor.style.transform='scale(0.74)';
    timer(180,function(){ cursor.style.transform='scale(1)'; });
  }

  function clean(s){ return (s||'').replace(/[^A-Za-z. ]/g,'').replace(/\s+/g,' ').trim().toUpperCase(); }
  function findTarget(txt){
    var sc=shown(); if(!sc) return null;
    var want=clean(txt), best=null;
    sc.querySelectorAll('div,span,a').forEach(function(el){
      if(clean(el.textContent)===want){
        var b=el.getBoundingClientRect();
        if(b.width&&b.height&&(!best||b.width<best.w)) best={el:el,w:b.width};
      }
    });
    return best&&best.el;
  }
  function findHotspot(n){
    var sc=shown(); if(!sc) return null;
    var hs=[];
    sc.querySelectorAll('div').forEach(function(el){
      if(el.textContent.trim()==='\u2315' && el.offsetWidth>30 && el.offsetWidth<130) hs.push(el);
    });
    hs.sort(function(a,b){ return a.getBoundingClientRect().left-b.getBoundingClientRect().left; });
    return hs[n%Math.max(hs.length,1)]||null;
  }

  function allPopups(){
    var out=[];
    document.querySelectorAll('[data-reel]').forEach(function(sc){
      sc.querySelectorAll('div').forEach(function(el){
        if(el.children.length===0 && el.textContent.trim()==='BAG AS EVIDENCE'){
          var box=el.parentElement&&el.parentElement.parentElement;
          if(box&&out.indexOf(box)<0) out.push(box);
        }
      });
    });
    return out;
  }
  function hideAllPopups(){
    allPopups().forEach(function(p){ p.style.display='none'; });
  }
  function popupOf(){
    var sc=shown(); if(!sc) return null;
    var hit=null;
    allPopups().forEach(function(p){ if(sc.contains(p)) hit=p; });
    return hit;
  }
  function bagButton(p){
    var hit=null;
    p.querySelectorAll('div').forEach(function(el){ if(el.children.length===0 && el.textContent.trim()==='BAG AS EVIDENCE') hit=el; });
    return hit;
  }
  function openPopupAt(p,hot){
    p.style.display='block';
    var scene=p.offsetParent; if(!scene) return;
    var pw=p.offsetWidth||430, ph=p.offsetHeight||210;
    var sw=scene.offsetWidth, sh=scene.offsetHeight;
    var hx=hot.offsetLeft, hy=hot.offsetTop, hw=hot.offsetWidth, hh=hot.offsetHeight;
    var left=hx+hw+34, flip=false;
    if(left+pw>sw-40){ left=hx-pw-34; flip=true; }
    if(left<190){ left=190; }
    var top=hy+hh/2-ph+40;
    if(top<24) top=24;
    if(top>sh-ph-24) top=sh-ph-24;
    p.style.left=Math.round(left)+'px';
    p.style.bottom='auto';
    p.style.top=Math.round(top)+'px';
    p.style.zIndex='40';
    p.querySelectorAll('.reel-notch').forEach(function(n){ n.style.display=flip?'none':'block'; });
    p.style.transition='none';
    p.style.transformOrigin=(flip?'right':'left')+' bottom';
    p.style.transform='rotate(-1.2deg) scale(0.72)';
    p.style.opacity='0';
    timer(20,function(){
      p.style.transition='transform 260ms cubic-bezier(.2,1.5,.4,1),opacity 180ms linear';
      p.style.transform='rotate(-1.2deg) scale(1)';
      p.style.opacity='1';
    });
  }

  function satchel(){
    var sc=shown(); if(!sc) return null;
    var lab=null;
    sc.querySelectorAll('div').forEach(function(d){ if(d.textContent.trim()==='Evidence satchel') lab=d; });
    if(!lab) return null;
    var row=lab.parentElement.children[1]||null;
    if(!row) return null;
    var rem=null;
    [].forEach.call(row.children,function(c){ if(/more to find/i.test(c.textContent)) rem=c; });
    return {row:row, rem:rem};
  }
  function counterEl(){
    var sc=shown(); if(!sc) return null;
    var hit=null;
    sc.querySelectorAll('div').forEach(function(d){ if(/^\d\/7$/.test(d.textContent.trim())) hit=d; });
    return hit;
  }
  function makeChip(bag,animate){
    var chip=document.createElement('div');
    chip.className='reel-bagged';
    chip.style.cssText='background:#efe1c0;border:3px solid #55603a;box-shadow:5px 5px 0 #1c1206;padding:12px 20px;display:flex;align-items:center;gap:14px;min-height:44px;font-family:Archivo,sans-serif;font-weight:800;font-size:17px;color:#241505;white-space:nowrap;transition:transform 260ms cubic-bezier(.2,1.5,.4,1),opacity 200ms linear;';
    if(animate){ chip.style.transform='scale(0.6)'; chip.style.opacity='0'; }
    var a=document.createElement('span'); a.style.fontSize='24px'; a.textContent=bag.i;
    var b=document.createElement('span'); b.textContent=bag.t;
    chip.appendChild(a); chip.appendChild(b);
    return chip;
  }
  function syncCounters(){
    var s=satchel(); if(!s) return;
    var n=Math.min(3+st8.bagged.length,7);
    var c=counterEl(); if(c) c.textContent=n+'/7';
    if(s.rem){ var left=Math.max(7-n,0); s.rem.textContent='+ '+left+' more to find'; s.rem.style.display=left?'flex':'none'; }
  }
  function restoreBagged(){
    var s=satchel(); if(!s) return;
    [].forEach.call(s.row.querySelectorAll('.reel-bagged'),function(c){ c.remove(); });
    st8.bagged.forEach(function(b){
      var chip=makeChip(b,false);
      if(s.rem) s.row.insertBefore(chip,s.rem); else s.row.appendChild(chip);
    });
    syncCounters();
  }

  function bagEvidence(from,bag){
    var s=satchel(); if(!s) return;
    var dest=(s.rem||s.row).getBoundingClientRect();
    var a=from.getBoundingClientRect();
    var fly=document.createElement('div');
    fly.className='reel-fly';
    fly.style.cssText='position:fixed;z-index:9001;background:#efe1c0;border:4px solid #1c1206;box-shadow:6px 6px 0 #1c1206;padding:10px 16px;display:flex;align-items:center;gap:10px;font-family:Archivo,sans-serif;font-weight:800;font-size:16px;color:#241505;white-space:nowrap;transform:translate(-50%,-50%) scale(0.4);opacity:0;transition:left 780ms cubic-bezier(.35,.05,.25,1),top 780ms cubic-bezier(.35,.05,.25,1),transform 780ms cubic-bezier(.35,.05,.25,1),opacity 200ms linear;';
    var i=document.createElement('span'); i.style.fontSize='20px'; i.textContent=bag.i;
    var l=document.createElement('span'); l.textContent=bag.t;
    fly.appendChild(i); fly.appendChild(l);
    fly.style.left=Math.round(a.left+a.width/2)+'px';
    fly.style.top=Math.round(a.top+a.height/2)+'px';
    root.appendChild(fly);
    timer(30,function(){ fly.style.opacity='1'; fly.style.transform='translate(-50%,-50%) scale(1)'; });
    timer(320,function(){
      fly.style.left=Math.round(dest.left+dest.width/2)+'px';
      fly.style.top=Math.round(dest.top+dest.height/2)+'px';
      fly.style.transform='translate(-50%,-50%) scale(0.42)';
    });
    timer(1140,function(){
      fly.remove();
      st8.bagged.push(bag);
      var live=satchel();
      if(live){
        var chip=makeChip(bag,true);
        if(live.rem) live.row.insertBefore(chip,live.rem); else live.row.appendChild(chip);
        timer(30,function(){ chip.style.transform='scale(1)'; chip.style.opacity='1'; });
      }
      syncCounters();
      var c=counterEl();
      if(c){
        c.style.transition='transform 240ms ease-out'; c.style.transform='scale(1.22)';
        timer(260,function(){ c.style.transform='scale(1)'; });
      }
    });
  }

  function show(id){
    if(st8.shown===id) return;
    [].forEach.call(screens(),function(el){ el.style.display = el.getAttribute('data-reel')===id?'block':'none'; });
    st8.shown=id;
    st8.shown=id;
    hideAllPopups();
    var sc=screenOf(id);
    if(sc){ fit(sc); restoreBagged(); }
  }

  function runStep(){
    if(!st8.on) return;
    var pos=st8.step%SCRIPT.length;
    if(pos===0){
      st8.bagged=[];
      [].forEach.call(document.querySelectorAll('.reel-bagged'),function(c){ c.remove(); });
      st8.shown=null;
    }
    [].forEach.call(document.querySelectorAll('.reel-fly'),function(f){ f.remove(); });
    var s=SCRIPT[pos];
    show(s.s);
    caption.textContent=s.cap;
    placeCaption();
    bar.style.width=Math.round(((pos+1)/SCRIPT.length)*100)+'%';

    if(!s.pop) hideAllPopups();
    var target=s.find?findTarget(s.find):(s.hot!=null?findHotspot(s.hot):null);
    if(target){
      var b=target.getBoundingClientRect();
      var cx=Math.round(b.left+b.width/2), cy=Math.round(b.top+b.height/2);
      timer(560,function(){
        if(!st8.on) return;
        cursor.style.transition='left 900ms cubic-bezier(.4,.05,.25,1),top 900ms cubic-bezier(.4,.05,.25,1)';
        cursor.style.left=cx+'px'; cursor.style.top=cy+'px';
      });
      timer(1560,function(){
        if(!st8.on) return;
        tapAt(cx,cy);
        target.style.outline='4px solid #e6c878'; target.style.outlineOffset='3px';
        timer(700,function(){ target.style.outline=''; });
        if(s.pop && s.bag){
          var pop=popupOf();
          if(pop){
            timer(280,function(){ if(st8.on) openPopupAt(pop,target); });
            timer(1000,function(){
              if(!st8.on) return;
              var btn=bagButton(pop); if(!btn) return;
              var bb=btn.getBoundingClientRect();
              var bx=Math.round(bb.left+bb.width/2), by=Math.round(bb.top+bb.height/2);
              cursor.style.transition='left 760ms cubic-bezier(.4,.05,.25,1),top 760ms cubic-bezier(.4,.05,.25,1)';
              cursor.style.left=bx+'px'; cursor.style.top=by+'px';
              timer(880,function(){
                if(!st8.on) return;
                tapAt(bx,by);
                btn.style.outline='4px solid #e6c878'; btn.style.outlineOffset='3px';
                timer(500,function(){ btn.style.outline=''; });
                timer(240,function(){
                  if(!st8.on) return;
                  bagEvidence(pop,s.bag);
                  pop.style.transition='transform 200ms ease-in,opacity 200ms linear';
                  pop.style.transform='rotate(-1.2deg) scale(0.7)';
                  pop.style.opacity='0';
                  timer(220,function(){ pop.style.display='none'; });
                });
              });
            });
          } else if(s.bag) timer(260,function(){ if(st8.on) bagEvidence(target,s.bag); });
        } else if(s.bag) timer(260,function(){ if(st8.on) bagEvidence(target,s.bag); });
      });
    }
    timer(s.wait,function(){ if(!st8.on) return; st8.step++; runStep(); });
  }

  function start(){
    if(!screens().length){ setTimeout(start,400); return; }
    chrome();
    st8.on=true; st8.step=0; st8.shown=null; st8.bagged=[];
    clearTimers();
    runStep();
  }

  window.addEventListener('resize',function(){ var sc=shown(); if(sc){ fit(sc); placeCaption(); } });
  window.__reelStart=start;
  setTimeout(start,600);
})();
