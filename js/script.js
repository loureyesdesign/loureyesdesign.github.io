
/* ==========================================================
   LOU REYES — OFFICIAL PORTFOLIO
   CINEMATIC SCROLL ENGINE
========================================================== */

"use strict";


/* ==========================================================
   01. UTILITIES
========================================================== */

const $ = id => document.getElementById(id);

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const lerp = (a, b, t) =>
  a + (b - a) * t;

function phase(progress, start, end) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);


/* ==========================================================
   02. PORTFOLIO DATA
========================================================== */

const allProjects = Array.isArray(window.PROJECTS)
  ? window.PROJECTS
  : typeof PROJECTS !== "undefined" &&
    Array.isArray(PROJECTS)
    ? PROJECTS
    : [];

const featuredProjects = allProjects.filter(
  project => project.featured
);

function categoryName(category) {

  if (!category) return "DESIGN";

  if (Array.isArray(category)) {
    return category.join(" / ").toUpperCase();
  }

  return String(category)
    .replace(/[-_]/g, " ")
    .toUpperCase();

}


/* ==========================================================
   03. FEATURED WORK CAROUSEL
========================================================== */

const galleryTrack = $("galleryTrack");
const galleryViewport = $("galleryViewport");

const galleryCurrent = $("galleryCurrent");
const galleryTotal = $("galleryTotal");
const featuredCount = $("featuredCount");

const prevProject = $("prevProject");
const nextProject = $("nextProject");

let activeFeatured = 0;
let lastNotifiedFeatured = -1;

function projectNumber(number) {
  return String(number).padStart(2, "0");
}

function renderFeaturedWork() {

  if (!galleryTrack) return;

  const fragment = document.createDocumentFragment();

  featuredProjects.forEach((project, index) => {

    const card = document.createElement("article");
    card.className = "gallery-card";

    if (index === activeFeatured) {
      card.classList.add("selected");
    }

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "gallery-image";

    const image = document.createElement("img");

    image.src = project.image || "";
    image.alt = project.title || "Featured project";

    image.loading = "eager";
    image.decoding = "async";

    if (index === 0) {
      image.fetchPriority = "high";
    }

    imageWrapper.appendChild(image);

    const title = document.createElement("h3");
    title.textContent = project.title || "Untitled Project";

    const category = document.createElement("p");
    category.className = "micro";
    category.textContent = categoryName(project.category);

    card.append(imageWrapper, title, category);

    card.addEventListener("mouseenter", () => {

      if (activeFeatured === index) return;

      activeFeatured = index;
      updateGallery();

    });

    
    card.addEventListener("click", () => {

      if (!project.id) return;

      if (typeof window.openFeaturedProject === "function") {
        window.openFeaturedProject(project, card);
        return;
      }

      // Ordinary direct navigation remains a fallback
      // if the persistent controller is unavailable.

      window.location.href =
        `work.html?project=${encodeURIComponent(project.id)}`;

    });


    fragment.appendChild(card);

  });

  galleryTrack.replaceChildren(fragment);

  if (galleryTotal) {
    galleryTotal.textContent =
      ` / ${projectNumber(featuredProjects.length)}`;
  }

  updateGallery();

}

function updateGallery() {

  if (!galleryTrack || !galleryViewport) return;

  const cards = [...galleryTrack.querySelectorAll(
    ".gallery-card"
  )];

  if (!cards.length) return;

  activeFeatured = Math.max(
    0,
    Math.min(activeFeatured, cards.length - 1)
  );

  cards.forEach((card, index) => {
    card.classList.toggle(
      "selected",
      index === activeFeatured
    );
  });

  
  const activeCard = cards[activeFeatured];

  // Only notify the transition controller when
  // the selected project actually changes.

  if (lastNotifiedFeatured !== activeFeatured) {

    lastNotifiedFeatured = activeFeatured;

    galleryTrack.dispatchEvent(
      new CustomEvent("featured-card-selected", {
        detail: {
          card: activeCard
        }
      })
    );

  }


  const viewportWidth = galleryViewport.clientWidth;
  const trackWidth = galleryTrack.scrollWidth;

  const maximumOffset = Math.max(
    0,
    trackWidth - viewportWidth
  );

  const desiredOffset = activeCard.offsetLeft;

  const offset = Math.min(
    desiredOffset,
    maximumOffset
  );

  galleryTrack.style.transform =
    `translate3d(${-offset}px, 0, 0)`;

  if (galleryCurrent) {
    galleryCurrent.textContent =
      projectNumber(activeFeatured + 1);
  }

  if (prevProject) {
    prevProject.disabled = activeFeatured === 0;
    prevProject.setAttribute(
      "aria-disabled",
      String(activeFeatured === 0)
    );
  }

  if (nextProject) {
    nextProject.disabled =
      activeFeatured === cards.length - 1;

    nextProject.setAttribute(
      "aria-disabled",
      String(activeFeatured === cards.length - 1)
    );
  }

}

if (prevProject) {

  prevProject.addEventListener("click", () => {

    activeFeatured = Math.max(
      0,
      activeFeatured - 1
    );

    updateGallery();

  });

}

if (nextProject) {

  nextProject.addEventListener("click", () => {

    activeFeatured = Math.min(
      featuredProjects.length - 1,
      activeFeatured + 1
    );

    updateGallery();

  });

}

/* ==========================================================
   MOBILE GALLERY SWIPE NAVIGATION
========================================================== */

if (galleryViewport) {

  let touchStartX = 0;
  let touchStartY = 0;
  let swipeDetected = false;

  const SWIPE_THRESHOLD = 45;

  galleryViewport.addEventListener(
    "touchstart",
    event => {

      if (event.touches.length !== 1) return;

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;

      swipeDetected = false;

    },
    { passive: true }
  );

  galleryViewport.addEventListener(
    "touchend",
    event => {

      if (event.changedTouches.length !== 1) {
        return;
      }

      const deltaX =
        event.changedTouches[0].clientX - touchStartX;

      const deltaY =
        event.changedTouches[0].clientY - touchStartY;

      const horizontalSwipe =
        Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      if (!horizontalSwipe) return;

      const direction = deltaX < 0 ? 1 : -1;

      const nextIndex = Math.max(
        0,
        Math.min(
          featuredProjects.length - 1,
          activeFeatured + direction
        )
      );

      if (nextIndex === activeFeatured) return;

      swipeDetected = true;

      activeFeatured = nextIndex;
      updateGallery();

    },
    { passive: true }
  );

  galleryViewport.addEventListener(
    "touchcancel",
    () => {
      swipeDetected = false;
    },
    { passive: true }
  );

  galleryViewport.addEventListener(
    "click",
    event => {

      if (!swipeDetected) return;

      event.preventDefault();
      event.stopPropagation();

      swipeDetected = false;

    },
    true
  );

}

/* ==========================================================
   04. IMAGE PREPARATION
========================================================== */

function prepareFeaturedImages() {

  const images = [
    ...document.querySelectorAll(
      ".living-featured .gallery-image img"
    ),
    document.querySelector(".living-image-landscape")
  ].filter(Boolean);

  const states = new WeakMap();

  images.forEach(image => {

    image.loading = "eager";

    states.set(image, {
      originalURL: new URL(
        image.currentSrc || image.src,
        document.baseURI
      ).href,
      recovering: false,
      lastAttempt: 0
    });

  });

  async function recoverImage(image) {

    const state = states.get(image);

    if (!state || state.recovering) return;

    if (!image.complete || image.naturalWidth > 0) {
      return;
    }

    const now = Date.now();

    if (now - state.lastAttempt < 3000) return;

    state.recovering = true;
    state.lastAttempt = now;

    try {

      const url = new URL(state.originalURL);

      url.searchParams.set(
        "retry",
        String(now)
      );

      const replacement = new Image();

      replacement.src = url.href;

      await replacement.decode();

      image.src = url.href;

      await image.decode();

      console.info(
        "[FEATURED] Recovered:",
        image.alt || url.pathname
      );

    } catch (error) {

      console.warn(
        "[FEATURED] Recovery failed:",
        image.alt || state.originalURL,
        error
      );

    } finally {

      state.recovering = false;

    }

  }

  function checkImages() {

    images.forEach(image => {

      if (image.complete && !image.naturalWidth) {
        recoverImage(image);
      }

    });

  }

  images.forEach(image => {

    image.addEventListener("error", checkImages);

    if (typeof image.decode === "function") {
      image.decode().catch(() => {
        checkImages();
      });
    }

  });

  let scheduled = false;

  function scheduleCheck() {

    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      checkImages();
    });

  }

  window.addEventListener(
    "scroll",
    scheduleCheck,
    { passive: true }
  );

  window.addEventListener("focus", scheduleCheck);
  window.addEventListener("pageshow", scheduleCheck);

  checkImages();

}



/* ==========================================================
   05. LIGHT / DARK MODE
========================================================== */

const THEME_STORAGE_KEY = "lou-reyes-theme";

const lightThemeButton = $("lightTheme");
const darkThemeButton = $("darkTheme");

const themeColorMeta = $("themeColor");

function applyTheme(theme, save = false) {

  const nextTheme = theme === "light"
    ? "light"
    : "dark";

  document.documentElement.dataset.theme = nextTheme;

  if (lightThemeButton) {

    const selected = nextTheme === "light";

    lightThemeButton.classList.toggle(
      "active",
      selected
    );

    lightThemeButton.setAttribute(
      "aria-pressed",
      String(selected)
    );

  }

  if (darkThemeButton) {

    const selected = nextTheme === "dark";

    darkThemeButton.classList.toggle(
      "active",
      selected
    );

    darkThemeButton.setAttribute(
      "aria-pressed",
      String(selected)
    );

  }

  if (themeColorMeta) {

    themeColorMeta.setAttribute(
      "content",
      nextTheme === "light"
        ? "#e9e7e1"
        : "#111111"
    );

  }

  if (save) {

    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
      );
    } catch (error) {
      // Theme switching works without storage.
    }

  }

}

applyTheme(
  document.documentElement.dataset.theme
);

if (lightThemeButton) {

  lightThemeButton.addEventListener("click", () => {
    applyTheme("light", true);
  });

}

if (darkThemeButton) {

  darkThemeButton.addEventListener("click", () => {
    applyTheme("dark", true);
  });

}


/* ==========================================================
   06. FULLSCREEN NAVIGATION
========================================================== */

const menuButton = $("menuButton");
const menuScreen = $("menuScreen");
const menuLabel = $("menuLabel");

let menuOpen = false;

function setMenuOpen(open) {

  if (!menuButton || !menuScreen) return;

  menuOpen = Boolean(open);

  menuButton.classList.toggle(
    "active",
    menuOpen
  );

  menuScreen.classList.toggle(
    "open",
    menuOpen
  );

  menuButton.setAttribute(
    "aria-expanded",
    String(menuOpen)
  );

  menuButton.setAttribute(
    "aria-label",
    menuOpen
      ? "Close navigation"
      : "Open navigation"
  );

  menuScreen.setAttribute(
    "aria-hidden",
    String(!menuOpen)
  );

  menuScreen.inert = !menuOpen;

  if (menuLabel) {
    menuLabel.textContent =
      menuOpen ? "CLOSE" : "MENU";
  }

  document.body.classList.toggle(
    "locked",
    menuOpen
  );

  if (menuOpen) {
    menuButton.focus();
  }

}

if (menuButton) {

  menuButton.addEventListener("click", () => {
    setMenuOpen(!menuOpen);
  });

}

if (menuScreen) {

  menuScreen.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {
      setMenuOpen(false);
    });

  });

}

document.addEventListener("keydown", event => {

  if (event.key === "Escape" && menuOpen) {
    setMenuOpen(false);
    menuButton?.focus();
  }

});


/* ==========================================================
   07. CINEMATIC LIVING TRANSITION
========================================================== */

function initializeLivingTransition() {

  const section = document.querySelector(
    ".living-transition"
  );

  const sticky = document.querySelector(
    ".living-sticky"
  );

  const movingImage = $("livingImage");

  const featuredSection = document.querySelector(
    ".living-featured"
  );

  if (
    !section ||
    !sticky ||
    !movingImage ||
    !featuredSection ||
    !galleryTrack
  ) {
    return;
  }


  /* --------------------------------------------------------
     ELEMENT REFERENCES
  -------------------------------------------------------- */

  const leftName = document.querySelector(
    ".living-name-left"
  );

  const rightName = document.querySelector(
    ".living-name-right"
  );

  const monogram = document.querySelector(
    ".living-monogram"
  );

  const side = document.querySelector(
    ".living-side"
  );

  const description = document.querySelector(
    ".living-description"
  );

  const edition = document.querySelector(
    ".living-edition"
  );

  const introduction = $("livingIntroduction");

  const landscapeImage = document.querySelector(
    ".living-image-landscape"
  );

  const portraitImage = document.querySelector(
    ".living-image-portrait"
  );

  const imageShade = document.querySelector(
    ".living-image-shade"
  );

  const featuredHeading = featuredSection.querySelector(
    ".section-top"
  );

  const featuredNavigation = featuredSection.querySelector(
    ".gallery-bottom"
  );

  const progressFill = document.querySelector(
    ".living-progress-fill"
  );

  const progressNumber = document.querySelector(
    ".living-progress-number"
  );

  const progressLabel = document.querySelector(
    ".living-progress-label"
  );

  const firstImage = galleryTrack.querySelector(
    ".gallery-card:first-child .gallery-image img"
  );


  /* --------------------------------------------------------
     MATCH VIRTÙ'S FIRST CAROUSEL IMAGE
  -------------------------------------------------------- */

  if (firstImage && landscapeImage) {

    firstImage.src =
      landscapeImage.getAttribute("src");

    firstImage.alt = "VIRTÙ editorial artwork";

    firstImage.style.objectPosition =
      "100% center";

  }


  /* --------------------------------------------------------
     ANIMATION SETTINGS
  -------------------------------------------------------- */

  /*
     160 ms matches our successful dry run.

     Change only this number if we later want
     slightly tighter or softer motion.
  */

  const SMOOTHING_MS = 160;

  let viewportWidth = 0;
  let viewportHeight = 0;

  let sectionStart = 0;
  let animationDistance = 1;

  let opening = null;
  let landing = null;

  let targetProgress = 0;
  let currentProgress = 0;

  let previousTime = 0;
  let animationFrame = null;

  let lastProgress = -1;
  let lastLabel = "";


  /* --------------------------------------------------------
     MEASURE ORIGINAL ARTWORK AND LANDING
  -------------------------------------------------------- */

  function measure() {

    viewportWidth = sticky.clientWidth;
    viewportHeight = sticky.clientHeight;

    sectionStart =
      section.getBoundingClientRect().top +
      window.scrollY;

    const holdDistance =
      parseFloat(
        getComputedStyle(section).getPropertyValue(
          "--scroll-hold"
        )
      ) || 0;

    animationDistance = Math.max(
      1,
      section.offsetHeight -
      window.innerHeight -
      window.innerHeight * holdDistance / 100
    );

    if (viewportWidth <= 700) {

      opening = {
        x: viewportWidth * .27,
        y: viewportHeight * .26,
        w: viewportWidth * .46,
        h: viewportHeight * .48
      };

    } else {

      opening = {
        x: viewportWidth * .405,
        y: viewportHeight * .15,
        w: viewportWidth * .19,
        h: viewportHeight * .70
      };

    }

    const target = galleryTrack.querySelector(
      ".gallery-card:first-child .gallery-image"
    );

    if (target) {

      const stickyRect = sticky.getBoundingClientRect();

      /*
         Use the first card's layout position rather
         than its transformed screen position.

         This keeps the VIRTÙ landing stable even
         after carousel navigation.
      */

      const viewportRect =
        galleryViewport.getBoundingClientRect();

      landing = {
        x:
          viewportRect.left -
          stickyRect.left +
          target.offsetLeft,

        y:
          viewportRect.top -
          stickyRect.top +
          target.offsetTop,

        w: target.offsetWidth,
        h: target.offsetHeight
      };

    } else {

      landing = { ...opening };

    }

  }


  /* --------------------------------------------------------
     GET ACTUAL SCROLL PROGRESS
  -------------------------------------------------------- */

  function getTargetProgress() {

    return clamp(
      (window.scrollY - sectionStart) /
      animationDistance
    );

  }


  /* --------------------------------------------------------
     RENDER CINEMATIC ANIMATION
  -------------------------------------------------------- */

  function render(progress) {

    if (!opening || !landing) return;

    if (
      Math.abs(progress - lastProgress) < .00001
    ) {
      return;
    }

    lastProgress = progress;


    /* OPENING TYPOGRAPHY */

    const depart = phase(progress, .04, .28);

    if (leftName) {

      leftName.style.transform =
        `translate(${-viewportWidth * .25 * depart}px, -50%)`;

      leftName.style.opacity = 1 - depart;

    }

    if (rightName) {

      rightName.style.transform =
        `translate(${viewportWidth * .25 * depart}px, -10%)`;

      rightName.style.opacity = 1 - depart;

    }

    if (monogram) {
      monogram.style.opacity = 1 - depart;
    }

    const detailsExit = phase(progress, .04, .22);

    if (description) {
      description.style.opacity = 1 - detailsExit;
    }

    if (edition) {
      edition.style.opacity = 1 - detailsExit;
    }

    if (side) {
      side.style.opacity = 1 - detailsExit;
    }


    /* VIRTÙ — FULLSCREEN EXPANSION */

    const expand = phase(progress, .12, .43);

    let rect = {

      x: lerp(
        opening.x,
        0,
        expand
      ),

      y: lerp(
        opening.y,
        0,
        expand
      ),

      w: lerp(
        opening.w,
        viewportWidth,
        expand
      ),

      h: lerp(
        opening.h,
        viewportHeight,
        expand
      )

    };


    /* INTRODUCTION */

    const introEnter = phase(progress, .35, .44);
    const introExit = phase(progress, .54, .63);

    const introOpacity =
      introEnter * (1 - introExit);

    if (introduction) {

      introduction.style.opacity = introOpacity;

      introduction.style.transform =
        `translate(-50%, ${-45 + (1 - introEnter) * 6}%)`;

    }


    /* VIRTÙ — RIGHT-TO-LEFT LANDING */

    const settle = phase(progress, .60, .91);

    rect = {

      x: lerp(
        rect.x,
        landing.x,
        settle
      ),

      y: lerp(
        rect.y,
        landing.y,
        settle
      ),

      w: lerp(
        rect.w,
        landing.w,
        settle
      ),

      h: lerp(
        rect.h,
        landing.h,
        settle
      )

    };

    movingImage.style.left = `${rect.x}px`;
    movingImage.style.top = `${rect.y}px`;

    movingImage.style.width = `${rect.w}px`;
    movingImage.style.height = `${rect.h}px`;


    /* VIRTÙ IMAGE PAN */

    const coverPan = phase(progress, .60, .91);

    if (landscapeImage) {

      landscapeImage.style.objectPosition =
        `${50 + coverPan * 50}% center`;

      landscapeImage.style.opacity = "1";

    }

    if (portraitImage) {
      portraitImage.style.opacity = "0";
    }


    /* FEATURED WORK — STAGGERED REVEAL */

    const headingReveal =
      phase(progress, .60, .72);

    const galleryReveal =
      phase(progress, .68, .88);

    const navigationReveal =
      phase(progress, .78, .94);

    featuredSection.style.opacity = "1";
    featuredSection.style.transform = "none";

    if (featuredHeading) {
      featuredHeading.style.opacity = headingReveal;
    }

    if (featuredNavigation) {
      featuredNavigation.style.opacity =
        navigationReveal;
    }

    /*
       IMPORTANT:
       The carousel stays at opacity: 1.

       Only its covering pseudo-element moves.

       This preserves the fix that eliminated
       the original 64–65% first-scroll lag.
    */

    galleryViewport.style.setProperty(
      "--gallery-cover-progress",
      galleryReveal
    );

    featuredSection.style.pointerEvents =
      progress >= .985 ? "auto" : "none";


    /* ARTWORK SHADE */

    const darken = phase(progress, .32, .42);
    const brighten = phase(progress, .59, .88);

    const shade =
      darken * (1 - brighten) * .35;

    if (imageShade) {

      imageShade.style.background =
        `rgba(0, 0, 0, ${shade})`;

    }


    /* VIRTÙ → FIRST CARD HANDOFF */

    const handoff = phase(progress, .94, .985);

    if (firstImage) {
      firstImage.style.opacity = handoff;
    }

    movingImage.style.opacity = 1 - handoff;

    movingImage.style.visibility =
      handoff >= 1 ? "hidden" : "visible";


    /* SCROLL PROGRESS */

    if (progressFill) {
      progressFill.style.width =
        `${progress * 100}%`;
    }

    const label =
      `${String(Math.round(progress * 100)).padStart(3, "0")}%`;

    if (progressNumber && label !== lastLabel) {
      progressNumber.textContent = label;
    }

    if (progressLabel) {

      progressLabel.textContent =
        progress >= .985
          ? "EXPLORE THE WORK"
          : "SCROLL TO UNFOLD";

    }

    lastLabel = label;

  }


  /* ========================================================
     08. CINEMATIC SCROLL SMOOTHING
  ======================================================== */

  function animate(timestamp) {

    animationFrame = null;

    const delta = previousTime
      ? Math.min(timestamp - previousTime, 64)
      : 16.67;

    previousTime = timestamp;

    targetProgress = getTargetProgress();

    const duration = reducedMotion.matches
      ? 0
      : SMOOTHING_MS;

    if (duration <= 0) {

      currentProgress = targetProgress;

    } else {

      const alpha =
        1 - Math.exp(-delta / duration);

      currentProgress +=
        (targetProgress - currentProgress) * alpha;

    }

    if (
      Math.abs(targetProgress - currentProgress) < .0001
    ) {

      currentProgress = targetProgress;

    }

    render(currentProgress);

    if (
      Math.abs(targetProgress - currentProgress) >= .0001
    ) {

      animationFrame =
        requestAnimationFrame(animate);

    } else {

      previousTime = 0;

    }

  }


  function requestUpdate() {

    if (animationFrame !== null) return;

    previousTime = 0;

    animationFrame =
      requestAnimationFrame(animate);

  }


  /* ========================================================
     09. RESPONSIVE MEASUREMENTS
  ======================================================== */

  function remeasure() {

    measure();

    currentProgress = getTargetProgress();
    targetProgress = currentProgress;

    lastProgress = -1;

    render(currentProgress);

  }


  /* ========================================================
     10. INITIALIZATION
  ======================================================== */

  measure();

  currentProgress = getTargetProgress();
  targetProgress = currentProgress;

  render(currentProgress);

  window.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {

      updateGallery();
      remeasure();

    },
    { passive: true }
  );

  if (document.fonts) {

    document.fonts.ready.then(() => {

      updateGallery();
      remeasure();

    });

  }

  if (firstImage && !firstImage.complete) {

    firstImage.addEventListener(
      "load",
      remeasure,
      { once: true }
    );

  }

  reducedMotion.addEventListener(
    "change",
    requestUpdate
  );

}


/* ==========================================================
   HOMEPAGE RESTORATION
========================================================== */

window.addEventListener("pageshow", event => {

  // Only run when the browser restores a cached page.
  // Fresh page loads use the normal initialization.

  if (!event.persisted) return;

  if (galleryTrack) {

    galleryTrack.querySelectorAll(
      ".home-journey-source-hidden"
    ).forEach(image => {

      image.classList.remove(
        "home-journey-source-hidden"
      );

    });

  }

  // Recalculate the existing cinematic scroll
  // positions without changing its animation rules.

  window.dispatchEvent(new Event("resize"));

});


/* ==========================================================
   HOMEPAGE DIRECTORY
   EXPANDING ARCHIVE / ABOUT / CONTACT PANELS
========================================================== */

function initializeDirectory() {

  const directory = document.querySelector(
    ".directory"
  );

  if (!directory) return;

  const panels = [
    ...directory.querySelectorAll(
      ".directory-panel"
    )
  ];

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  function setActivePanel(activePanel) {

    if (!activePanel) return;

    panels.forEach(panel => {

      const isActive = panel === activePanel;

      const trigger = panel.querySelector(
        ".directory-trigger"
      );

      const content = panel.querySelector(
        ".directory-panel-content"
      );

      panel.classList.toggle(
        "is-active",
        isActive
      );

      if (trigger) {
        trigger.setAttribute(
          "aria-expanded",
          String(isActive)
        );
      }

      if (content) {
        content.inert = !isActive;
      }

    });

  }

  panels.forEach(panel => {

    const trigger = panel.querySelector(
      ".directory-trigger"
    );

    // Desktop: hovering expands the panel.

    panel.addEventListener(
      "pointerenter",
      event => {

        if (!canHover.matches) return;

        if (event.pointerType === "touch") {
          return;
        }

        setActivePanel(panel);

      }
    );

    // All devices: clicking or tapping a panel
    // explicitly selects it.

    if (trigger) {

      trigger.addEventListener(
        "click",
        () => {
          setActivePanel(panel);
        }
      );

      // Keyboard users can also select panels.

      trigger.addEventListener(
        "focus",
        () => {
          setActivePanel(panel);
        }
      );

    }

  });

  // Archive is the default expanded destination.

  const initialPanel =
    directory.querySelector(
      ".directory-panel.is-active"
    ) || panels[0];

  setActivePanel(initialPanel);

}



/* ==========================================================
   12. HOMEPAGE INITIALIZATION
========================================================== */

function initializeHomepage() {

  document.documentElement.classList.add(
    "js-ready"
  );

  renderFeaturedWork();

  initializeLivingTransition();

  prepareFeaturedImages();

  initializeDirectory();

}

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeHomepage,
    { once: true }
  );

} else {

  initializeHomepage();

}
