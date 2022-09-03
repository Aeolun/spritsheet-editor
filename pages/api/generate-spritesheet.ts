import type { NextApiRequest, NextApiResponse } from "next";
import spritesheet from "@pencil.js/spritesheet";
import fs from "node:fs/promises";
import glob from "glob-promise";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await fs.mkdir("tmpsheet", { recursive: true });

  const pngFiles = await glob("tmp/**/*.png");
  const jsonFiles = await glob("tmp/**/*.json");

  let { json, image } = await spritesheet(pngFiles, {
    outputFormat: "png",
    outputName: "spritesheet.png",
    margin: 0,
    crop: false,
  });

  json.animations = {};

  await Promise.all(
    jsonFiles.map(async (file) => {
      const data = await fs.readFile(file);

      const spriteJson = JSON.parse(data.toString());
      const pngFilePath = file.replace(".json", ".png");

      const frame = json.frames[pngFilePath];

      const singleWidth = frame.frame.w / spriteJson.framesX;
      const singleHeight = frame.frame.h / spriteJson.framesY;

      for (let j = 0; j < spriteJson.framesY; j++) {
        for (let i = 0; i < spriteJson.framesX; i++) {
          let name = pngFilePath;
          if (spriteJson.framesY > 1 || spriteJson.framesX > 1) {
            const index = j * spriteJson.framesX + i;
            name = pngFilePath + "_" + index;
          }
          json.frames[name] = {
            frame: {
              x: frame.frame.x + i * singleWidth,
              y: frame.frame.y + j * singleHeight,
              w: singleWidth,
              h: singleHeight,
            },
          };
        }
      }

      if (spriteJson.framesX > 1 || spriteJson.framesY > 1) {
        const animations: { id: number; name: string; frames: number[] }[] =
          spriteJson.animations && spriteJson.animations.length > 0
            ? spriteJson.animations
            : [
                {
                  id: 1,
                  name: "default",
                  frames: Array.from(
                    Array(spriteJson.framesX * spriteJson.framesY).keys()
                  ),
                },
              ];

        animations.forEach((anim) => {
          json.animations[pngFilePath + "_" + anim.name] = anim.frames.map(
            (index) => pngFilePath + "_" + index
          );
        });
      }

      if (spriteJson.framesY > 1 || spriteJson.framesX > 1) {
        delete json.frames[pngFilePath];
      }
    })
  );

  await fs.writeFile("tmpsheet/spritesheet.png", image);
  await fs.writeFile(
    "tmpsheet/spritesheet.json",
    JSON.stringify(json, null, 2)
  );

  res.status(200).send("ok");
}
