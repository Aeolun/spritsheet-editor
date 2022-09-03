// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Area } from "../../lib/Area";
import fs from "fs/promises";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filename = req.body.file;
  const areas: Area[] = req.body.areas;

  let currentFile: Record<string, Area[]> = {};
  try {
    const areaFile = await fs.readFile("areas.json");
    currentFile = JSON.parse(areaFile.toString());
  } catch (error) {}
  currentFile[filename] = areas;
  await fs.writeFile("areas.json", JSON.stringify(currentFile));

  res.status(200).json({ ok: true });
}
