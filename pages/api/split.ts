// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Area } from "../../lib/Area";
import replaceColor from "replace-color";
import Jimp from "jimp";
import { dataURItoBuffer } from "../../lib/dataURItoBuffer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const baseimage = dataURItoBuffer(req.body.base);
  const area: Area = req.body.area;

  const jimpImage: Jimp = await replaceColor({
    image: baseimage,
    colors: {
      type: "hex",
      targetColor: "#BFDCBF",
      replaceColor: "#00000000",
    },
  });

  const images = [];
  const frameWidth = area.width / area.framesX;
  const frameHeight = area.height / area.framesY;
  for (let j = 0; j < area.framesY; j++) {
    for (let i = 0; i < area.framesX; i++) {
      const image = await jimpImage
        .clone()
        .crop(
          area.x + frameWidth * i,
          area.y + frameHeight * j,
          frameWidth,
          frameHeight
        )
        .getBufferAsync("image/png");

      images.push(image.toString("base64"));
    }
  }

  res.status(200).json(
    images.map((data) => {
      return "data:image/png;base64," + data;
    })
  );
}
