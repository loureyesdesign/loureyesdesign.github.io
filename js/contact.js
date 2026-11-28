
/* ==========================================================
   LOU REYES — CONTACT PAGE
========================================================== */

"use strict";


/* ==========================================================
   01. CONFIGURATION
========================================================== */

const CONTACT_EMAIL = "loupatrick2225@gmail.com";

const $ = id => document.getElementById(id);


/* ==========================================================
   02. THEME
========================================================== */

function initializeTheme() {

  const light = $("lightTheme");
  const dark = $("darkTheme");
  const themeColor = $("themeColor");

  function applyTheme(theme) {

    const next = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    localStorage.setItem("lou-reyes-theme", next);

    light.classList.toggle("active", next === "light");
    dark.classList.toggle("active", next === "dark");

    themeColor.content =
      next === "light" ? "#e9e7e1" : "#111111";

  }

  light.addEventListener("click", () => applyTheme("light"));
  dark.addEventListener("click", () => applyTheme("dark"));

  applyTheme(document.documentElement.dataset.theme);

}


/* ==========================================================
   03. FULLSCREEN NAVIGATION
========================================================== */

function initializeMenu() {

  const button = $("menuButton");
  const menu = $("menuScreen");

  function setMenu(open) {

    menu.classList.toggle("open", open);
    button.classList.toggle("active", open);

    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation"
    );

    menu.setAttribute("aria-hidden", String(!open));
    menu.inert = !open;

    document.body.classList.toggle("menu-open", open);

  }

  button.addEventListener("click", () => {
    setMenu(!menu.classList.contains("open"));
  });

  document.addEventListener("keydown", event => {

    if (
      event.key === "Escape" &&
      menu.classList.contains("open")
    ) {
      setMenu(false);
      button.focus();
    }

  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => setMenu(false));
  });

}


/* ==========================================================
   04. CONTACT FORM
========================================================== */

function initializeContactForm() {

  const form = $("contactForm");
  const note = $("contactFormNote");
  const emailLink = $("contactEmailLink");

  if (CONTACT_EMAIL) {

    emailLink.href = `mailto:${CONTACT_EMAIL}`;
    emailLink.textContent = CONTACT_EMAIL;

  } else {

    emailLink.removeAttribute("href");
    emailLink.textContent = "EMAIL NOT CONFIGURED";

    note.textContent =
      "Add your contact email in js/contact.js to enable messaging.";

  }

  form.addEventListener("submit", event => {

    event.preventDefault();

    if (!form.reportValidity()) return;

    if (!CONTACT_EMAIL) {

      note.textContent =
        "Contact email has not been configured yet.";

      return;

    }

    const name = $("contactName").value.trim();
    const email = $("contactEmail").value.trim();
    const subject = $("contactSubject").value;
    const message = $("contactMessage").value.trim();

    const emailSubject = encodeURIComponent(
      `${subject} — Lou Reyes Portfolio`
    );

    const emailBody = encodeURIComponent(
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Inquiry: ${subject}\n\n` +
      `${message}`
    );

    window.location.href =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${emailSubject}` +
      `&body=${emailBody}`;

    note.textContent =
      "Your email application should open with the message prepared. Please send it from there.";

  });

}


/* ==========================================================
   05. INITIALIZATION
========================================================== */

function initializeContactPage() {

  initializeTheme();
  initializeMenu();
  initializeContactForm();

}

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeContactPage
  );

} else {

  initializeContactPage();

}
