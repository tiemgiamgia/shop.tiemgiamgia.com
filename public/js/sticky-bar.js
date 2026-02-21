window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add("sticky");
  } else {
    header.classList.remove("sticky");
  }
});