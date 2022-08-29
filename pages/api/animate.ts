// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Area } from "../../lib/Area";
import sharp from "sharp";
import gifencoder from "gifencoder";
import * as fs from "fs";
import replaceColor from "replace-color";
import Jimp from "jimp";
import { GifFrame, GifCodec } from "gifwrap";

function dataURItoBuffer(dataURI: string) {
  var byteStr;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteStr = atob(dataURI.split(",")[1]);
  else byteStr = unescape(dataURI.split(",")[1]);

  var mimeStr = dataURI.split(",")[0].split(":")[1].split(";")[0];

  var arr = new Uint8Array(byteStr.length);
  for (var i = 0; i < byteStr.length; i++) {
    arr[i] = byteStr.charCodeAt(i);
  }

  return new Buffer(arr);
}

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

  const frames = [];
  const frameWidth = area.width / area.framesX;
  const frameHeight = area.height / area.framesY;
  for (let j = 0; j < area.framesY; j++) {
    for (let i = 0; i < area.framesX; i++) {
      const bitmap = jimpImage
        .clone()
        .crop(
          area.x + frameWidth * i,
          area.y + frameHeight * j,
          frameWidth,
          frameHeight
        ).bitmap;
      frames.push(new GifFrame(bitmap, { delayCentisecs: 10 }));
    }
  }

  const codec = new GifCodec();

  const codedGif = await codec.encodeGif(frames, { loops: undefined });

  res
    .status(200)
    .send("data:image/gif;base64," + codedGif.buffer.toString("base64"));
}
