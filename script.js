(function(){
  var root=document.documentElement,K='cb-';
  function get(k){try{return localStorage.getItem(K+k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(K+k,v)}catch(e){}}
  var t=get('theme'); if(t) root.setAttribute('data-theme',t);

  // theme toggle
  var nav=document.querySelector('nav'), tb=document.createElement('button');
  tb.textContent='Theme'; tb.setAttribute('aria-label','Toggle light or dark theme');
  tb.onclick=function(){
    var dark=root.getAttribute('data-theme')==='dark'||(!root.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);
    var n=dark?'light':'dark'; root.setAttribute('data-theme',n); set('theme',n);
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
    function count(){ cnt.textContent=topics.filter(function(e){return e.classList.contains('done')}).length+' of '+topics.length+' done'; }
    count();
  }

  // home page: show progress on each unit card
  [].slice.call(document.querySelectorAll('a.card')).forEach(function(c){
    var f=c.getAttribute('href'), n=0;
    for(var i=0;i<6;i++) if(get(f+'-'+i)==='1') n++;
    var p=document.createElement('span'); p.className='prog'; p.textContent=n+' of 6 done'; c.appendChild(p);
  });
})();
