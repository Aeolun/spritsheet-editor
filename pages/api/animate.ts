// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Area } from "../../lib/Area";
import replaceColor from "replace-color";
import Jimp from "jimp";
import { GifFrame, GifCodec } from "gifwrap";
import { dataURItoBuffer } from "../../lib/dataURItoBuffer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const baseimage = dataURItoBuffer(req.body.base);
  const area: Area = req.body.area;
  const animation: string = req.body.animation;

  const jimpImage: Jimp = await replaceColor({
    image: baseimage,
    colors: {
      type: "hex",
      targetColor: "#BFDCBF",
      replaceColor: "#00000000",
    },
  });

  const animationFrames = area.animations?.find(
    (anim) => anim.name == animation
  )?.frames;

  const frames = [];
  const frameWidth = area.width / area.framesX;
  const frameHeight = area.height / area.framesY;
  for (let j = 0; j < area.framesY; j++) {
    for (let i = 0; i < area.framesX; i++) {
      if (animationFrames && animationFrames.includes(j * area.framesX + i)) {
        const bitmap = jimpImage
          .clone()
          .crop(
            area.x + frameWidth * i,
            area.y + frameHeight * j,
            frameWidth,
            frameHeight
          ).bitmap;
        frames.push(new GifFrame(bitmap, { delayCentisecs: 20 }));
      }
    }
  }

  const codec = new GifCodec();

  const codedGif = await codec.encodeGif(frames, { loops: undefined });

  res
    .status(200)
    .send("data:image/gif;base64," + codedGif.buffer.toString("base64"));
}
