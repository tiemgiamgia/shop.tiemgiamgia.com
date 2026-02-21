window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (!header) return;

  if (window.scrollY > 50) {
    header.style.position = "sticky";
    header.style.top = "0";
  } else {
    header.style.position = "relative";
  }
});
