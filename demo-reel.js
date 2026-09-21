(function(){
    if(window.__ppInit) return; window.__ppInit=true;
    var FLOW=['00a','0a','3a','2b','2c','2d','3b','3c'];
    var overlay=null, idx=0, stage=null;
    // in-game buttons that advance the story: match by trimmed button text within each screen
    var NAV={
      '3a':[{t:'ENTER THE APARTMENT',g:'2b'}],
      '2b':[{t:'BEDROOM',g:'2c'},{t:'KITCHEN',g:'2d'},{t:'TAKE TO DR. FAIRWEATHER',g:'3b'}],
      '2c':[{t:'THE STUDY',g:'2b'},{t:'KITCHEN',g:'2d'},{t:'TAKE TO DR. FAIRWEATHER',g:'3b'}],
      '2d':[{t:'THE STUDY',g:'2b'},{t:'BEDROOM',g:'2c'},{t:'TAKE TO DR. FAIRWEATHER',g:'3b'}],
      '3b':[{t:'SEND REPORT',g:'3c'}]
    };
    function screenEl(id){ var col=document.getElementById(id); return col?col.querySelector('[data-screen-label]'):null; }
    function fit(node){
      var band = demo.on ? 108 : 0;
      var availH = Math.max(window.innerHeight - band, 200);
      var s=Math.min(window.innerWidth/1920, availH/1080);
      node.style.left='50%'; node.style.top=Math.round(availH/2)+'px';
      node.style.transform='translate(-50%,-50%) scale('+s+')';
    }
    function wire(id,root){
      var rules=NAV[id]; if(!rules) return;
      var els=root.querySelectorAll('div,span,button,a');
      var clean=function(s){ return (s||'').replace(/[^A-Za-z. ]/g,'').replace(/\s+/g,' ').trim().toUpperCase(); };
      rules.forEach(function(r){
        for(var i=0;i<els.length;i++){
          var el=els[i];
          if(clean(el.textContent)===r.t && !el.hasAttribute('data-goto')){
            el.setAttribute('data-goto', r.g); el.style.cursor='pointer';
          }
        }
      });
    }
    var clones={};
    function getClone(id){
      if(clones[id]) return clones[id];
      var src=screenEl(id); if(!src) return null;
      var clone=src.cloneNode(true);
      clone.style.margin='0'; clone.style.flex='none'; clone.style.boxShadow='none';
      clone.style.contentVisibility='visible';
      wire(id,clone);
      var wrap=document.createElement('div');
      wrap.setAttribute('data-clone',id);
      wrap.style.cssText='position:absolute;left:50%;top:50%;width:1920px;height:1080px;display:none;';
      wrap.appendChild(clone);
      stage.appendChild(wrap);
      clones[id]=wrap;
      return wrap;
    }
    function render(force){
      var id=FLOW[idx]; ensureOverlay();
      if(!force && demo.shown===id && clones[id]) return;
      var clone=getClone(id); if(!clone) return;
      for(var k in clones){ if(clones[k]!==clone) clones[k].style.display='none'; }
      clone.style.display='block';
      fit(clone);
      demo.shown=id;
      if(demo.on) restoreBagged();
      overlay.querySelector('.pp-back').style.visibility = idx>0?'visible':'hidden';
    }
    function ensureOverlay(){
      if(overlay){ overlay.style.display='block'; return; }
      overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#0a0604;overflow:hidden;';
      stage=document.createElement('div'); stage.style.cssText='position:absolute;inset:0;';
      overlay.appendChild(stage);
      var mk=function(cls,txt,css){var b=document.createElement('div');b.className=cls;b.textContent=txt;b.style.cssText='position:fixed;z-index:100000;cursor:pointer;font-family:Archivo,sans-serif;font-weight:800;letter-spacing:0.06em;border:4px solid #0e0805;box-shadow:5px 5px 0 #0e0805;padding:12px 22px;min-height:44px;display:flex;align-items:center;'+css;overlay.appendChild(b);return b;};
      var back=mk('pp-back','\u2190 BACK','left:24px;top:24px;background:#efe1c0;color:#241505;');
      var exit=mk('pp-exit','\u2715 EXIT','right:24px;top:24px;background:#8a3a2a;color:#f5ecd8;');
      back.onclick=function(){ if(idx>0){idx--;render();} };
      exit.onclick=function(){ overlay.style.display='none'; };
      document.body.appendChild(overlay);
      window.addEventListener('resize',function(){ if(overlay&&overlay.style.display!=='none'&&shownClone()){ fit(shownClone()); if(demo.on) placeCaption(); } });
    }
    document.addEventListener('click',function(e){
      var t=e.target.closest&&e.target.closest('[data-goto]');
      if(t){ e.preventDefault(); e.stopPropagation(); var id=t.getAttribute('data-goto'); idx=FLOW.indexOf(id); if(idx<0) idx=0; render(); }
    }, true);

    /* ---------- AUTO-PLAY DEMO REEL ---------- */
    var demo={on:false, timers:[], cursor:null, caption:null, ring:null, step:0, shown:null, bagged:[]};
    var ICO={cup:'\u2615', chess:'\u265e', cal:String.fromCodePoint(0x1F5D3), salt:String.fromCodePoint(0x1F9C2)};
    var SCRIPT=[
      {s:'00a', cap:'Six patients wait on the case board. The visitor picks one.', find:'OPEN FILE', wait:2600},
      {s:'0a',  cap:'A comic page sets the scene: midnight, Baker Street.', find:'BEGIN THE CASE', wait:3000},
      {s:'3a',  cap:'The medical report gives the symptoms to investigate.', find:'ENTER THE APARTMENT', wait:3000},
      {s:'2b',  cap:'In the study, brass magnifiers mark what can be searched.', hot:0, bag:{i:ICO.cup,t:'Espresso \u2014 7 cups'}, wait:3600},
      {s:'2b',  cap:'Tapping a clue bags it as evidence \u2014 the satchel fills up.', hot:1, bag:{i:ICO.chess,t:'Midnight chess log'}, wait:3600},
      {s:'2b',  cap:'Three rooms to search \u2014 the tabs move between them.', find:'BEDROOM', wait:2400},
      {s:'2c',  cap:'The bedroom: a weekly planner showing a punishing schedule.', hot:0, bag:{i:ICO.cal,t:'Weekly planner'}, wait:3600},
      {s:'2c',  cap:'Every room keeps the same evidence satchel along the bottom.', find:'KITCHEN', wait:2400},
      {s:'2d',  cap:'The kitchen holds the diet clues \u2014 salt, sugar, caffeine.', hot:0, bag:{i:ICO.salt,t:'Salt cellar \u2014 refilled'}, wait:3600},
      {s:'2d',  cap:'With the satchel full, the evidence goes to the doctor.', find:'TAKE TO DR. FAIRWEATHER', wait:2600},
      {s:'3b',  cap:'The player assembles a diagnosis from what they collected.', find:'SEND REPORT', wait:3200},
      {s:'3c',  cap:'Dr. Fairweather delivers the verdict and explains the medicine.', wait:4200}
    ];
    function clearTimers(){ demo.timers.forEach(clearTimeout); demo.timers=[]; }
    function after(ms,fn){ demo.timers.push(setTimeout(fn,ms)); }
    function demoChrome(){
      if(demo.cursor) return;
      demo.cursor=document.createElement('div');
      demo.cursor.style.cssText='position:fixed;z-index:100002;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,242,214,0.9);border:3px solid #0e0805;box-shadow:0 3px 10px rgba(0,0,0,0.6);transition:left 900ms cubic-bezier(.4,.05,.25,1),top 900ms cubic-bezier(.4,.05,.25,1);pointer-events:none;left:50%;top:60%;';
      demo.ring=document.createElement('div');
      demo.ring.style.cssText='position:fixed;z-index:100001;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e6c878;opacity:0;pointer-events:none;';
      demo.caption=document.createElement('div');
      demo.caption.style.cssText='position:fixed;z-index:100002;left:50%;top:28px;transform:translateX(-50%);max-width:82vw;background:#f0e6cf;color:#1a1206;border:4px solid #0e0805;box-shadow:6px 6px 0 #0e0805;padding:11px 22px;font-family:"Libre Caslon Text",serif;font-size:19px;line-height:1.25;text-align:center;pointer-events:none;white-space:nowrap;';
      demo.bar=document.createElement('div');
      demo.bar.style.cssText='position:fixed;z-index:100002;left:0;top:0;height:5px;background:#d9b45c;width:0;transition:width 300ms linear;';
      [demo.ring,demo.cursor,demo.caption,demo.bar].forEach(function(n){ overlay.appendChild(n); });
    }
    function tapAt(x,y){
      demo.ring.style.left=x+'px'; demo.ring.style.top=y+'px';
      demo.ring.style.transition='none'; demo.ring.style.transform='scale(0.5)'; demo.ring.style.opacity='0.9';
      requestAnimationFrame(function(){
        demo.ring.style.transition='transform 520ms ease-out,opacity 520ms ease-out';
        demo.ring.style.transform='scale(2.6)'; demo.ring.style.opacity='0';
      });
      demo.cursor.style.transition='transform 160ms ease-out'; demo.cursor.style.transform='scale(0.74)';
      after(170,function(){ demo.cursor.style.transform='scale(1)'; });
    }
    function shownClone(){ return demo.shown&&clones[demo.shown]||stage.firstChild; }
    function placeCaption(){
      var sc=shownClone();
      if(!demo.caption||!sc) return;
      var b=sc.getBoundingClientRect();
      var ch=demo.caption.getBoundingClientRect().height||64;
      var gap=window.innerHeight-b.bottom;
      demo.caption.style.top=Math.round(b.bottom+Math.max((gap-ch)/2,6))+'px';
    }
    function findTarget(txt){
      var clean=function(s){ return (s||'').replace(/[^A-Za-z. ]/g,'').replace(/\s+/g,' ').trim().toUpperCase(); };
      var want=clean(txt), best=null;
      shownClone().querySelectorAll('div,span,a').forEach(function(el){
        if(clean(el.textContent)===want){ var b=el.getBoundingClientRect(); if(b.width&&b.height&&(!best||b.width<best.w)) best={el:el,w:b.width}; }
      });
      return best&&best.el;
    }
    function findHotspot(n){
      var hs=[];
      shownClone().querySelectorAll('div').forEach(function(el){
        if(el.textContent.trim()==='\u2315' && el.offsetWidth>30 && el.offsetWidth<130) hs.push(el);
      });
      hs.sort(function(a,b){ return a.getBoundingClientRect().left-b.getBoundingClientRect().left; });
      return hs[n%Math.max(hs.length,1)]||null;
    }
    function satchelRow(){
      var lab=null;
      shownClone().querySelectorAll('div').forEach(function(d){ if(d.textContent.trim()==='Evidence satchel') lab=d; });
      if(!lab) return null;
      var footer=lab.parentElement;
      return {footer:footer, row:footer.children[1]||null};
    }
    function counterEl(){
      var hit=null;
      shownClone().querySelectorAll('div').forEach(function(d){ if(/^\d\/7$/.test(d.textContent.trim())) hit=d; });
      return hit;
    }
    function remainderEl(row){
      if(!row) return null; var hit=null;
      [].forEach.call(row.children,function(c){ if(/more to find/i.test(c.textContent)) hit=c; });
      return hit;
    }
    function makeChip(bag,animate){
      var chip=document.createElement('div');
      chip.className='pp-bagged';
      chip.style.cssText='background:#efe1c0;border:3px solid #55603a;box-shadow:5px 5px 0 #1c1206;padding:12px 20px;display:flex;align-items:center;gap:14px;min-height:44px;font-family:Archivo,sans-serif;font-weight:800;font-size:17px;color:#241505;white-space:nowrap;transition:transform 260ms cubic-bezier(.2,1.5,.4,1),opacity 200ms linear;';
      if(animate){ chip.style.transform='scale(0.6)'; chip.style.opacity='0'; }
      var a=document.createElement('span'); a.style.fontSize='24px'; a.textContent=bag.i;
      var b=document.createElement('span'); b.textContent=bag.t;
      chip.appendChild(a); chip.appendChild(b);
      return chip;
    }
    function syncCounters(){
      var sr=satchelRow(); if(!sr||!sr.row) return;
      var n=Math.min(3+demo.bagged.length,7);
      var c=counterEl();
      if(c) c.textContent=n+'/7';
      var rem=remainderEl(sr.row);
      if(rem){ var left=Math.max(7-n,0); rem.textContent='+ '+left+' more to find'; rem.style.display=left?'flex':'none'; }
    }
    function restoreBagged(){
      var sr=satchelRow(); if(!sr||!sr.row) return;
      [].forEach.call(sr.row.querySelectorAll('.pp-bagged'),function(c){ c.remove(); });
      if(!demo.bagged.length) return;
      var rem=remainderEl(sr.row);
      demo.bagged.forEach(function(b){
        var chip=makeChip(b,false);
        if(rem) sr.row.insertBefore(chip,rem); else sr.row.appendChild(chip);
      });
      syncCounters();
    }
    function bagEvidence(from,bag){
      var sr=satchelRow(); if(!sr||!sr.row) return;
      var rem=remainderEl(sr.row);
      var destBox=(rem||sr.row).getBoundingClientRect();
      var a=from.getBoundingClientRect();
      var fly=document.createElement('div');
      fly.style.cssText='position:fixed;z-index:100001;background:#efe1c0;border:4px solid #1c1206;box-shadow:6px 6px 0 #1c1206;padding:10px 16px;display:flex;align-items:center;gap:10px;font-family:Archivo,sans-serif;font-weight:800;font-size:15px;color:#241505;white-space:nowrap;pointer-events:none;transform:translate(-50%,-50%) scale(0.4);opacity:0;transition:left 780ms cubic-bezier(.35,.05,.25,1),top 780ms cubic-bezier(.35,.05,.25,1),transform 780ms cubic-bezier(.35,.05,.25,1),opacity 200ms linear;';
      var mkChip=function(icon,label,fs){
        var a=document.createElement('span'); a.style.fontSize=fs+'px'; a.textContent=icon;
        var b=document.createElement('span'); b.textContent=label;
        return [a,b];
      };
      mkChip(bag.i,bag.t,20).forEach(function(n){ fly.appendChild(n); });
      fly.style.left=Math.round(a.left+a.width/2)+'px';
      fly.style.top=Math.round(a.top+a.height/2)+'px';
      fly.className='pp-fly';
      overlay.appendChild(fly);
      after(30,function(){
        fly.style.opacity='1'; fly.style.transform='translate(-50%,-50%) scale(1)';
      });
      after(300,function(){
        fly.style.left=Math.round(destBox.left+destBox.width/2)+'px';
        fly.style.top=Math.round(destBox.top+destBox.height/2)+'px';
        fly.style.transform='translate(-50%,-50%) scale(0.42)';
      });
      after(1120,function(){
        fly.remove();
        demo.bagged.push(bag);
        var live=satchelRow();
        if(live&&live.row){
          var liveRem=remainderEl(live.row);
          var chip=makeChip(bag,true);
          if(liveRem) live.row.insertBefore(chip,liveRem); else live.row.appendChild(chip);
          after(30,function(){ chip.style.transform='scale(1)'; chip.style.opacity='1'; });
        }
        syncCounters();
        var c=counterEl();
        if(c){
          c.style.transition='transform 240ms ease-out'; c.style.transform='scale(1.22)';
          after(250,function(){ c.style.transform='scale(1)'; });
        }
      });
    }
    function runStep(){
      if(!demo.on) return;
      var pos=demo.step%SCRIPT.length;
      if(pos===0){ demo.bagged=[]; demo.shown=null; }
      var st=SCRIPT[pos];
      idx=FLOW.indexOf(st.s); if(idx<0) idx=0;
      [].forEach.call(overlay.querySelectorAll('.pp-fly'),function(f){ f.remove(); });
      render(pos===0); demoChrome();
      demo.caption.textContent=st.cap;
      placeCaption();
      demo.bar.style.width=Math.round(((demo.step+1)/SCRIPT.length)*100)+'%';
      var target=st.find?findTarget(st.find):(st.hot!=null?findHotspot(st.hot):null);
      if(target){
        var b=target.getBoundingClientRect();
        var cx=Math.round(b.left+b.width/2), cy=Math.round(b.top+b.height/2);
        after(560,function(){ if(!demo.on) return; demo.cursor.style.transition='left 900ms cubic-bezier(.4,.05,.25,1),top 900ms cubic-bezier(.4,.05,.25,1)'; demo.cursor.style.left=cx+'px'; demo.cursor.style.top=cy+'px'; });
        after(1560,function(){ if(!demo.on) return; tapAt(cx,cy); target.style.outline='4px solid #e6c878'; target.style.outlineOffset='3px';
          if(st.bag) after(240,function(){ if(demo.on) bagEvidence(target,st.bag); });
        });
      }
      after(st.wait,function(){ if(!demo.on) return; demo.step++; runStep(); });
    }
    function startDemo(){
      ensureOverlay(); demoChrome();
      [demo.cursor,demo.caption,demo.bar].forEach(function(n){ if(n) n.style.display='block'; });
      if(demo.ring) demo.ring.style.display='block';
      demo.cursor.style.left='50%'; demo.cursor.style.top='60%'; demo.bar.style.width='0';
      demo.on=true; demo.step=0; demo.shown=null; demo.bagged=[]; clearTimers();
      overlay.querySelector('.pp-back').style.display='none';
      if(!overlay.querySelector('.pp-stop')){
        var stop=document.createElement('div'); stop.className='pp-stop'; stop.textContent='\u23F9 STOP DEMO';
        stop.style.cssText='position:fixed;z-index:100003;right:24px;bottom:22px;cursor:pointer;font-family:Archivo,sans-serif;font-weight:800;letter-spacing:0.06em;border:4px solid #0e0805;box-shadow:5px 5px 0 #0e0805;padding:10px 18px;min-height:44px;display:flex;align-items:center;background:#efe1c0;color:#241505;';
        stop.onclick=stopDemo; overlay.appendChild(stop);
      }
      overlay.querySelector('.pp-stop').style.display='flex';
      runStep();
    }
    function stopDemo(){
      demo.on=false; clearTimers();
      [demo.cursor,demo.caption,demo.ring,demo.bar].forEach(function(n){ if(n) n.style.display='none'; });
      var s=overlay.querySelector('.pp-stop'); if(s) s.style.display='none';
      overlay.querySelector('.pp-back').style.display='flex';
      overlay.style.display='none';
      if(shownClone()) fit(shownClone());
    }
    window.__playDemo=startDemo;
    function autoStart(){
      if(demo.on) return;
      if(!screenEl(FLOW[0])){ setTimeout(autoStart,400); return; }
      startDemo();
    }
    /* canvas does not auto-hijack: use the gold PLAY button (Gameplay Reel.dc.html autoplays instead) */
    document.addEventListener('click',function(e){
      var t=e.target.closest&&e.target.closest('[data-demo]');
      if(t){ e.preventDefault(); e.stopPropagation(); startDemo(); }
    }, true);
  })();
