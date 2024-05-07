// import kaboom from "/kaboom";
import kaboom from "https://unpkg.com/kaboom@2000.2.10/dist/kaboom.mjs";

import { levels } from "./levels.js";
import * as func from "./functions.js";
import * as config from "./config.js";

kaboom({
  global: true,
  fullscreen: true,
  scale: 2.5,
  debug: true,
  background: [0, 0, 0],
});

let inAir = true;
let lookingForward = true;

loadRoot("./tiles/");

// Backgrounds
loadSprite("forestBg", "forestBg.png");
loadSprite("stoneBg", "stoneBg.png");
loadSprite("desertBg", "desertBg.png");
loadSprite("iceBg", "iceBg.png");
loadSprite("jungBg", "jungBg.png");

// Terrain models
loadSprite("sand", "sand.png");
loadSprite("plain", "plain.png");
loadSprite("stone", "stone.png");
loadSprite("ice", "ice.png");
loadSprite("jungle", "jungle.png");

// Player model
loadSprite("main", "mainChar.png", {
  sliceX: 4,
  sliceY: 4,
  anims: {
    idle: {
      from: 8,
      to: 8,
    },
    walk: {
      from: 8,
      to: 11,
      speed: 5,
    },
  },
});

// Enemies models
loadSprite("enemy", "idleEnemy.png", {
  sliceX: 8,
  sliceY: 0,
  anims: {
    idle: {
      from: 0,
      to: 7,
      loop: true,
    },
  },
});

// Extras (Portals, interaction)
loadSprite("coin", "coinCopper.png", {
  sliceX: 8,
  sliceY: 0,
  anims: {
    rotate: {
      from: 0,
      to: 7,
      loop: true,
    },
  },
});
loadSprite("spike", "spikes3.png");
loadSprite("portal_purple", "portal.png", {
  sliceX: 8,
  sliceY: 3,
  anims: {
    rotate: {
      from: 0,
      to: 7,
      loop: true,
    },
  },
});
loadSprite("fireball", "fireball.png", {
  sliceX: 3,
  sliceY: 2,
  anims: {
    move: {
      from: 0,
      to: 5,
      loop: true,
    },
  },
});

scene("gameScreen", ({ level, score }) => {
  layers(["bg", "obj", "ui"], "obj");

  add([rect(0, 0), pos(10, 10), outline(0), sprite(func.lvBG(level))]);

  const levelCfg = {
    width: 20,
    height: 20,

    ["="]: () => [sprite(func.terrain(level)), area(), solid(), "terrain"],
    ["e"]: () => [
      sprite("enemy", { anim: "idle" }),
      area({ height: 80, width: 20 }),
      solid(),
      origin("center"),
      scale(0.7),
      body(),
      "enemy",
    ],
    ["s"]: () => [sprite("spike"), area(), solid(), "badTerrain"],
    ["x"]: () => [
      sprite("coin", { anim: "rotate" }),
      area(),
      scale(0.7),
      "goodCoin",
    ],
    ["v"]: () => [
      sprite("portal_purple", { anim: "rotate" }),
      area({ width: 1, height: 40 }),
      origin("center"),
      "portal",
    ],
  };

  const gameLevel = addLevel(levels[level], levelCfg);

  const scoreBoard = add([
    text("score"),
    pos(30, 0),
    layer("ui"),
    {
      value: score,
    },
    scale(0.2),
  ]);

  const player = add([
    sprite("main", { anim: "idle" }),
    area({ height: 38, width: 20 }),
    solid(),
    pos(40, 40),
    body(),
    origin("center"),
    scale(0.8),
  ]);

  action("enemy", (e) => {
    if (player.pos.x < e.pos.x) {
      e.move(-20, 0);
      e.flipX(true);
    } else {
      e.flipX();
      e.move(20, 0);
    }
  });

  player.action(() => {
    camPos(player.pos);
  });

  ///////////////// Collisions ///////////////////

  player.collides("enemy", (e) => {
    if (inAir) {
      e.destroy();
      scoreBoard.value += 1;
      scoreBoard.text = scoreBoard.value;
    } else go("lostScene", { score: scoreBoard.value });
  });

  player.collides("goodCoin", (c) => {
    c.destroy();
    scoreBoard.value += 1;
    scoreBoard.text = scoreBoard.value;
  });

  player.collides("badTerrain", (t) => {
    go("lostScene", { score: scoreBoard.value });
  });

  player.collides("portal", (p) => {
    go("gameScreen", {
      level: (level + 1) % levels.length,
      score: scoreBoard.value,
    });
  });

  collides("enemy", "fireball", (e, f) => {
    shake(1);
    e.destroy();
    f.destroy();
    scoreBoard.value += 1;
    scoreBoard.text = scoreBoard.value;
  });

  collides("terrain", "fireball", (t, f) => {
    f.destroy();
  });

  collides("enemy", "terrain", (e, t) => {
    e.jump(config.JUMP_FORCE);
  });
  collides("enemy", "badTerrain", (e, t) => {
    e.jump(config.JUMP_FORCE);
  });

  //////////// Movement //////////////
  keyPress("d", () => {
    player.play("walk", { loop: true });
  });
  keyRelease("d", () => {
    player.play("idle");
  });
  keyPress("a", () => {
    player.play("walk", { loop: true });
  });
  keyRelease("a", () => {
    player.play("idle");
  });

  keyDown("d", () => {
    player.move(config.MOVE_SPEED, 0);
    if (!lookingForward) {
      player.flipX();
      lookingForward = true;
    }
  });
  keyDown("a", () => {
    player.move(-config.MOVE_SPEED, 0);
    if (lookingForward) {
      player.flipX(true);
      lookingForward = false;
    }
  });

  player.action(() => {
    if (player.grounded()) {
      inAir = false;
    }
    if (!player.grounded()) {
      inAir = true;
    }
  });
  keyPress("space", () => {
    if (player.grounded()) {
      player.jump(config.JUMP_FORCE);
    }
    if (!player.grounded()) {
      inAir = true;
    }
  });

  keyPress("t", () => {
    console.log(config);
  });

  // setInterval(() => {
  //   console.log(inAir);
  // }, 700);

  mouseClick(() => {
    add([
      sprite("fireball", {
        anim: "move",
        flipX: lookingForward ? true : false,
      }),
      pos(player.pos.x, player.pos.y - 3),
      scale(0.1),
      move(lookingForward ? RIGHT : LEFT, config.MOVE_SPEED + 200),
      lifespan(6),
      area({ scale: 0.5 }),
      origin(lookingForward ? "right" : "left"),
      "fireball",
    ]);
  });
});

scene("lostScene", ({ score }) => {
  add([text(score, 32), origin("center"), pos(width() / 2, height() / 2)]);
  add([text("Press R to Restart"), scale(0.3)]);
  keyPress("r", () => {
    go("gameScreen", { level: 0, score: 0 });
  });
});

go("gameScreen", { level: 0, score: 0 });
