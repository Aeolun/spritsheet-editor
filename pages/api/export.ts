// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dataURItoBuffer } from "../../lib/dataURItoBuffer";
import { Area } from "../../lib/Area";
import replaceColor from "replace-color";
import Jimp from "jimp";
import fs from "node:fs/promises";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const baseimage = dataURItoBuffer(req.body.base);
  const areas: Area[] = req.body.areas;

  const jimpImage: Jimp = await replaceColor({
    image: baseimage,
    colors: {
      type: "hex",
      targetColor: "#BFDCBF",
      replaceColor: "#00000000",
    },
  });

  await Promise.all(
    areas.map(async (area) => {
      const image = await jimpImage
        .clone()
        .crop(area.x, area.y, area.width, area.height)
        .getBufferAsync("image/png");

      if (!area.category) return;

      await fs.mkdir("tmp/" + area.category, { recursive: true });
      await fs.writeFile(
        "tmp/" + area.category + "/" + area.name + ".png",
        image
      );
      await fs.writeFile(
        "tmp/" + area.category + "/" + area.name + ".json",
        JSON.stringify(
          {
            framesX: area.framesX,
            framesY: area.framesY,
            animations: area.animations,
          },
          null,
          2
        )
      );
    })
  );

  res.status(200).send("ok");
}
