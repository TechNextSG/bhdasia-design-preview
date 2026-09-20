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
      btns:[{t:'How to Book',u:'contact.html'},{t:'Pricing',u:'services.html'},{t:'Our Approach',u:'about.html'}]
    },
    {
      re:/^(who|whose)$/,
      a:"We're <strong>BHD Asia</strong> (Business and Human Development Consulting Pte Ltd) — led by <strong>Isabelle Claus Teixeira</strong>, 27+ years in HR &amp; coaching.",
      btns:[{t:'Meet the Team',u:'about.html'},{t:'About Isabelle',u:'isabelle.html'}]
    },
    {
      re:/^what$/,
      a:"We offer <strong>Organisation Development</strong>, <strong>Resilience Building</strong> (incl. TRE™), and <strong>Individual Coaching</strong>. What area interests you?",
      btns:[{t:'All Services',u:'services.html'},{t:'TRE™ Workshops',u:'events.html'}]
    },
    {
      re:/^why$/,
      a:"<strong>Why BHD Asia?</strong> We co-design bespoke solutions — not off-the-shelf programmes. 27+ years across 9 countries, blending executive coaching, somatic methods, and real HR expertise.",
      btns:[{t:'Our Story',u:'about.html'},{t:'Book a Free Call',u:'contact.html'}]
    },
    {
      re:/^(help|\?+|start|menu|topics?|options?)$/,
      a:"Here's what I can help with:<br>• <strong>Services</strong> — what we offer<br>• <strong>TRE™ workshops</strong> — dates &amp; pricing<br>• <strong>Coaching</strong> — executive &amp; career<br>• <strong>Events</strong> — upcoming workshops<br>• <strong>Team</strong> — about Isabelle<br>• <strong>Location &amp; online</strong> — where we work<br>• <strong>Contact</strong> — how to reach us<br><br>Just type any topic!",
      btns:[{t:'Services',u:'services.html'},{t:'Events',u:'events.html'},{t:'Contact',u:'contact.html'}]
    },
    {
      re:/^(yes|yeah|yep|yup|ok|okay|sure|go ahead|sounds good)$/,
      a:"Great! What would you like to know? Ask about our <strong>services</strong>, <strong>pricing</strong>, <strong>TRE™ workshops</strong>, or how to <strong>book a session</strong>.",
      btns:[{t:'Services',u:'services.html'},{t:'Events',u:'events.html'},{t:'Contact',u:'contact.html'}]
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
      btns:[{t:'View All Services',u:'services.html'},{t:'Book a Free Call',u:'contact.html'}]
    },
    {
      re:/(\btre\b|tension|trauma|somatic|tremor|neurogenic|releasing exercise|nervous system|body.?based|bodywork)/,
      a:"<strong>TRE™ (Tension &amp; Trauma Releasing Exercises)</strong> is a neurogenic method that helps the body release deep muscle tension and stress without detailed discussion of past events. We run open workshops — Module 1 (personal use) and Modules 2/3 (provider certification).",
      btns:[{t:'See TRE™ Events',u:'events.html'},{t:'Enquire Now',u:'contact.html'}]
    },
    {
      re:/(event|events|workshop|workshops|upcoming|module|when|next date|schedule|calendar|dates?|availability|timetable|course|training|certif)/,
      a:"Our next workshops: <strong>TRE™ for Personal Use (Module 1)</strong> — <strong>29–30 Aug 2026</strong>, and <strong>TRE™ Certification (Module 2)</strong> — 26–27 Sep 2026. Both in-person, Singapore.",
      btns:[{t:'View All Events',u:'events.html'},{t:'Reserve a Spot',u:'contact.html'}]
    },
    {
      re:/(price|pricing|cost|fee|how much|rate|sgd|dollar|package|invest|money|budget|afford|pay|payment)/,
      a:"The 2026 TRE™ certification intake is closed. The <strong>2027 Singapore cohort</strong> opens with Module 1 on 27–28 February 2027, co-taught by Isabelle Claus Teixeira and Simba Stenqvist, with <strong>early-bird pricing until 31 December 2026</strong>. Our 8-week individual coaching package is <strong>SGD 2,200</strong>. Group and corporate rates on request.",
      btns:[{t:'Full Pricing',u:'services.html'},{t:'Ask About Rates',u:'contact.html'}]
    },
    {
      re:/(contact|email|phone|call|reach|whatsapp|enquire|inquire|message|get in touch|speak|talk|connect)/,
      a:"You can reach us by email at <a href='mailto:isabelle@bhdasia.com'>isabelle@bhdasia.com</a>, call or WhatsApp <strong>+81 80 6515 1778</strong>, or fill in our online contact form.",
      btns:[{t:'Contact Form',u:'contact.html'}]
    },
    {
      re:/(location|where|address|office|located|based|singapore|raffles|online|virtual|remote|in.?person|hybrid)/,
      a:"Based at <strong>50 Raffles Place, Singapore Land Tower #30-00, Singapore 048623</strong>. We also work remotely with clients across Asia Pacific, Japan, Europe, and beyond.",
      btns:[{t:'Contact Us',u:'contact.html'},{t:'About BHD Asia',u:'about.html'}]
    },
    {
      re:/(isabelle|founder|who runs|co.?founder|director|team|staff|people|credentials?|qualif)/,
      a:"<strong>Isabelle Claus Teixeira</strong> is our founder — 27+ years in HR leadership across 9 countries, certified coach since 2012, TRE™ provider, and Forbes Coaches Council contributor.",
      btns:[{t:'Meet Isabelle',u:'isabelle.html'},{t:'Our Team',u:'about.html#team'}]
    },
    {
      re:/(resilience|resilient|stress|burnout|burn.?out|anxiety|overwhelm|wellbeing|well.?being|mental.?health|pressure|fatigue|exhaust|psychological.?safety)/,
      a:"Our <strong>Resilience Building</strong> programmes include TRE™ (neurogenic stress release), somatic coaching, burnout prevention, stress management, and psychological safety workshops.",
      btns:[{t:'Resilience Services',u:'services.html'},{t:'TRE™ Events',u:'events.html'}]
    },
    {
      re:/(hr|human.?resource|talent|organisat|organizat|culture|change.?management|facilitat|corporate|leadership.?develop|workforce)/,
      a:"Our <strong>Organisation Development</strong> practice covers HR &amp; Talent Management advisory, high-performing team facilitation, culture transformation, leadership development, and change management.",
      btns:[{t:'Org Development',u:'services.html'},{t:'Talk to Us',u:'contact.html'}]
    },
    {
      re:/(mediat|conflict|dispute|disagree|difficult.?conversation|resolution|simi)/,
      a:"We facilitate <em>Challenging Conversations &amp; Constructive Conflict</em> workshops and support leaders and teams with professional conflict resolution.",
      btns:[{t:'Our Services',u:'services.html'},{t:'Book a Consult',u:'contact.html'}]
    },
    {
      re:/(about|company|bhd|background|history|who are you|what is bhd|mission|values?|philosophy|approach|methodology|how.*work|how does)/,
      a:"<strong>BHD Asia</strong> is a boutique HR consulting, executive coaching and leadership development firm. Founded in Singapore in 2012, we co-design bespoke solutions for clients across Asia Pacific and globally.",
      btns:[{t:'About Us',u:'about.html'},{t:'Our Services',u:'services.html'}]
    },
    {
      re:/(book|booking|appointment|sign.?up|register|enrol|enroll|reserve|1.?on.?1|one.?on.?one|free call|consult|discovery|get started|next step|how do i|how to)/,
      a:"To book, use our <a href='contact.html'>Contact form</a> or WhatsApp <strong>+81 80 6515 1778</strong> to schedule a free discovery conversation — no commitment needed.",
      btns:[{t:'Book a Free 1:1',u:'contact.html'}]
    },
    {
      re:/(coaching|executive.?coach|leadership.?coach|career.?coach|transition.?coach|performance.?coach|life.?coach|personal.?develop|growth|goal)/,
      a:"Our coaching covers <strong>Executive Coaching</strong>, <strong>Transition Coaching</strong>, <strong>Performance Coaching</strong>, <strong>Career Coaching</strong>, Self-Awareness Development, and 360° Debriefs — all fully co-designed.",
      btns:[{t:'Coaching Services',u:'services.html'},{t:'Book a Consult',u:'contact.html'}]
    },
    {
      re:/(partner|associate|network|client|clients|who.*(work|worked)|companies|testimonial|review|results|forbes|icf|noomii)/,
      a:"We've worked with ByteDance (TikTok), Novartis, Philips, VISA, Mastercard, Heineken APAC, and more. Isabelle is a Forbes Coaches Council contributor and ICF-certified coach.",
      btns:[{t:'Our Partners',u:'partners.html'},{t:'Our Story',u:'about.html'}]
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
  var FALLBACK_BTNS = [{t:'Services',u:'services.html'},{t:'Events',u:'events.html'},{t:'Contact Us',u:'contact.html'}];

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
        btns:[{t:'Services',u:'services.html'},{t:'Events',u:'events.html'},{t:'Contact',u:'contact.html'}]
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
    {id:'module1-singapore',page:'event-module1-singapore.html',start:'2026-08-29T10:00:00+08:00',soldOut:true,
     cdTitle:'Nervous System Regulation &amp; Neurogenic Tremoring &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 29&ndash;30 August 2026 &middot; In-Person &middot; Singapore',
     link:'event-module1-singapore.html',linkText:'View Event'},
    {id:'internal-alchemy',page:'event-internal-alchemy.html',start:'2026-09-01T19:00:00+08:00',soldOut:false,
     cdTitle:'Internal Alchemy &middot; Introductory Workshop &middot; Singapore',
     cdMeta:'Tuesday, 1 September 2026 &middot; 7&ndash;9PM &middot; Nilayam Ashtanga Studio, Singapore',
     link:'event-internal-alchemy.html',linkText:'View Event',
     card:{img:'event-internal-alchemy.webp?v=2',alt:'Internal Alchemy &mdash; Introductory Workshop with Simba Stenqvist',
       tag:'First Time in Singapore',date:'1 September 2026 &nbsp;&middot;&nbsp; 7&ndash;9PM &middot; In-Person &middot; Singapore',
       title:'Internal Alchemy &mdash; Introductory Workshop',
       desc:'Breathwork, fascial release, grounding and tremor work in one integrated system &mdash; led by Simba Stenqvist, creator of Internal Alchemy and Global TRE&trade; Certifying Trainer. S$79.',
       venue:'Nilayam Ashtanga Studio',url:'event-internal-alchemy.html#register',cta:'Register'}},
    {id:'shaking-online-sep3',page:'event-shaking-shaping-sep3.html',start:'2026-09-03T19:00:00+08:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Live Online Session',
     cdMeta:'Thursday, 3 September 2026 &middot; 7&ndash;9PM &middot; Online',
     link:'event-shaking-shaping-sep3.html',linkText:'View Event'},
    {id:'cert-module2',page:'event-certification.html',start:'2026-09-26T10:00:00+08:00',soldOut:true,
     cdTitle:'TRE&trade; Provider Certification &middot; Module 2 &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 26&ndash;27 September 2026 &middot; In-Person &middot; Singapore',
     link:'event-certification.html#register',linkText:'Register Now',
     card:{img:'event-module2.webp?v=4',alt:'TRE&trade; Provider Certification &mdash; Module 2, 26&ndash;27 September 2026, Singapore',
       tag:'Certification &middot; Singapore',date:'26&ndash;27 September 2026 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'TRE&trade; Provider Certification &mdash; Module 2',
       desc:'The certification journey continues &mdash; Module 2 of the Global TRE&trade; Provider Certification with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer. The 2026 intake is now closed — the next cohort runs in 2027.',
       venue:'Singapore',url:'event-certification.html#register',cta:'Register'}},
    {id:'feminine-masculine',page:'event-feminine-masculine.html',start:'2026-10-28T19:00:00+08:00',soldOut:false,
     cdTitle:'Navigating Feminine &amp; Masculine Energetics &middot; Sara Marie',
     cdMeta:'Wednesday, 28 October 2026 &middot; 7&ndash;9:30PM SGT &middot; Live Online',
     link:'event-feminine-masculine.html',linkText:'View Event',
     card:{img:'event-feminine-masculine.webp?v=2',alt:'Navigating Feminine &amp; Masculine Energetics &mdash; Sara Marie, 28 October 2026',
       tag:'Live Online',date:'28 October 2026 &nbsp;&middot;&nbsp; 7&ndash;9:30PM SGT &middot; Live Online',
       title:'Navigating Feminine &amp; Masculine Energetics',
       desc:'A live online workshop with Sara Marie &mdash; The Alchemist. Alchemising the pressure of masculine corporate structures into liberation, ease and personal power.',
       venue:'Online',url:'event-feminine-masculine.html',cta:'Details'}},
    {id:'shaking-oct8',page:'event-shaking-shaping-oct8.html',start:'2026-10-08T19:00:00+08:00',soldOut:false,
     cdTitle:'From Shaking to Shaping &middot; Live Online Session',
     cdMeta:'Thursday, 8 October 2026 &middot; 7&ndash;9PM &middot; Live Online',
     link:'event-shaking-shaping-oct8.html',linkText:'View Event',
     card:{img:'event-shaking-oct8.webp?v=2',alt:'From Shaking to Shaping &mdash; live online session, 8 October 2026',
       tag:'Live Online',date:'8 October 2026 &nbsp;&middot;&nbsp; 7&ndash;9PM &middot; Live Online',
       title:'From Shaking to Shaping &mdash; Live Online Session',
       desc:'Use of TRE&trade; in a coaching context &mdash; one evening online with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer, and Saymara Ryon, President of Asocia&#539;ia TRE&trade; Rom&acirc;nia.',
       venue:'Online',url:'event-shaking-shaping-oct8.html',cta:'Details'}},
    {id:'module1-bucharest',page:'event-module1-bucharest.html',start:'2026-10-15T17:00:00+03:00',soldOut:true,
     cdTitle:'TRE&trade; Module 1 Bucharest &middot; 15 October 2026',
     cdMeta:'Thursday, 15 October 2026 &middot; Introductory Evening 17:00&ndash;19:00 EET &middot; Bucharest',
     link:'event-module1-bucharest.html',linkText:'View Event',
     card:{img:'event-bucharest-module1.webp?v=4',alt:'TRE&trade; Module 1 &mdash; Bucharest, Romania, 15&ndash;17 October 2026',
       tag:'21 ICF CCEUs',date:'15&ndash;17 October 2026 &nbsp;&middot;&nbsp; In-Person &middot; Bucharest',
       title:'TRE&trade; Module 1 &mdash; Bucharest, Romania',
       desc:'An immersive 3-day certification training &mdash; the first in Europe in English. Valid as Module 1 of the Global TRE&trade; Provider Certification Program. 21 ICF CCEUs. From &euro;739.',
       venue:'Bucharest, Rom&acirc;nia',url:'event-module1-bucharest.html',cta:'Details'}},
    {id:'shaking-bucharest-1',page:'event-shaking-shaping.html',start:'2026-10-20T10:00:00+03:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Bucharest &middot; 20 October 2026',
     cdMeta:'Tuesday, 20 October 2026 &middot; In-Person &middot; Bucharest, Rom&acirc;nia',
     link:'event-shaking-shaping.html',linkText:'View Event',
     card:{img:'event-shaking-shaping.webp?v=4',alt:'From Shaking to Shaping &mdash; Isabelle Claus Teixeira and Saymara Ryon, Bucharest',
       tag:'Isabelle &amp; Saymara',date:'20 &amp; 24 October 2026 &nbsp;&middot;&nbsp; In-Person &middot; Bucharest',
       title:'From Shaking to Shaping &mdash; Bucharest',
       desc:'Use of TRE&trade; in a coaching context &mdash; half-day in-person intensives in Bucharest, co-led by Isabelle Claus Teixeira and Saymara Ryon, President of Asocia&#539;ia TRE&trade; Rom&acirc;nia. From &euro;97.',
       venue:'Bucharest',url:'event-shaking-shaping.html',cta:'Details'}},
    {id:'shaking-bucharest-2',page:'event-shaking-shaping.html',start:'2026-10-24T10:00:00+03:00',soldOut:true,
     cdTitle:'From Shaking to Shaping &middot; Bucharest &middot; 24 October 2026',
     cdMeta:'Saturday, 24 October 2026 &middot; In-Person &middot; Bucharest, Rom&acirc;nia',
     link:'event-shaking-shaping.html',linkText:'View Event'},
    {id:'cert-module3',page:'event-certification.html',start:'2027-02-20T10:00:00+08:00',soldOut:true,
     cdTitle:'TRE&trade; Provider Certification &middot; Module 3 &middot; Singapore',
     cdMeta:'Saturday &amp; Sunday, 20&ndash;21 February 2027 &middot; In-Person &middot; Singapore',
     link:'event-certification.html#register',linkText:'Register Now',
     card:{img:'event-module2.webp?v=4',alt:'TRE&trade; Provider Certification &mdash; Module 3, 20&ndash;21 February 2027, Singapore',
       tag:'Certification &middot; Singapore',date:'20&ndash;21 February 2027 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'TRE&trade; Provider Certification &mdash; Module 3',
       desc:'The final module of the Global TRE&trade; Provider Certification &mdash; certification weekend with Isabelle Claus Teixeira, Global TRE&trade; Certifying Trainer. The 2026 intake is now closed.',
       venue:'Singapore',url:'event-certification.html#register',cta:'Register'}},
    {id:'cert-2027',page:'event-certification-2027.html',start:'2027-02-27T09:00:00+08:00',soldOut:false,
     cdTitle:'Become a Certified TRE&trade; Provider &middot; 2027 Cohort &middot; Singapore',
     cdMeta:'Module 1: 27&ndash;28 February 2027 &middot; In-Person &middot; Singapore',
     link:'event-certification-2027.html#register',linkText:'Register Now',
     card:{img:'event-cert-2027.webp?v=4',alt:'Become a Certified TRE&trade; Provider &mdash; 2027 Cohort, Singapore',
       tag:'Certification &middot; 2027',date:'Feb&ndash;Oct 2027 &nbsp;&middot;&nbsp; In-Person &middot; Singapore',
       title:'Become a Certified TRE&trade; Provider &mdash; 2027 Cohort',
       desc:'The 2027 Singapore cohort of the Global TRE&trade; Provider Certification &mdash; co-taught by Isabelle Claus Teixeira &amp; Simba Stenqvist. Module 1: 27&ndash;28 Feb, Module 2: 3&ndash;4 Jul, Module 3: 30&ndash;31 Oct 2027, plus online supervisions and three bonus programs. From S$5,888 early bird.',
       venue:'Singapore',url:'event-certification-2027.html',cta:'Details'}}
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
  var pageFile=(location.pathname.split('/').pop()||'index.html').toLowerCase();

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
      homeGrid.innerHTML='<div class="home-evt-card"><div class="hec-body"><span class="hec-tag">Upcoming Events</span><h3>New dates coming soon</h3><p>New workshops and certification dates are announced here first &mdash; check back soon.</p><div class="hec-footer"><span class="hec-meta"></span><a class="et_pb_button" href="events.html">View All Events &rarr;</a></div></div></div>';
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
