import * as PIXI from "https://cdn.skypack.dev/pixi.js";
import { KawaseBlurFilter } from "https://cdn.skypack.dev/@pixi/filter-kawase-blur";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise";
import hsl from "https://cdn.skypack.dev/hsl-to-hex";
import debounce from "https://cdn.skypack.dev/debounce";

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function map(n, start1, end1, start2, end2) {
  return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

const simplex = new SimplexNoise();

class ColorPalette {
  constructor() {
    this.setColors();
    this.setCustomProperties();
  }

  setColors() {
    // random hue
    this.hue = ~~random(220, 360);
    this.complimentaryHue1 = this.hue + 30;
    this.complimentaryHue2 = this.hue + 60;
    // saturation 
    this.saturation = 95;
    this.lightness = 50;

    // base corlor
    this.baseColor = hsl(this.hue, this.saturation, this.lightness);
    // complimentary colour
    this.complimentaryColor1 = hsl(
      this.complimentaryHue1,
      this.saturation,
      this.lightness
    );
    // second complimentary colour
    this.complimentaryColor2 = hsl(
      this.complimentaryHue2,
      this.saturation,
      this.lightness
    );

    // store it to the array so it can be picked out later
    this.colorChoices = [
      this.baseColor,
      this.complimentaryColor1,
      this.complimentaryColor2
    ];
  }

  randomColor() {
    // pick a random color
    return this.colorChoices[~~random(0, this.colorChoices.length)].replace(
      "#",
      "0x"
    );
  }

  setCustomProperties() {
    // custom css properties
    document.documentElement.style.setProperty("--hue", this.hue);
    document.documentElement.style.setProperty(
      "--hue-complimentary1",
      this.complimentaryHue1
    );
    document.documentElement.style.setProperty(
      "--hue-complimentary2",
      this.complimentaryHue2
    );
  }
}

// orb shit
class Orb {
  // pixi is weird
  constructor(fill = 0x000000) {
    // how much the orb cn move
    this.bounds = this.setBounds();
    // xy values
    this.x = random(this.bounds["x"].min, this.bounds["x"].max);
    this.y = random(this.bounds["y"].min, this.bounds["y"].max);

    // orb vs original radius
    this.scale = 1;

    // orbs colour is chose
    this.fill = fill;

    // orginal radius ofnthe orb
    this.radius = random(window.innerHeight / 6, window.innerHeight / 3);

    // louis was here :P
    this.xOff = random(0, 1000);
    this.yOff = random(0, 1000);
    // how quickly it goes
    this.inc = 0.002;

    // louis was here too :P
    this.graphics = new PIXI.Graphics();
    this.graphics.alpha = 0.825;

    // 250ms after recalcutlate it
    window.addEventListener(
      "resize",
      debounce(() => {
        this.bounds = this.setBounds();
      }, 250)
    );
  }

  setBounds() {
    //how far each orb is able to move
    const maxDist =
      window.innerWidth < 1000 ? window.innerWidth / 3 : window.innerWidth / 5;
    // the { x, y } origin for each orb (the bottom right of the screen)
    const originX = window.innerWidth / 1.25;
    const originY =
      window.innerWidth < 1000
        ? window.innerHeight
        : window.innerHeight / 1.375;

    // allow each orb to move x distance
    return {
      x: {
        min: originX - maxDist,
        max: originX + maxDist
      },
      y: {
        min: originY - maxDist,
        max: originY + maxDist
      }
    };
  }

  update() {
    // louis was here too too :P
    const xNoise = simplex.noise2D(this.xOff, this.xOff);
    const yNoise = simplex.noise2D(this.yOff, this.yOff);
    const scaleNoise = simplex.noise2D(this.xOff, this.yOff);

    // why u reading this bruh js is literal cancer
    this.x = map(xNoise, -1, 1, this.bounds["x"].min, this.bounds["x"].max);
    this.y = map(yNoise, -1, 1, this.bounds["y"].min, this.bounds["y"].max);
    // STOP
    this.scale = map(scaleNoise, -1, 1, 0.5, 1);

    // time stuff
    this.xOff += this.inc;
    this.yOff += this.inc;
  }

  render() {
    // louis was here too too again :P
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.scale.set(this.scale);

    // clear anything drawn to graphics as of the momebnt
    this.graphics.clear();

    // tell graphics to fill any shapes drawn after this with the orb's fill color
    this.graphics.beginFill(this.fill);
    // draw da circule
    this.graphics.drawCircle(0, 0, this.radius);
    // let graphics know we wont be filling in any more shapes
    this.graphics.endFill();
  }
}

// create pixi app
const app = new PIXI.Application({
  // render to canvas bit
  view: document.querySelector(".orb-canvas"),
  // auto adjust size to fit the current window
  resizeTo: window,
  // transparent background 
  transparent: true
});

// stop looking at my code D:
const colorPalette = new ColorPalette();

app.stage.filters = [new KawaseBlurFilter(30, 10, true)];

// create the orbs
const orbs = [];

for (let i = 0; i < 10; i++) {
  const orb = new Orb(colorPalette.randomColor());

  app.stage.addChild(orb.graphics);

  orbs.push(orb);
}

// animate this mofo
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  app.ticker.add(() => {
    orbs.forEach((orb) => {
      orb.update();
      orb.render();
    });
  });
} else {
  orbs.forEach((orb) => {
    orb.update();
    orb.render();
  });
}
