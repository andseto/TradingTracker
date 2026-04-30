const fs = require("fs");
const { PNG } = require("pngjs");

const src = fs.readFileSync("./public/anvil.png");
const png = PNG.sync.read(src);

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) * 4;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    if (r > 200 && g > 200 && b > 200) {
      // White background → transparent
      png.data[i + 3] = 0;
    } else {
      // Dark pixels → white
      png.data[i] = 255;
      png.data[i + 1] = 255;
      png.data[i + 2] = 255;
    }
  }
}

fs.writeFileSync("./public/anvil.png", PNG.sync.write(png));
console.log(`Done — ${png.width}x${png.height}px, white background removed.`);
