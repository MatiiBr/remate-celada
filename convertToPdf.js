const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const args = process.argv.slice(2);
  const htmlPath = args[0];
  const pdfPath = args[1];

  if (!htmlPath || !pdfPath) {
    console.error("Se requiere la ruta del HTML y el PDF");
    process.exit(1);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  await page.setContent(htmlContent, { waitUntil: "load" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    landscape: true,
    printBackground: true,
  });

  await browser.close();
  console.log(`📂 PDF guardado en: ${pdfPath}`);
})();