// Mobile nav toggle
const header = document.querySelector(".header");
const btnMobileNav = document.querySelector(".btn-mobile-nav");

if (btnMobileNav && header) {
  btnMobileNav.addEventListener("click", () => {
    header.classList.toggle("nav-open");
  });
}

// Close mobile nav when clicking a menu link
document.querySelectorAll(".main-nav-link").forEach((link) => {
  link.addEventListener("click", () => header?.classList.remove("nav-open"));
});

// Optional: smooth-scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    }
  });
});
