let pageTitle = document.title;
let pageURL = document.URL;
let heading = document.querySelector("h1")?.innerText || "No <h1> found";

function showPageInfo() {
  console.log("📄 Page Title:", pageTitle);
  console.log("🔗 Page URL:", pageURL);
  console.log("🔠 First H1 text:", heading);
}

showPageInfo();