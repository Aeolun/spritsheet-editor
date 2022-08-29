import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Animation, Area } from "../../lib/Area";

interface State {
  captureArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  areas: Area[];
  snap: {
    x: number;
    y: number;
  };
  image?: {
    name: string;
    data: string;
  };
  animationPreview?: string;
  frameImages: string[];
  selectedAreaId?: number;
  selectedAnimationId?: number;
  zoomLevel: number;
}

function keys<T extends object>(obj: T) {
  return Object.keys(obj) as Array<keyof T>;
}

const initialState: State = {
  areas: [],
  snap: {
    x: 1,
    y: 1,
  },
  frameImages: [],
  zoomLevel: 1,
};

export const slice = createSlice({
  name: "tile",
  initialState,
  reducers: {
    addArea: (state, action: PayloadAction<Area>) => {
      state.areas.push(action.payload);
    },
    setAreas: (state, action: PayloadAction<Area[]>) => {
      state.areas = action.payload;
    },
    modifyArea: (
      state,
      action: PayloadAction<{
        id: number;
        values: Partial<Area>;
      }>
    ) => {
      const modifyAreaIndex = state.areas.findIndex(
        (area) => area.id == action.payload.id
      );
      state.areas[modifyAreaIndex] = {
        ...state.areas[modifyAreaIndex],
        ...action.payload.values,
      };
    },
    modifySelectedArea: (state, action: PayloadAction<Partial<Area>>) => {
      const modifyAreaIndex = state.areas.findIndex(
        (area) => area.id == state.selectedAreaId
      );
      state.areas[modifyAreaIndex] = {
        ...state.areas[modifyAreaIndex],
        ...action.payload,
      };
    },
    deleteArea: (state, action: PayloadAction<number>) => {
      state.areas = state.areas.filter((area) => {
        return area.id !== action.payload;
      });
    },
    setImage: (state, action: PayloadAction<State["image"]>) => {
      state.image = action.payload;
    },
    setFrameImages: (state, action: PayloadAction<State["frameImages"]>) => {
      state.frameImages = action.payload;
    },
    setAnimationPreview: (
      state,
      action: PayloadAction<State["animationPreview"]>
    ) => {
      state.animationPreview = action.payload;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    increaseZoomLevel: (state, action: Action) => {
      state.zoomLevel++;
    },
    decreaseZoomLevel: (state, action: Action) => {
      state.zoomLevel--;
    },
    setSnap: (state, action: PayloadAction<State["snap"]>) => {
      state.snap = action.payload;
    },
    selectArea: (state, action: PayloadAction<number>) => {
      state.selectedAreaId = action.payload;
      state.animationPreview = undefined;
    },
    addAnimation: (state, action: PayloadAction<Animation>) => {
      const modifyArea = state.areas.find(
        (area) => area.id == state.selectedAreaId
      );
      if (modifyArea && !modifyArea.animations) {
        modifyArea.animations = [];
      }
      modifyArea?.animations?.push(action.payload);
    },
    selectAnimation: (state, action: PayloadAction<number>) => {
      state.selectedAnimationId = action.payload;
    },
    toggleFrameForAnimation: (state, action: PayloadAction<number>) => {
      const modifyArea = state.areas.find(
        (area) => area.id == state.selectedAreaId
      );
      const modifyAnimation = modifyArea?.animations?.find((anim) => {
        return anim.id === state.selectedAnimationId;
      });

      if (modifyAnimation) {
        if (modifyAnimation.frames.includes(action.payload)) {
          modifyAnimation.frames = modifyAnimation.frames.filter(
            (i) => i !== action.payload
          );
        } else {
          modifyAnimation.frames.push(action.payload);
        }
      }
    },
    modifySelectedAnimation: (
      state,
      action: PayloadAction<Partial<Animation>>
    ) => {
      const modifyArea = state.areas.find(
        (area) => area.id == state.selectedAreaId
      );
      const modifyAnimationIndex = modifyArea?.animations?.findIndex((anim) => {
        return anim.id === state.selectedAnimationId;
      });
      console.log(modifyAnimationIndex);
      if (
        modifyAnimationIndex !== undefined &&
        modifyAnimationIndex > -1 &&
        modifyArea?.animations
      ) {
        modifyArea.animations[modifyAnimationIndex] = {
          ...modifyArea.animations[modifyAnimationIndex],
          ...action.payload,
        };
      }
    },
    deleteAnimation: (state, action: PayloadAction<number>) => {
      const modifyArea = state.areas.find(
        (area) => area.id == state.selectedAreaId
      );
      if (modifyArea && modifyArea.animations) {
        modifyArea.animations = modifyArea.animations.filter(
          (anim) => anim.id !== action.payload
        );
      }
    },
  },
});

export const tileReducer = slice.reducer;
export const tileActions = slice.actions;
