import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../Store";
import { SelectedArea } from "./SelectedArea";

export const SelectedAnimation = createSelector(
  SelectedArea,
  (state: RootState) => state.tile.selectedAnimationId,
  (area, selectedAreaId) => {
    return area?.animations?.find((anim) => anim.id === selectedAreaId);
  }
);
