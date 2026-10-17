(function(){
  var root=document.documentElement,K='cb-';
  function get(k){try{return localStorage.getItem(K+k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(K+k,v)}catch(e){}}
  var t=get('theme'); if(t) root.setAttribute('data-theme',t);

  // theme toggle
  var nav=document.querySelector('nav'), tb=document.createElement('button');
  tb.textContent='Theme'; tb.setAttribute('aria-label','Toggle light or dark theme');
  tb.onclick=function(){
    var dark=root.getAttribute('data-theme')==='dark';
    var n=dark?'light':'dark'; root.setAttribute('data-theme',n); set('theme',n); if(window.__dna)window.__dna();
  };
  nav.appendChild(tb);

  // reading progress bar
  var bar=document.createElement('div'); bar.id='bar'; document.body.appendChild(bar);
  addEventListener('scroll',function(){
    var h=document.documentElement; var m=h.scrollHeight-h.clientHeight;
    bar.style.width=(m>0?h.scrollTop/m*100:0)+'%';
  },{passive:true});

  var page=location.pathname.split('/').pop()||'index.html';
  var topics=[].slice.call(document.querySelectorAll('.topic'));

  if(topics.length){
    // collapsible topics + done tracking
    topics.forEach(function(el,i){
      var h=el.querySelector('h2'), body=document.createElement('div'); body.className='body';
      [].slice.call(el.children).forEach(function(c){ if(c!==h&&!c.classList.contains('tag')) body.appendChild(c); });
      el.appendChild(body);
      h.tabIndex=0; h.setAttribute('role','button');
      function tog(){ el.classList.toggle('open'); h.setAttribute('aria-expanded',el.classList.contains('open')); }
      h.onclick=tog; h.onkeydown=function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();} };
      var key=page+'-'+i, b=document.createElement('button'); b.className='done-btn';
      function paint(){ var d=get(key)==='1'; el.classList.toggle('done',d); b.textContent=d?'Done. Click to undo':'Mark as done'; count(); }
      b.onclick=function(){ set(key,get(key)==='1'?'0':'1'); paint(); };
      body.appendChild(b); paint();
    });
    topics[0].classList.add('open');

    // toolbar: search, expand/collapse
    var tools=document.createElement('div'); tools.className='tools';
    tools.innerHTML='<input type=search placeholder="Search topics in this unit" aria-label="Search topics"><button data-a=open>Expand all</button><button data-a=close>Collapse all</button><span class=count></span>';
    var first=document.querySelector('.topic'); first.parentNode.insertBefore(tools,first);
    var inp=tools.querySelector('input'), cnt=tools.querySelector('.count');
    inp.oninput=function(){
      var q=inp.value.trim().toLowerCase();
      topics.forEach(function(el){
        var hit=!q||el.textContent.toLowerCase().indexOf(q)>-1;
        el.classList.toggle('hide',!hit); if(q&&hit) el.classList.add('open');
      });
    };
    tools.onclick=function(e){ var a=e.target.dataset.a; if(!a) return; topics.forEach(function(el){ el.classList.toggle('open',a==='open'); }); };
    function count(){ if(!cnt) return; cnt.textContent=topics.filter(function(e){return e.classList.contains('done')}).length+' of '+topics.length+' done'; }
    count();
  }

  // home page: progress per chapter
  [].slice.call(document.querySelectorAll('.prog[data-f]')).forEach(function(p){
    var f=p.dataset.f, n=0; for(var i=0;i<6;i++) if(get(f+'-'+i)==='1') n++;
    p.textContent=n+' of 6 done';
  });
  // loader (home page, once per visit)
  var g=document.getElementById('gate');
  if(g){ var seen=false; try{seen=sessionStorage.getItem('cb-in')==='1'}catch(e){}
    if(seen||matchMedia('(prefers-reduced-motion:reduce)').matches){ g.remove(); }
    else{ g.hidden=false; var num=document.getElementById('pct'), fill=document.getElementById('fill'), t0=performance.now();
      (function tick(now){ var p=Math.min(1,(now-t0)/1300); num.textContent=Math.round(p*100)+'%'; fill.style.width=p*100+'%';
        if(p<1) requestAnimationFrame(tick);
        else{ g.classList.add('out'); try{sessionStorage.setItem('cb-in','1')}catch(e){} setTimeout(function(){g.remove()},600); } })(t0); } }

  // status bar: current section and scroll percentage
  var ind=document.createElement('div'); ind.className='ind'; ind.setAttribute('aria-hidden','true');
  ind.innerHTML='<span id=where>CompBio, rev. 2026</span><span id=pc>0%</span>'; document.body.appendChild(ind);
  var where=ind.firstChild, pc=ind.lastChild;
  addEventListener('scroll',function(){ var h=document.documentElement,m=h.scrollHeight-h.clientHeight; pc.textContent=Math.round(m>0?h.scrollTop/m*100:0)+'%'; },{passive:true});
  var targets=[].slice.call(document.querySelectorAll('[data-ind]'));
  if(targets.length&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ where.innerHTML=e.target.dataset.ind; } }); },{rootMargin:'-45% 0px -45% 0px'});
    targets.forEach(function(t){io.observe(t)});
  }

  // press G for the 12-column grid
  var go=document.createElement('div'); go.className='gridov'; go.setAttribute('aria-hidden','true');
  for(var q=0;q<12;q++) go.appendChild(document.createElement('i')); document.body.appendChild(go);
  addEventListener('keydown',function(e){ if((e.key==='g'||e.key==='G')&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!e.metaKey&&!e.ctrlKey) go.classList.toggle('on'); });

  // dotted DNA helices that rotate and drift as you scroll
  var cv=document.createElement('canvas'); cv.id='dna'; cv.setAttribute('aria-hidden','true'); document.body.insertBefore(cv,document.body.firstChild);
  var cx=cv.getContext('2d'), W=0,H=0,dpr=1, busy=false;
  var HX=[{x:.03,a:.8,d:1,al:.8,t:.05,p:0},{x:.11,a:1,d:-1,al:.55,t:-.04,p:2},{x:.27,a:.9,d:1,al:.2,t:.03,p:4},{x:.5,a:1.5,d:-1,al:.14,t:0,p:1},{x:.73,a:.9,d:1,al:.2,t:-.03,p:3},{x:.89,a:1,d:-1,al:.55,t:.04,p:5},{x:.97,a:.8,d:1,al:.8,t:-.05,p:1}];
  function dot(x,y,z,col,al,r){ var k=(z+1)/2; cx.fillStyle='rgba('+col+','+(al*(.35+.65*k))+')'; cx.beginPath(); cx.arc(x,y,r||(1.3+1.3*k),0,6.2832); cx.fill(); }
  function draw(){ busy=false; var sy=window.scrollY||0, dark=root.getAttribute('data-theme')==='dark';
    cx.setTransform(dpr,0,0,dpr,0,0); cx.clearRect(0,0,W,H);
    var c1=dark?'239,238,232':getComputedStyle(root).getPropertyValue('--c').trim(), c2=dark?'154,154,146':'27,27,26';
    c1=c1.charAt(0)==='#'?parseInt(c1.slice(1,3),16)+','+parseInt(c1.slice(3,5),16)+','+parseInt(c1.slice(5,7),16):c1;
    HX.forEach(function(h){
      var amp=Math.min(64,W*.085)*h.a, step=9, v=sy*.12*h.d, base=Math.floor(v/step), off=((v%step)+step)%step;
      for(var i=0,y=-step+off;y<H+step;i++,y+=step){
        var ph=(y+sy*.35*h.d)*.04+h.p, bx=h.x*W+(y-H/2)*h.t, s=Math.sin(ph), z=Math.cos(ph);
        dot(bx+amp*s,y,z,c1,h.al); dot(bx-amp*s,y,-z,c2,h.al*.8);
        if((((i-base)%3)+3)%3===0){ for(var k=1;k<7;k++) dot(bx+amp*s*(1-2*k/7),y,0,c2,h.al*.4,.9); }
      } }); }
  function req(){ if(!busy){ busy=true; requestAnimationFrame(draw); } }
  function size(){ dpr=Math.min(2,window.devicePixelRatio||1); W=innerWidth; H=innerHeight; cv.width=W*dpr; cv.height=H*dpr; cv.style.width=W+'px'; cv.style.height=H+'px'; req(); }
  window.__dna=req; addEventListener('scroll',req,{passive:true}); addEventListener('resize',size); size();
})();
