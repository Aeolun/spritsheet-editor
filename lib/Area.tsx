export interface Animation {
  id: number;
  name: string;
  frames: number[];
}

export interface Area {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  framesX: number;
  framesY: number;
  animations?: Animation[];
}
