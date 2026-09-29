/* clean URLs: someone who lands on /about.html sees /about (index.html -> /) */
(function () {
  var p = location.pathname;
  if (!/\.html$/i.test(p) || /\/(google[^/]*|404)\.html$/i.test(p)) return;
  var c = p.replace(/(^|\/)index\.html$/i, '$1').replace(/\.html$/i, '');
  try { history.replaceState(history.state, '', c + location.search + location.hash); } catch (e) {}
})();
(function(){
  document.documentElement.classList.add('js');
  // Skip-to-content link (accessibility)
  var skip = document.createElement('a');
  skip.href = '#et-main-area';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to content';
  document.body.insertBefore(skip, document.body.firstChild);

  // Header scroll: shadow + auto-hide on scroll down, reveal on scroll up
  var header = document.getElementById('main-header');
  var lastY = window.scrollY;
  function updateHeader(){
    var y = window.scrollY;
    if(y > 10){ header.classList.add('et-fixed-header'); }
    else { header.classList.remove('et-fixed-header'); }
    if(document.body.classList.contains('mobile-nav-open')){
      header.classList.remove('header-hidden');
      lastY = y; return;
    }
    if(y > 180 && y > lastY + 4){
      header.classList.add('header-hidden');
    } else if(y < lastY - 4 || y <= 10){
      header.classList.remove('header-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', updateHeader, {passive:true});
  updateHeader();

  // Hamburger toggle with aria-expanded
  var hamburgerBtn = document.getElementById('mobile-menu-btn');
  if(hamburgerBtn){
    hamburgerBtn.addEventListener('click', function(){
      var isOpen = document.body.classList.toggle('mobile-nav-open');
      this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      this.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
  }

  // Close mobile nav on link click
  document.querySelectorAll('#top-menu a').forEach(function(a){
    a.addEventListener('click', function(){
      document.body.classList.remove('mobile-nav-open');
      if(hamburgerBtn){
        hamburgerBtn.setAttribute('aria-expanded','false');
        hamburgerBtn.setAttribute('aria-label','Open navigation');
      }
    });
  });

  // Scroll-reveal — animate sections into view
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var srSelectors = [
    '.pillar-card','.partner-card','.event-card','.value-card',
    '.service-category','.coaching-package','.team-card','.team-member',
    '.interview-grid','.stats-bar','.countdown-section',
    '.et_pb_section','.et_pb_section_grey',
    '.featured-wrap','.isabelle-section','.contact-grid',
    '.section-head','.page-intro','.mission-card',
    '.newsletter-section','.blurb-item','.clients-section',
  ];
  if(!prefersReducedMotion){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    srSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el,i){
        el.classList.add('sr');
        if(i<4) el.classList.add('sr-d'+(i+1));
        observer.observe(el);
      });
    });
  }

  // Safety net: never leave content invisible if the observer stalls (hidden tab, zoom, extension)
  setTimeout(function(){
    document.querySelectorAll('.sr:not(.visible)').forEach(function(el){ el.classList.add('visible'); });
  }, 1400);

  // Parallax — disable on mobile or when user prefers reduced motion
  var isMobile = window.matchMedia('(max-width:980px)').matches;
  var parallaxBg = document.getElementById('parallax-bg');
  if(parallaxBg && !prefersReducedMotion && !isMobile){
    window.addEventListener('scroll', function(){
      parallaxBg.style.transform = 'translateY(' + (window.scrollY * .28) + 'px)';
    }, {passive:true});
  }
})();

/* ── Floating WhatsApp button + website-aware assistant ─────── */
(function(){
  var WA = 'https://wa.me/818065151778?text=' + encodeURIComponent("Hi BHD Asia, I'd like to know more about your services.");

  // Suggestion pool — rotates randomly so repeats are minimised
  var ALL_SUG = [
    'What services do you offer?',
    'TRE™ workshops',
    'Pricing & packages',
    'Upcoming events',
    'How to book a session',
    'About BHD Asia',
    'Who is Isabelle?',
    'Stress & burnout support',
    'Tell me about coaching',
    'Conflict resolution',
    'Partner organisations',
    'Is there online support?',
    'How does it work?',
    'Where are you located?'
  ];
  var usedSug = [];

  function freshSuggestions(){
    var available = ALL_SUG.filter(function(s){ return usedSug.indexOf(s) === -1; });
    if(available.length < 5){ usedSug = []; available = ALL_SUG.slice(); }
    for(var i = available.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = available[i]; available[i] = available[j]; available[j] = tmp;
    }
    var picked = available.slice(0, 5);
    picked.forEach(function(s){ usedSug.push(s); });
    return picked;
  }

  // Knowledge base — single-word exact matches first, then broader topic patterns
  var KB = [

    // ── Single-word / short exact-match handlers ──────────────
    {
      re:/^how$/,
      a:"Happy to help! Are you asking about <strong>how to book</strong>, <strong>how our sessions work</strong>, or <strong>how much it costs</strong>? Tap a topic below or just type.",
      btns:[{t:'How to Book',u:'contact'},{t:'Pricing',u:'services'},{t:'Our Approach',u:'about'}]
    },
    {
      re:/^(who|whose)$/,
      a:"We're <strong>BHD Asia</strong> (Business and Human Development Consulting Pte Ltd) — led by <strong>Isabelle Claus Teixeira</strong>, 27+ years in HR &amp; coaching.",
      btns:[{t:'Meet the Team',u:'about'},{t:'About Isabelle',u:'isabelle'}]
    },
    {
      re:/^what$/,
      a:"We offer <strong>Organisation Development</strong>, <strong>Resilience Building</strong> (incl. TRE™), and <strong>Individual Coaching</strong>. What area interests you?",
      btns:[{t:'All Services',u:'services'},{t:'TRE™ Workshops',u:'events'}]
    },
    {
      re:/^why$/,
      a:"<strong>Why BHD Asia?</strong> We co-design bespoke solutions — not off-the-shelf programmes. 27+ years across 9 countries, blending executive coaching, somatic methods, and real HR expertise.",
      btns:[{t:'Our Story',u:'about'},{t:'Book a Free Call',u:'contact'}]
    },
    {
      re:/^(help|\?+|start|menu|topics?|options?)$/,
      a:"Here's what I can help with:<br>• <strong>Services</strong> — what we offer<br>• <strong>TRE™ workshops</strong> — dates &amp; pricing<br>• <strong>Coaching</strong> — executive &amp; career<br>• <strong>Events</strong> — upcoming workshops<br>• <strong>Team</strong> — about Isabelle<br>• <strong>Location &amp; online</strong> — where we work<br>• <strong>Contact</strong> — how to reach us<br><br>Just type any topic!",
      btns:[{t:'Services',u:'services'},{t:'Events',u:'events'},{t:'Contact',u:'contact'}]
    },
    {
      re:/^(yes|yeah|yep|yup|ok|okay|sure|go ahead|sounds good)$/,
      a:"Great! What would you like to know? Ask about our <strong>services</strong>, <strong>pricing</strong>, <strong>TRE™ workshops</strong>, or how to <strong>book a session</strong>.",
      btns:[{t:'Services',u:'services'},{t:'Events',u:'events'},{t:'Contact',u:'contact'}]
    },
    {
      re:/^(no|nope|nah|not now|later)$/,
      a:"No problem at all! Feel free to come back anytime. You can always reach us at <a href='mailto:isabelle@bhdasia.com'>isabelle@bhdasia.com</a>.",
      btns:[]
    },

    // ── Topic handlers ────────────────────────────────────────
    {
      re:/(service|services|offer|offering|programme|programs?|help with|what do you|what you do|specialise|specialize|expertise|capabilities?|solutions?)/,
      a:"We focus on three areas: <strong>Organisation Development</strong>, <strong>Resilience Building</strong> (TRE™, somatic coaching, stress &amp; burnout), and <strong>Individual Development</strong> (executive, career &amp; transition coaching). Each solution is co-designed with you.",
      btns:[{t:'View All Services',u:'services'},{t:'Book a Free Call',u:'contact'}]
    },
    {
      re:/(\btre\b|tension|trauma|somatic|tremor|neurogenic|releasing exercise|nervous system|body.?based|bodywork)/,
      a:"<strong>TRE™ (Tension &amp; Trauma Releasing Exercises)</strong> is a neurogenic method that helps the body release deep muscle tension and stress without detailed discussion of past events. We run open workshops — Module 1 (personal use) and Modules 2/3 (provider certification).",
      btns:[{t:'See TRE™ Events',u:'events'},{t:'Enquire Now',u:'contact'}]
    },
    {
      re:/(event|events|workshop|workshops|upcoming|module|when|next date|schedule|calendar|dates?|availability|timetable|course|training|certif)/,
      a:"Our next workshops: <strong>TRE™ for Personal Use (Module 1)</strong> — <strong>29–30 Aug 2026</strong>, and <strong>TRE™ Certification (Module 2)</strong> — 26–27 Sep 2026. Both in-person, Singapore.",
      btns:[{t:'View All Events',u:'events'},{t:'Reserve a Spot',u:'contact'}]
    },
    {
      re:/(price|pricing|cost|fee|how much|rate|sgd|dollar|package|invest|money|budget|afford|pay|payment)/,
      a:"The 2026 TRE™ certification intake is closed. The <strong>2027 Singapore cohort</strong> opens with Module 1 on 27–28 February 2027, co-taught by Isabelle Claus Teixeira and Simba Stenqvist, with <strong>early-bird pricing until 31 December 2026</strong>. Our 8-week individual coaching package is <strong>SGD 2,200</strong>. Group and corporate rates on request.",
      btns:[{t:'Full Pricing',u:'services'},{t:'Ask About Rates',u:'contact'}]
    },
    {
      re:/(contact|email|phone|call|reach|whatsapp|enquire|inquire|message|get in touch|speak|talk|connect)/,
      a:"You can reach us by email at <a href='mailto:isabelle@bhdasia.com'>isabelle@bhdasia.com</a>, call or WhatsApp <strong>+81 80 6515 1778</strong>, or fill in our online contact form.",
      btns:[{t:'Contact Form',u:'contact'}]
    },
    {
      re:/(location|where|address|office|located|based|singapore|raffles|online|virtual|remote|in.?person|hybrid)/,
      a:"Based at <strong>50 Raffles Place, Singapore Land Tower #30-00, Singapore 048623</strong>. We also work remotely with clients across Asia Pacific, Japan, Europe, and beyond.",
      btns:[{t:'Contact Us',u:'contact'},{t:'About BHD Asia',u:'about'}]
    },
    {
      re:/(isabelle|founder|who runs|co.?founder|director|team|staff|people|credentials?|qualif)/,
      a:"<strong>Isabelle Claus Teixeira</strong> is our founder — 27+ years in HR leadership across 9 countries, certified coach since 2012, TRE™ provider, and Forbes Coaches Council contributor.",
      btns:[{t:'Meet Isabelle',u:'isabelle'},{t:'Our Team',u:'about#team'}]
    },
    {
      re:/(resilience|resilient|stress|burnout|burn.?out|anxiety|overwhelm|wellbeing|well.?being|mental.?health|pressure|fatigue|exhaust|psychological.?safety)/,
      a:"Our <strong>Resilience Building</strong> programmes include TRE™ (neurogenic stress release), somatic coaching, burnout prevention, stress management, and psychological safety workshops.",
      btns:[{t:'Resilience Services',u:'services'},{t:'TRE™ Events',u:'events'}]
    },
    {
      re:/(hr|human.?resource|talent|organisat|organizat|culture|change.?management|facilitat|corporate|leadership.?develop|workforce)/,
      a:"Our <strong>Organisation Development</strong> practice covers HR &amp; Talent Management advisory, high-performing team facilitation, culture transformation, leadership development, and change management.",
      btns:[{t:'Org Development',u:'services'},{t:'Talk to Us',u:'contact'}]
    },
    {
      re:/(mediat|conflict|dispute|disagree|difficult.?conversation|resolution|simi)/,
      a:"We facilitate <em>Challenging Conversations &amp; Constructive Conflict</em> workshops and support leaders and teams with professional conflict resolution.",
      btns:[{t:'Our Services',u:'services'},{t:'Book a Consult',u:'contact'}]
    },
    {
      re:/(about|company|bhd|background|history|who are you|what is bhd|mission|values?|philosophy|approach|methodology|how.*work|how does)/,
      a:"<strong>BHD Asia</strong> is a boutique HR consulting, executive coaching and leadership development firm. Founded in Singapore in 2012, we co-design bespoke solutions for clients across Asia Pacific and globally.",
      btns:[{t:'About Us',u:'about'},{t:'Our Services',u:'services'}]
    },
    {
      re:/(book|booking|appointment|sign.?up|register|enrol|enroll|reserve|1.?on.?1|one.?on.?one|free call|consult|discovery|get started|next step|how do i|how to)/,
      a:"To book, use our <a href='contact'>Contact form</a> or WhatsApp <strong>+81 80 6515 1778</strong> to schedule a free discovery conversation — no commitment needed.",
      btns:[{t:'Book a Free 1:1',u:'contact'}]
    },
    {
      re:/(coaching|executive.?coach|leadership.?coach|career.?coach|transition.?coach|performance.?coach|life.?coach|personal.?develop|growth|goal)/,
      a:"Our coaching covers <strong>Executive Coaching</strong>, <strong>Transition Coaching</strong>, <strong>Performance Coaching</strong>, <strong>Career Coaching</strong>, Self-Awareness Development, and 360° Debriefs — all fully co-designed.",
      btns:[{t:'Coaching Services',u:'services'},{t:'Book a Consult',u:'contact'}]
    },
    {
      re:/(partner|associate|network|client|clients|who.*(work|worked)|companies|testimonial|review|results|forbes|icf|noomii)/,
      a:"We've worked with ByteDance (TikTok), Novartis, Philips, VISA, Mastercard, Heineken APAC, and more. Isabelle is a Forbes Coaches Council contributor and ICF-certified coach.",
      btns:[{t:'Our Partners',u:'partners'},{t:'Our Story',u:'about'}]
    },
    {
      re:/(^(hi|hello|hey|hiya|greetings|yo|howdy|sup)$|^good (morning|afternoon|evening)|how are you)/,
      a:"Hello! I'm the BHD Asia assistant 👋 I can help with services, TRE™ workshops, pricing, events, our team, and how to get in touch. What would you like to know?",
      btns:[]
    },
    {
      re:/(thank|thanks|cheers|appreciate|great|perfect|helpful|awesome|wonderful)/,
      a:"You're very welcome! Feel free to ask anything else, or reach us at <a href='mailto:isabelle@bhdasia.com'>isabelle@bhdasia.com</a>.",
      btns:[]
    },
    {re:/(bye|goodbye|see you|farewell|that.?s all)/, a:"Thanks for visiting BHD Asia. Have a wonderful day! 😊", btns:[]}
  ];

  var FALLBACK_A = "I can help with our <strong>services</strong>, <strong>TRE™ workshops</strong>, <strong>pricing</strong>, <strong>events</strong>, <strong>location</strong> and <strong>contact</strong>. For anything specific, reach Isabelle at <a href='mailto:isabelle@bhdasia.com'>isabelle@bhdasia.com</a> or WhatsApp +81 80 6515 1778.";
  var FALLBACK_BTNS = [{t:'Services',u:'services'},{t:'Events',u:'events'},{t:'Contact Us',u:'contact'}];

  function answerFor(raw){
    var t = raw.toLowerCase().replace(/['".,!?;:()–—]/g,' ').replace(/\s+/g,' ').trim();
    if(!t) t = raw.toLowerCase().trim();
    for(var i=0;i<KB.length;i++){
      if(KB[i].re.test(t)) return {a:KB[i].a, btns:KB[i].btns};
    }
    // Short unrecognised input — echo the word and redirect helpfully
    if(t.length <= 25){
      return {
        a:"I'm not sure about <em>\"" + esc(raw.trim().substring(0,40)) + "\"</em> — try asking about <strong>services</strong>, <strong>pricing</strong>, <strong>TRE™ workshops</strong>, <strong>events</strong>, or <strong>contact</strong>.",
        btns:[{t:'Services',u:'services'},{t:'Events',u:'events'},{t:'Contact',u:'contact'}]
      };
    }
    return {a:FALLBACK_A, btns:FALLBACK_BTNS};
  }

  // FAB
  var fab = document.createElement('div');
  fab.id = 'bhd-fab';
  fab.innerHTML =
    '<a class="bhd-fab-btn bhd-wa" href="' + WA + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .4C7.4.4.5 7.3.5 15.9c0 2.8.7 5.5 2.1 7.9L.3 31.6l8-2.1c2.3 1.3 4.9 1.9 7.7 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.4 16 .4zm0 28.3c-2.5 0-4.9-.7-7-1.9l-.5-.3-4.7 1.2 1.3-4.6-.3-.5c-1.4-2.2-2.1-4.7-2.1-7.2C2.9 8.6 8.8 2.8 16 2.8s13.1 5.8 13.1 13.1S23.2 28.7 16 28.7zm7.2-9.8c-.4-.2-2.3-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.2-.5.3-.9.1-.4-.2-1.6-.6-3.1-1.9-1.2-1-1.9-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.1-.3.1-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.7-.6-.6-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.3 2.8 4.3 6.8 6 .9.4 1.7.6 2.3.8.9.3 1.8.2 2.5.2.8-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.3-.3-.7-.4z"/></svg></a>' +
    '<button class="bhd-fab-btn bhd-chat-toggle" aria-label="Open chat assistant" title="Chat with us"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>';
  document.body.appendChild(fab);

  // Chat panel
  var chat = document.createElement('div');
  chat.id = 'bhd-chat';
  chat.className = 'bhd-chat-closed';
  chat.setAttribute('role','dialog');
  chat.setAttribute('aria-label','BHD Asia assistant');
  chat.innerHTML =
    '<div class="bhd-chat-head"><div class="bhd-chat-head-info"><span class="bhd-chat-title">BHD Asia Assistant</span><span class="bhd-chat-status"><span class="bhd-status-dot"></span>Typically replies instantly</span></div><button class="bhd-chat-close" aria-label="Close chat">×</button></div>' +
    '<div class="bhd-chat-msgs" id="bhd-chat-msgs"></div>' +
    '<div class="bhd-chat-quick" id="bhd-chat-quick"></div>' +
    '<form class="bhd-chat-input" id="bhd-chat-form"><input type="text" id="bhd-chat-text" placeholder="Ask about our services…" autocomplete="off"/><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></form>';
  document.body.appendChild(chat);

  var msgs = chat.querySelector('#bhd-chat-msgs');
  var quick = chat.querySelector('#bhd-chat-quick');
  var form = chat.querySelector('#bhd-chat-form');
  var input = chat.querySelector('#bhd-chat-text');
  var toggle = fab.querySelector('.bhd-chat-toggle');
  var closeBtn = chat.querySelector('.bhd-chat-close');
  var greeted = false;

  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function addUserMsg(text){
    var d = document.createElement('div');
    d.className = 'bhd-msg bhd-msg-user';
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addBotMsg(result){
    var d = document.createElement('div');
    d.className = 'bhd-msg bhd-msg-bot';
    var html = '<div class="bhd-msg-label">BHD Asia</div>' + result.a;
    if(result.btns && result.btns.length){
      html += '<div class="bhd-msg-btns">' +
        result.btns.map(function(b){
          return '<a href="' + b.u + '" class="bhd-msg-btn">' + b.t + '</a>';
        }).join('') + '</div>';
    }
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderSuggestions(){
    quick.innerHTML = '';
    freshSuggestions().forEach(function(q){
      var b = document.createElement('button');
      b.className = 'bhd-quick-btn';
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function(){ send(q); });
      quick.appendChild(b);
    });
  }

  function botReply(text){
    var typing = document.createElement('div');
    typing.className = 'bhd-chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(function(){
      if(typing.parentNode) typing.parentNode.removeChild(typing);
      addBotMsg(answerFor(text));
      renderSuggestions();
    }, 600);
  }

  function send(text){
    text = (text || '').trim();
    if(!text) return;
    addUserMsg(text);
    botReply(text);
  }

  renderSuggestions();

  function openChat(){
    chat.classList.remove('bhd-chat-closed');
    if(!greeted){ greeted = true; botReply('hello'); }
    setTimeout(function(){ input.focus(); }, 250);
  }
  function closeChat(){ chat.classList.add('bhd-chat-closed'); }

  toggle.addEventListener('click', function(){
    if(chat.classList.contains('bhd-chat-closed')) openChat(); else closeChat();
  });
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = input.value;
    input.value = '';
    send(v);
  });
})();

/* ===== Featured events + countdowns: single source of truth =====
   Every page reads this list. An event whose start time has passed, or with
   soldOut:true, is skipped automatically everywhere: the homepage featured
   cards, the events-page countdown and every event-page countdown roll over
   to the next active event on their own. To close an event set soldOut:true;
   to add one, add an entry (keep the list in date order). */
(function(){
  var EVENTS=[
    {id:'module1-singapore',page:'event-module1-singapore',start:'2026-08-29T10:00:00+08:00',soldOut:true,
     cdTitle:'Nervous System Regulation &amp; Neurogenic Tremoring &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 29&ndash;30 August 2026 &middot; In-Person &middot; Singapore',
     link:'event-module1-singapore',linkText:'View Event'},
    {id:'internal-alchemy',page:'event-internal-alchemy',start:'2026-09-01T19:00:00+08:00',soldOut:false,
     cdTitle:'Internal Alchemy &middot; Introductory Workshop &middot; Singapore',
     cdMeta:'Tuesday, 1 September 2026 &middot; 7&ndash;9PM &middot; Nilayam Ashtanga Studio, Singapore',
     link:'event-internal-alchemy',linkText:'View Event',
     card:{img:'event-internal-alchemy.webp?v=2',alt:'Internal Alchemy &mdash; Introductory Workshop with Simba Stenqvist',
       tag:'First Time in Singapore',date:'1 September 2026 &nbsp;&middot;&nbsp; 7&ndash;9PM &middot; In-Person &middot; Singapore',
       title:'Internal Alchemy &mdash; Introductory Workshop',
       desc:'Breathwork, fascial release, grounding and tremor work in one integrated system &mdash; led by Simba Stenqvist, creator of Internal Alchemy and Global TRE&trade; Certifying Trainer. S$79.',
       venue:'Nilayam Ashtanga Studio',url:'event-internal-alchemy#register',cta:'Register'}},
    {id:'shaking-online-sep3',page:'event-shaking-shaping-sep3',start:'2026-09-03T19:00:00+08:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Live Online Session',
     cdMeta:'Thursday, 3 September 2026 &middot; 7&ndash;9PM &middot; Online',
     link:'event-shaking-shaping-sep3',linkText:'View Event'},
    {id:'cert-module2',page:'event-certification',start:'2026-09-26T10:00:00+08:00',soldOut:true,
     cdTitle:'TRE&trade; Provider Certification &middot; Module 2 &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 26&ndash;27 September 2026 &middot; In-Person &middot; Singapore',
     link:'event-certification#register',linkText:'Register Now',
     card:{img:'event-module2.webp?v=4',alt:'TRE&trade; Provider Certification &mdash; Module 2, 26&ndash;27 September 2026, Singapore',
       tag:'Certification &middot; Singapore',date:'26&ndash;27 September 2026 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'TRE&trade; Provider Certification &mdash; Module 2',
       desc:'The certification journey continues &mdash; Module 2 of the Global TRE&trade; Provider Certification with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer. The 2026 intake is now closed — the next cohort runs in 2027.',
       venue:'Singapore',url:'event-certification#register',cta:'Register'}},
    {id:'body-in-the-room',page:'event-body-in-the-room',start:'2026-11-25T19:00:00+08:00',soldOut:false,
     cdTitle:'The Body in the Room &middot; Aun Ali',
     cdMeta:'Wednesday, 25 November 2026 &middot; 7PM SGT &middot; Live Online',
     link:'event-body-in-the-room',linkText:'View Event',
     card:{img:'event-body-in-the-room.webp',alt:'The Body in the Room &mdash; Aun Ali, 25 November 2026',
       tag:'Live Online',date:'25 November 2026 &nbsp;&middot;&nbsp; 7PM SGT &middot; Live Online',
       title:'The Body in the Room',
       desc:'Integrating TRE&trade; and somatic practice into psychotherapy &mdash; a trauma-informed online workshop with Aun Ali for psychologists, counsellors and narrative therapists.',
       venue:'Online',url:'event-body-in-the-room',cta:'Details'}},
    {id:'feminine-masculine',page:'event-feminine-masculine',start:'2026-10-28T19:00:00+08:00',soldOut:false,
     cdTitle:'Navigating Feminine &amp; Masculine Energetics &middot; Sara Marie',
     cdMeta:'Wednesday, 28 October 2026 &middot; 7&ndash;9:30PM SGT &middot; Live Online',
     link:'event-feminine-masculine',linkText:'View Event',
     card:{img:'event-feminine-masculine.webp?v=2',alt:'Navigating Feminine &amp; Masculine Energetics &mdash; Sara Marie, 28 October 2026',
       tag:'Live Online',date:'28 October 2026 &nbsp;&middot;&nbsp; 7&ndash;9:30PM SGT &middot; Live Online',
       title:'Navigating Feminine &amp; Masculine Energetics',
       desc:'A live online workshop with Sara Marie &mdash; The Alchemist. Alchemising the pressure of masculine corporate structures into liberation, ease and personal power.',
       venue:'Online',url:'event-feminine-masculine',cta:'Details'}},
    {id:'shaking-oct8',page:'event-shaking-shaping-oct8',start:'2026-10-08T19:00:00+08:00',soldOut:false,
     cdTitle:'From Shaking to Shaping &middot; Live Online Session',
     cdMeta:'Thursday, 8 October 2026 &middot; 7&ndash;9PM &middot; Live Online',
     link:'event-shaking-shaping-oct8',linkText:'View Event',
     card:{img:'event-shaking-oct8.webp?v=2',alt:'From Shaking to Shaping &mdash; live online session, 8 October 2026',
       tag:'Live Online',date:'8 October 2026 &nbsp;&middot;&nbsp; 7&ndash;9PM &middot; Live Online',
       title:'From Shaking to Shaping &mdash; Live Online Session',
       desc:'Use of TRE&trade; in a coaching context &mdash; one evening online with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer, and Saymara Ryon, President of Asocia&#539;ia TRE&trade; Rom&acirc;nia.',
       venue:'Online',url:'event-shaking-shaping-oct8',cta:'Details'}},
    {id:'module1-bucharest',page:'event-module1-bucharest',start:'2026-10-15T17:00:00+03:00',soldOut:true,
     cdTitle:'TRE&trade; Module 1 Bucharest &middot; 15 October 2026',
     cdMeta:'Thursday, 15 October 2026 &middot; Introductory Evening 17:00&ndash;19:00 EET &middot; Bucharest',
     link:'event-module1-bucharest',linkText:'View Event',
     card:{img:'event-bucharest-module1.webp?v=4',alt:'TRE&trade; Module 1 &mdash; Bucharest, Romania, 15&ndash;17 October 2026',
       tag:'21 ICF CCEUs',date:'15&ndash;17 October 2026 &nbsp;&middot;&nbsp; In-Person &middot; Bucharest',
       title:'TRE&trade; Module 1 &mdash; Bucharest, Romania',
       desc:'An immersive 3-day certification training &mdash; the first in Europe in English. Valid as Module 1 of the Global TRE&trade; Provider Certification Program. 21 ICF CCEUs. From &euro;739.',
       venue:'Bucharest, Rom&acirc;nia',url:'event-module1-bucharest',cta:'Details'}},
    {id:'shaking-bucharest-1',page:'event-shaking-shaping',start:'2026-10-20T10:00:00+03:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Bucharest &middot; 20 October 2026',
     cdMeta:'Tuesday, 20 October 2026 &middot; In-Person &middot; Bucharest, Rom&acirc;nia',
     link:'event-shaking-shaping',linkText:'View Event',
     card:{img:'event-shaking-shaping.webp?v=4',alt:'From Shaking to Shaping &mdash; Isabelle Claus Teixeira and Saymara Ryon, Bucharest',
       tag:'Isabelle &amp; Saymara',date:'20 &amp; 24 October 2026 &nbsp;&middot;&nbsp; In-Person &middot; Bucharest',
       title:'From Shaking to Shaping &mdash; Bucharest',
       desc:'Use of TRE&trade; in a coaching context &mdash; half-day in-person intensives in Bucharest, co-led by Isabelle Claus Teixeira and Saymara Ryon, President of Asocia&#539;ia TRE&trade; Rom&acirc;nia. From &euro;97.',
       venue:'Bucharest',url:'event-shaking-shaping',cta:'Details'}},
    {id:'shaking-bucharest-2',page:'event-shaking-shaping',start:'2026-10-24T10:00:00+03:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Bucharest &middot; 24 October 2026',
     cdMeta:'Saturday, 24 October 2026 &middot; In-Person &middot; Bucharest, Rom&acirc;nia',
     link:'event-shaking-shaping',linkText:'View Event'},
    {id:'cert-module3',page:'event-certification',start:'2027-02-20T10:00:00+08:00',soldOut:true,
     cdTitle:'TRE&trade; Provider Certification &middot; Module 3 &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 20&ndash;21 February 2027 &middot; In-Person &middot; Singapore',
     link:'event-certification#register',linkText:'Register Now',
     card:{img:'event-module2.webp?v=4',alt:'TRE&trade; Provider Certification &mdash; Module 3, 20&ndash;21 February 2027, Singapore',
       tag:'Certification &middot; Singapore',date:'20&ndash;21 February 2027 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'TRE&trade; Provider Certification &mdash; Module 3',
       desc:'The final module of the Global TRE&trade; Provider Certification &mdash; certification weekend with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer. The 2026 intake is now closed.',
       venue:'Singapore',url:'event-certification#register',cta:'Register'}},
    {id:'cert-2027',page:'event-certification-2027',start:'2027-02-27T09:00:00+08:00',soldOut:false,
     cdTitle:'Become a Certified TRE&trade; Provider &middot; 2027 Cohort &middot; Singapore',
     cdMeta:'Module 1: 27&ndash;28 February 2027 &middot; In-Person &middot; Singapore',
     link:'event-certification-2027#register',linkText:'Register Now',
     card:{img:'event-cert-2027.webp?v=4',alt:'Become a Certified TRE&trade; Provider &mdash; 2027 Cohort, Singapore',
       tag:'Certification &middot; 2027',date:'Feb&ndash;Oct 2027 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'Become a Certified TRE&trade; Provider &mdash; 2027 Cohort',
       desc:'The 2027 Singapore cohort of the Global TRE&trade; Provider Certification &mdash; co-taught by Isabelle Claus Teixeira &amp; Simba Stenqvist. Module 1: 27&ndash;28 Feb, Module 2: 3&ndash;4 Jul, Module 3: 30&ndash;31 Oct 2027, plus online supervisions and three bonus programs. From S$5,888 early bird.',
       venue:'Singapore',url:'event-certification-2027',cta:'Details'}}
  ];
  window.BHD_EVENTS=EVENTS;

  var CAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function activeEvents(){
    var now=new Date(),out=[],i;
    for(i=0;i<EVENTS.length;i++){
      if(!EVENTS[i].soldOut&&new Date(EVENTS[i].start)>now)out.push(EVENTS[i]);
    }
    out.sort(function(a,b){return new Date(a.start)-new Date(b.start)});
    return out;
  }
  var pageFile=((location.pathname.split('/').pop()||'index').replace(/\.html$/i,'')||'index').toLowerCase();

  /* --- Homepage featured cards: always the next two active events --- */
  var homeGrid=document.querySelector('.home-events-grid');
  if(homeGrid){
    var hl=activeEvents(),seen={},feat=[],h;
    for(h=0;h<hl.length&&feat.length<2;h++){
      if(hl[h].card&&!seen[hl[h].page]){seen[hl[h].page]=1;feat.push(hl[h]);}
    }
    if(feat.length){
      homeGrid.innerHTML=feat.map(function(e){
        var c=e.card,ext=/^https?:/i.test(c.url)?' target="_blank" rel="noopener"':'';
        return '<div class="home-evt-card">'
          +'<div class="hec-img"><img src="'+c.img+'" alt="'+c.alt+'" width="1920" height="1080" loading="lazy"/></div>'
          +'<div class="hec-body">'
          +'<span class="hec-tag">'+c.tag+'</span>'
          +'<div class="hec-date">'+CAL+c.date+'</div>'
          +'<h3>'+c.title+'</h3>'
          +'<p>'+c.desc+'</p>'
          +'<div class="hec-footer">'
          +'<span class="hec-meta">'+PIN+c.venue+'</span>'
          +'<a class="et_pb_button" href="'+c.url+'"'+ext+'>'+c.cta+' &rarr;</a>'
          +'</div></div></div>';
      }).join('');
    }else{
      homeGrid.innerHTML='<div class="home-evt-card"><div class="hec-body"><span class="hec-tag">Upcoming Events</span><h3>New dates coming soon</h3><p>New workshops and certification dates are announced here first &mdash; check back soon.</p><div class="hec-footer"><span class="hec-meta"></span><a class="et_pb_button" href="events">View All Events &rarr;</a></div></div></div>';
    }
  }

  /* --- Countdown: any page with an #event-countdown block --- */
  var timerEl=document.getElementById('event-countdown');
  if(timerEl&&timerEl.closest){
    var section=timerEl.closest('.countdown-section,.home-countdown');
    var scope=section||document,timerId=null,hadTarget=false;
    var pad=function(n){return String(n).padStart(2,'0')};
    var setNum=function(id,val){
      var el=document.getElementById(id);
      if(!el||el.textContent===val)return;
      el.textContent=val;
      el.classList.remove('c-flip');void el.offsetWidth;el.classList.add('c-flip');
    };
    var render=function(){
      var list=activeEvents(),own=null,i;
      for(i=0;i<list.length;i++){if(list[i].page===pageFile){own=list[i];break}}
      var target=own||list[0];
      if(!target){
        if(hadTarget){timerEl.innerHTML='<p style="color:var(--blue);font-weight:700;font-size:16px;margin:0">This event has started!</p>';}
        else if(section){section.style.display='none';}
        return;
      }
      hadTarget=true;
      var tEl=scope.querySelector('.countdown-title');if(tEl)tEl.innerHTML=target.cdTitle;
      var mEl=scope.querySelector('.cd-meta-text');if(mEl)mEl.innerHTML=target.cdMeta;
      if(!own){
        var lEl=scope.querySelector('.countdown-text .section-label');if(lEl)lEl.textContent='Next Upcoming Event';
        var aEl=scope.querySelector('.countdown-text a.et_pb_button');
        if(aEl){
          aEl.innerHTML=target.linkText+' &rarr;';
          aEl.setAttribute('href',target.link);
          if(/^https?:/i.test(target.link)){aEl.setAttribute('target','_blank');aEl.setAttribute('rel','noopener');}
          else{aEl.removeAttribute('target');aEl.removeAttribute('rel');}
        }
      }
      var goal=new Date(target.start);
      var tick=function(){
        var diff=goal-new Date();
        if(diff<=0){render();return;}
        setNum('c-days',pad(Math.floor(diff/86400000)));
        setNum('c-hours',pad(Math.floor(diff%86400000/3600000)));
        setNum('c-mins',pad(Math.floor(diff%3600000/60000)));
        setNum('c-secs',pad(Math.floor(diff%60000/1000)));
        timerId=setTimeout(tick,1000);
      };
      if(timerId)clearTimeout(timerId);
      tick();
    };
    render();
  }

  /* --- Events page grid: retire cards whose event has fully passed --- */
  var eventsGrid=document.querySelector('.events-grid');
  if(eventsGrid){
    var hasFuture={},now=new Date(),g;
    for(g=0;g<EVENTS.length;g++){
      if(!EVENTS[g].soldOut&&new Date(EVENTS[g].start)>now)hasFuture[EVENTS[g].page]=true;
    }
    var pastCards=[];
    eventsGrid.querySelectorAll('.evt-card[data-evt-page]').forEach(function(cardEl){
      var p=cardEl.getAttribute('data-evt-page');
      if(hasFuture[p]||cardEl.classList.contains('is-sold')||cardEl.classList.contains('is-past'))return;
      cardEl.classList.add('is-past');
      var img=cardEl.querySelector('.ec-img');
      if(img&&!img.querySelector('.ec-soldout')){
        var b=document.createElement('span');b.className='ec-soldout';b.textContent='Event Ended';img.insertBefore(b,img.firstChild);
      }
      var fill=cardEl.querySelector('.ec-btn-fill');
      if(fill){fill.textContent='View Event';fill.setAttribute('href',p);fill.removeAttribute('target');fill.removeAttribute('rel');}
      pastCards.push(cardEl);
    });
    /* Order: available upcoming first (priority), then sold-out, then past at the very back */
    eventsGrid.querySelectorAll('.evt-card.is-sold').forEach(function(c){eventsGrid.appendChild(c);});
    pastCards.forEach(function(c){eventsGrid.appendChild(c);});
  }
})();

// ── Email a form submission straight to Isabelle (FormSubmit) ────────────────
// Called alongside the existing Google Sheet POST so every enquiry both logs
// to the sheet AND lands in isabelle@bhdasia.com's inbox.
function bhdEmailLead(data){
  try{
    data = data || {};
    var payload = {
      _subject: 'New enquiry from bhdasia.com' + (data.source ? ' — ' + data.source : ''),
      _template: 'table',
      _replyto: data.email || '',
      Name: data.name || data.fullname || '',
      Email: data.email || '',
      Phone: data.phone || '',
      Event: data.event || '',
      Enquiry: data.inquiry || '',
      Source: data.source || '',
      Message: data.message || ''
    };
    fetch('https://formsubmit.co/ajax/isabelle@bhdasia.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function(){});
  }catch(e){}
}

/* ════════════════════════════════════════════════════════════════════════
   INTERACTIVE LAYER — 2026-09-30 (ported from hummingbeing.com)
   buttons · mobile menu sheet. Styles in style.css, same heading.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function lum(rgb) {
    var m = (rgb || '').match(/[\d.]+/g); if (!m) return 1;
    var c = m.slice(0, 3).map(function (v) { v = v / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function alpha(rgb) { var m = (rgb || '').match(/[\d.]+/g); return m && m.length > 3 ? +m[3] : 1; }
  // Dark or light surface behind an element: nearest opaque background colour, else anything
  // painting an image/video (hero photos and videos count as dark).
  function onDark(el) {
    for (var e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) {
      var cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return true;
      if (e.querySelector(':scope > video, :scope > .evt-hero-img, :scope > img.hero-bg, :scope > canvas')) return true;
      if (alpha(cs.backgroundColor) > .5) return lum(cs.backgroundColor) < .35;
      if (/gradient/.test(cs.backgroundImage)) {
        var cols = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).filter(function (c) { return alpha(c) >= .5; });
        if (cols.length) { var avg = cols.reduce(function (t, c) { return t + lum(c); }, 0) / cols.length; return avg < .35; }
      }
    }
    return false;
  }

  /* ---------- buttons ---------- */
  var SEL = '.et_pb_button, .ec-btn-fill, .ec-btn-outline, .header-contact-btn';
  function setXY(b, e) {
    var r = b.getBoundingClientRect();
    b.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
  }
  function initButtons() {
    document.querySelectorAll(SEL).forEach(function (b) {
      if (b.dataset.bhdBtn) return; b.dataset.bhdBtn = '1';
      if (b.classList.contains('et_pb_button')) b.classList.add(onDark(b) ? 'on-dark' : 'on-light');
      if (b.tagName === 'A' && b.classList.contains('et_pb_button') && !b.querySelector('.btn-arr, svg')) {
        var lt = b.lastChild;
        if (lt && lt.nodeType === 3) lt.nodeValue = lt.nodeValue.replace(/\s*[→➜⟶]\s*$/, '');
        var s = document.createElement('span'); s.className = 'btn-arr'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = ARROW; b.appendChild(s);
      }
      b.addEventListener('pointerdown', function (e) { setXY(b, e); });
      if (!fine) return;
      b.addEventListener('pointerenter', function (e) { setXY(b, e); });
      if (reduce) return;
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.setProperty('--mx', (dx * .18).toFixed(1) + 'px');
        b.style.setProperty('--my', (dy * .28).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function (e) {
        setXY(b, e); b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- mobile menu sheet ---------- */
  function initMenu() {
    var btn = document.getElementById('mobile-menu-btn'), ul = document.getElementById('top-menu');
    if (!btn || !ul) return;
    if (!btn.querySelector('.mm-l')) btn.innerHTML = '<span class="mm-l"></span><span class="mm-l"></span><span class="mm-l"></span>';
    if (!ul.querySelector('.nav-extra')) {
      var li = document.createElement('li'); li.className = 'nav-extra';
      li.innerHTML =
        '<div class="ne-row">' +
          '<a href="mailto:isabelle@bhdasia.com"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>isabelle@bhdasia.com</a>' +
          '<a href="https://wa.me/818065151778" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.1 1.8.9c-.3 1-1.2 1.6-2.2 1.5-3.2-.3-6.3-3.4-6.6-6.6-.1-1 .5-1.9 1.5-2.2l.9 1.8z"/></svg>WhatsApp</a>' +
        '</div>' +
        '<div class="ne-soc">' +
          '<a href="https://www.linkedin.com/in/isabelleclausteixeira/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5v6M8 7.5h.01M11.5 16.5v-3.5a2.5 2.5 0 0 1 5 0v3.5M11.5 10.5v6"/></svg></a>' +
          '<a href="https://www.instagram.com/isabelleclausteixeira_bhd/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/></svg></a>' +
          '<a href="https://www.youtube.com/@IsabelleClausTeixeira" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5v5l4.5-2.5z"/></svg></a>' +
          '<a href="https://www.facebook.com/bhdasia/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" class="fill"><path d="M14 8.5V6.8c0-.8.5-1.3 1.3-1.3H17V2.5h-2.6C11.8 2.5 10.5 4 10.5 6.4v2.1H8v3h2.5V21.5h3.5v-10h2.6l.4-3z"/></svg></a>' +
        '</div>';
      ul.appendChild(li);
    }
    function close() {
      if (!document.body.classList.contains('mobile-nav-open')) return;
      document.body.classList.remove('mobile-nav-open');
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open navigation');
    }
    btn.addEventListener('click', function () {
      if (document.body.classList.contains('mobile-nav-open')) {
        var first = ul.querySelector('a'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) { close(); btn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) close(); });
  }

  function start() { initButtons(); initMenu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.bhdInitButtons = initButtons; // for content injected later (event grids, countdown, agents' pages)
})();

/* ════════════════════════════════════════════════════════════════════════
   EVENT PAGES (.evt-hero) INTERACTIVE LAYER — 2026-09-30 (from hummingbeing)
   Reads BHD_EVENTS (defined above) so status and related events never go stale.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  var hero = document.querySelector('.evt-hero');
  if (!hero) return;
  var body = document.body, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || document).querySelectorAll(s)); }
  var EV = window.BHD_EVENTS || [], now = Date.now();
  var here = ((location.pathname.split('/').pop()||'index').replace(/\.html$/i,'')||'index').toLowerCase();
  body.classList.add('evt-live');

  /* hero: parallax + pointer glow */
  var img = $('.evt-hero-img', hero);
  var glow = document.createElement('span'); glow.className = 'ev-glow'; glow.setAttribute('aria-hidden', 'true');
  hero.insertBefore(glow, $('.evt-hero-inner', hero));
  if (!reduce && img) {
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { tick = false; var y = window.scrollY || 0; if (y < hero.offsetHeight + 200) img.style.setProperty('--ev-py', (y * .2).toFixed(1) + 'px'); });
    }, { passive: true });
    if (fine) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--ev-gx', (x * 100).toFixed(1) + '%'); hero.style.setProperty('--ev-gy', (y * 100).toFixed(1) + '%');
      img.style.setProperty('--ev-px', ((.5 - x) * 16).toFixed(1) + 'px');
    });
  }

  /* reveals */
  var io = (!reduce && 'IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('ev-in'); io.unobserve(en.target); } });
  }, { threshold: .08, rootMargin: '0px 0px -5% 0px' }) : null;
  function mark(root) {
    ['.evt-facts-grid > *', '.evt-main > .evt-section', '.evt-sidebar > *', '.related-grid > .rel-card', '.facilitator-card', '.schedule-grid > *', '.included-list > li', '.pricing-cards > *', '.module-path > *', '.session-cards > *'].forEach(function (sel) {
      $$(sel, root).forEach(function (el) {
        if (el.classList.contains('ev-rv') || el.closest('.evt-hero')) return;
        var i = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
        el.style.setProperty('--ev-d', Math.min(i, 6) * 70 + 'ms');
        el.classList.add('ev-rv');
        if (io) io.observe(el); else el.classList.add('ev-in');
      });
    });
  }
  mark(document);
  setTimeout(function () { $$('.ev-rv:not(.ev-in)').forEach(function (el) { el.classList.add('ev-in'); }); }, 1600);

  /* status for this page */
  var mine = EV.filter(function (e) { return (e.page || '').toLowerCase() === here; });
  var live = mine.filter(function (e) { return !e.soldOut && Date.parse(e.start) > now; }).sort(function (a, b) { return Date.parse(a.start) - Date.parse(b.start); });
  var status = !mine.length ? '' : live.length ? 'upcoming' : mine.every(function (e) { return e.soldOut; }) ? 'sold' : mine.some(function (e) { return e.soldOut && Date.parse(e.start) > now; }) ? 'sold' : 'past';
  function inDays(t) { var d = Math.ceil((Date.parse(t) - Date.now()) / 864e5); return d <= 1 ? 'Starts tomorrow' : 'Starts in ' + d + ' days'; }
  var label = status === 'upcoming' ? inDays(live[0].start) : status === 'sold' ? 'Sold out' : status === 'past' ? 'This event has passed' : '';
  var badges = $('.evt-hero-top', hero);
  if (label && badges && !/sold|pass|ended|postpon/i.test(badges.textContent) && !$('.ev-status', badges)) {
    var chip = document.createElement('span'); chip.className = 'evt-badge ev-status is-' + status; chip.textContent = label; badges.appendChild(chip);
  }
  if (status === 'past' && !$('.ev-past-note')) {
    var note = document.createElement('div'); note.className = 'ev-past-note';
    note.innerHTML = '<div><p><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>This event has already taken place.</p><a href="events" class="et_pb_button btn-outline">See upcoming events</a></div>';
    var facts = $('.evt-facts'); (facts || hero).parentNode.insertBefore(note, (facts || hero).nextSibling);
  }

  /* live "other upcoming events" */
  var grid = $('.related-grid');
  var seen = {};
  var next = EV.filter(function (e) { return (e.page || '').toLowerCase() !== here && !e.soldOut && Date.parse(e.start) > now && e.card; })
    .sort(function (a, b) { return Date.parse(a.start) - Date.parse(b.start); })
    .filter(function (e) { if (seen[e.page]) return false; seen[e.page] = 1; return true; }).slice(0, 3);
  function txt(h) { var d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.trim(); }
  if (grid && next.length) {
    grid.innerHTML = '';
    next.forEach(function (e) {
      var a = document.createElement('a'); a.className = 'rel-card'; a.href = e.page;
      var ri = document.createElement('div'); ri.className = 'rel-img';
      var im = document.createElement('img'); im.src = e.card.img; im.alt = txt(e.card.alt || e.card.title); im.width = 400; im.height = 220; im.loading = 'lazy'; im.decoding = 'async';
      ri.appendChild(im); a.appendChild(ri);
      var b = document.createElement('div'); b.className = 'rel-body';
      var st = document.createElement('strong'); st.textContent = txt(e.card.title);
      var sp = document.createElement('span'); sp.textContent = txt(e.card.date).replace(/\s*·\s*/g, ' · ');
      var w = document.createElement('span'); w.className = 'ev-rel-when'; w.textContent = inDays(e.start);
      b.appendChild(st); b.appendChild(sp); b.appendChild(w); a.appendChild(b); grid.appendChild(a);
    });
    var sec = grid.parentNode;
    if (!$('.ev-rel-all', sec)) { var p = document.createElement('p'); p.className = 'ev-rel-all'; p.innerHTML = '<a href="events" class="et_pb_button btn-outline">See all events</a>'; sec.appendChild(p); }
    mark(sec);
  }

  /* phone booking bar */
  var cta = $('.evt-hero-ctas a.et_pb_button');
  if (cta && status !== 'past' && status !== 'sold') {
    var bar = document.createElement('div'); bar.className = 'ev-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Book this event');
    var t = document.createElement('div'); t.className = 'ev-bar-t';
    var h1 = $('h1', hero), bb = document.createElement('b'); bb.textContent = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : document.title;
    var bs = document.createElement('span'); bs.textContent = label || '';
    t.appendChild(bb); t.appendChild(bs); bar.appendChild(t);
    var btn = cta.cloneNode(true); btn.removeAttribute('id'); delete btn.dataset.bhdBtn; btn.classList.remove('on-dark', 'on-light', 'btn-white', 'btn-white-outline'); $$('.btn-arr', btn).forEach(function (x) { x.remove(); });
    var lbl = btn.textContent.replace(/[→\s]+$/, '').trim();
    if (lbl.length > 16) btn.textContent = /zoom/i.test(lbl) ? 'Join on Zoom' : /waitlist/i.test(lbl) ? 'Waitlist' : 'Register';
    bar.appendChild(btn); body.appendChild(bar);
    var heroOut = false, blockers = 0, seenMap = new Map();
    function upd() { body.classList.toggle('ev-bar-on', heroOut && blockers === 0); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; upd(); }).observe(hero);
      var bo = new IntersectionObserver(function (es) { es.forEach(function (en) { seenMap.set(en.target, en.isIntersecting); }); blockers = 0; seenMap.forEach(function (v) { if (v) blockers++; }); upd(); }, { threshold: .15 });
      $$('#register, .evt-reg-card, #main-footer').forEach(function (el) { bo.observe(el); });
    }
  }
  if (window.bhdInitButtons) window.bhdInitButtons();
})();

/* ════════════════════════════════════════════════════════════════════════
   WARM LIGHT THEME — 2026-09-30 (styles in style.css, same heading)
   Heroes are light now: re-tag their buttons, soften the magnetic pull,
   add slow drifting colour from the logo palette behind hero copy.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lightHeroButtons() {
    document.querySelectorAll('.hero .et_pb_button, .page-title-wrap .et_pb_button, .evt-hero .et_pb_button').forEach(function (b) {
      b.classList.remove('on-dark'); b.classList.add('on-light');
    });
  }
  function softenMagnet() {
    document.querySelectorAll('.et_pb_button, .ec-btn-fill, .ec-btn-outline, .header-contact-btn').forEach(function (b) {
      if (b.dataset.warm) return; b.dataset.warm = '1';
      b.addEventListener('pointermove', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }
  function blobs() {
    if (reduce) return;
    document.querySelectorAll('.hero, .page-title-wrap, .evt-hero').forEach(function (h) {
      if (h.querySelector('.warm-blobs')) return;
      var d = document.createElement('div'); d.className = 'warm-blobs'; d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<i></i><i></i><i></i>';
      var ov = h.querySelector('.hero-overlay, .page-hero-overlay, .evt-hero-overlay');
      if (ov && ov.nextSibling) h.insertBefore(d, ov.nextSibling); else h.appendChild(d);
    });
  }
  function start() { lightHeroButtons(); softenMagnet(); blobs(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  var wrap = window.bhdInitButtons;
  window.bhdInitButtons = function () { if (wrap) wrap(); lightHeroButtons(); softenMagnet(); };
})();

/* v9 — transparent header only where a dark hero sits under it */
(function () {
  var h = document.getElementById('main-header'); if (!h) return;
  var hero = document.querySelector('.hero, .page-title-wrap, .evt-hero');
  var top = hero ? hero.getBoundingClientRect().top + (window.scrollY || 0) : 999;
  if (!hero || top > 80) h.classList.add('hdr-solid');
})();

/* v11 — animated, interactive dark CTA cards */
(function () {
  var SEL = '.hx-cta, .sv-cta-in, .ab-cta > .ab-wrap, .ev-cta-in, .pt-cta-card, .ct-cta-card, .ct-book, .bio-cta > .container, .cta-strip > .container';
  var INNER = '.hx-cta, .sv-cta-in, .ev-cta-in, .pt-cta-card, .ct-cta-card, .ct-book, .ab-wrap';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function init() {
    var cards = [].slice.call(document.querySelectorAll(SEL)).filter(function (el) {
      return !(el.matches('.cta-strip > .container') && el.querySelector(INNER));
    });
    cards.forEach(function (card) {
      if (card.classList.contains('v11-card')) return;
      card.classList.add('v11-card');
      var g = document.createElement('span'); g.className = 'v11-glow'; g.setAttribute('aria-hidden', 'true');
      g.innerHTML = '<i></i><i></i><b></b>'; card.insertBefore(g, card.firstChild);
      var tx = 88, ty = 0, cx = 88, cy = 0, raf = 0;
      function paint() {
        card.style.setProperty('--v11x', cx.toFixed(1) + '%'); card.style.setProperty('--v11y', cy.toFixed(1) + '%');
        g.style.transform = 'translate3d(' + ((cx - 50) * .06).toFixed(2) + 'px,' + ((cy - 50) * .06).toFixed(2) + 'px,0)';
      }
      function tick() {
        cx += (tx - cx) * .12; cy += (ty - cy) * .12; paint();
        raf = (Math.abs(tx - cx) > .2 || Math.abs(ty - cy) > .2) ? requestAnimationFrame(tick) : 0;
      }
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = card.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100;
        if (reduce) { cx = tx; cy = ty; paint(); return; }
        if (!raf) raf = requestAnimationFrame(tick);
      });
      card.addEventListener('pointerenter', function () { card.classList.add('v11-hot'); });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('v11-hot'); tx = 88; ty = 0;
        if (reduce) { cx = tx; cy = ty; paint(); } else if (!raf) raf = requestAnimationFrame(tick);
      });
      if (reduce || !('IntersectionObserver' in window)) return;
      if (card.getBoundingClientRect().top < innerHeight * .9) return;   /* already on screen: no entrance */
      card.classList.add('v11-wait');
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect(); card.classList.remove('v11-wait'); card.classList.add('v11-in');
        setTimeout(function () { card.classList.remove('v11-in'); }, 2900);
      }, { threshold: .18 });
      io.observe(card);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* v11 — auto-advance for every switcher: tabs, rosters, timelines, the partners
   list and horizontal card strips. Moves on every 3s and loops; pauses while the
   visitor hovers, reads (text selected), uses the keyboard in it, or has just
   picked an item; picks up the count again once they leave. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var STEP = 3000, HOLD = 6000, units = [];
  window.__bhdAuto = units;
  function vis(el) { return !!(el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden'); }
  function common(a, b) { if (!b) return a; var n = a; while (n && !n.contains(b)) n = n.parentElement; return n || a; }
  function unit(zone, o) {
    var u = { zone: zone, t: 0, hover: false, hold: 0, inView: false, o: o };
    zone.classList.add('ac-zone');
    zone.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') u.hover = true; });
    zone.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') u.hover = false; });
    zone.addEventListener('pointerdown', function () { u.hold = Date.now() + HOLD; u.t = 0; }, true);
    zone.addEventListener('click', function (e) { if (e.isTrusted) { u.hold = Date.now() + HOLD; u.t = 0; } }, true);
    zone.addEventListener('keydown', function () { u.hold = Date.now() + HOLD; u.t = 0; }, true);
    zone.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { u.hold = Date.now() + HOLD; } }, { passive: true });
    zone.addEventListener('touchstart', function () { u.hold = Date.now() + HOLD; u.t = 0; }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var e = en[0]; u.inView = e.isIntersecting && (e.intersectionRatio >= .3 || e.intersectionRect.height >= innerHeight * .45);
      }, { threshold: [0, .15, .3, .5, .75, 1] }).observe(zone);
    } else u.inView = true;
    units.push(u); return u;
  }
  function paused(u) {
    if (!u.inView || document.hidden || u.hover || Date.now() < u.hold) return true;
    var f = u.zone.querySelector(':focus-visible'); if (f) return true;
    var s = window.getSelection && getSelection();
    if (s && !s.isCollapsed && s.anchorNode && u.zone.contains(s.anchorNode)) return true;
    return false;
  }
  /* progress line inside the active tab */
  function bar(tab, p) {
    if (!tab) return;
    var b = tab.querySelector(':scope > .ac-prog');
    if (!b) {
      [].forEach.call(document.querySelectorAll('.ac-prog'), function (x) { if (x.parentElement.closest('.ac-zone') === tab.closest('.ac-zone') && x.parentElement !== tab) x.remove(); });
      b = document.createElement('span'); b.className = 'ac-prog'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i>';
      tab.classList.add('ac-tab'); tab.appendChild(b);
    }
    b.firstChild.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  /* programmatic click that leaves the URL alone (some tabs write a #hash) */
  function press(el) {
    var href = location.href, st = history.state, y = scrollY;
    el.click();
    if (location.href !== href) { try { history.replaceState(st, '', href); } catch (e) {} }
    if (Math.abs(scrollY - y) > 2) scrollTo(scrollX, y);
  }

  function tabsUnit(list, opt) {
    opt = opt || {};
    var tabs = function () { return [].slice.call(list.querySelectorAll('[role="tab"]')).filter(vis); };
    var first = tabs()[0]; if (!first) return;
    var panel = document.getElementById(first.getAttribute('aria-controls') || '');
    var u = unit(opt.zone || common(list, panel), opt);
    u.ok = function () { return vis(list) && tabs().length > 1 && (!opt.when || opt.when()); };
    u.cur = function () { var t = tabs(), i = t.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; }); return { t: t, i: i < 0 ? 0 : i }; };
    u.show = function (p) { if (opt.bar === false) return; var c = u.cur(); bar(c.t[c.i], p); };
    u.next = function () { var c = u.cur(); press(c.t[(c.i + 1) % c.t.length]); };
  }

  function stripUnit(el) {
    var u = unit(el, {});
    u.ok = function () { return vis(el) && el.scrollWidth > el.clientWidth + 8; };
    u.show = function () {};
    u.next = function () {
      var kids = [].slice.call(el.children).filter(vis); if (!kids.length) return;
      var end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 6;
      if (end) { el.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      var x0 = el.getBoundingClientRect().left, target = null;
      for (var i = 0; i < kids.length; i++) { if (kids[i].getBoundingClientRect().left - x0 > 8) { target = kids[i]; break; } }
      var dx = target ? target.getBoundingClientRect().left - x0 : el.clientWidth;
      el.scrollBy({ left: dx, behavior: 'smooth' });
    };
  }

  function init() {
    /* the homepage pillars had their own 9s one-shot rotation: this engine takes over */
    var pil = document.querySelector('.hx-pil'); if (pil) pil.classList.remove('hx-pil-auto');
    [].forEach.call(document.querySelectorAll('[role="tablist"]'), function (l) {
      if (l.closest('#main-header, #main-footer')) return;
      if (l.matches('.ev-pills, [aria-label^="Filter"]')) return;           /* filters are not slides */
      if (l.matches('.sv-pkg-switch')) { tabsUnit(l, { zone: l.parentElement }); return; } /* phones: one package at a time */
      if (l.matches('.bio-tl-track')) { tabsUnit(l, { bar: false, zone: l.closest('section') || l.parentElement }); return; }
      tabsUnit(l);
    });
    /* partners: list + detail card on wide screens */
    var pw = document.querySelector('.pt-wrap');
    if (pw) {
      var trig = function () { return [].slice.call(pw.querySelectorAll('.pt-trig')).filter(vis); };
      var u = unit(pw, {});
      u.ok = function () { return pw.classList.contains('pt-desk') && trig().length > 1; };
      u.cur = function () { var t = trig(), i = t.findIndex(function (x) { return x.getAttribute('aria-expanded') === 'true'; }); return { t: t, i: i < 0 ? 0 : i }; };
      u.show = function (p) { var c = u.cur(); bar(c.t[c.i], p); };
      u.next = function () { var c = u.cur(); press(c.t[(c.i + 1) % c.t.length]); };
    }
    /* horizontal snap strips (event cards, bio highlights on phones, ...) */
    [].forEach.call(document.querySelectorAll('body *'), function (el) {
      if (el.closest('#main-header, #main-footer, [role="tablist"]') || el.querySelector('[role="tab"]')) return;
      var cs = getComputedStyle(el);
      if (/x|both|inline/.test(cs.scrollSnapType) && /(auto|scroll)/.test(cs.overflowX)) stripUnit(el);
    });
    var last = Date.now();
    setInterval(function () {
      var now = Date.now(), dt = Math.min(now - last, 250); last = now;
      units.forEach(function (u) {
        if (!u.ok()) return;
        if (!paused(u)) u.t += dt;
        if (u.t >= STEP) { u.t = 0; u.next(); }
        u.show(u.t / STEP);
      });
    }, 80);
  }
  if (document.readyState !== 'loading') setTimeout(init, 400);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 400); });
})();
