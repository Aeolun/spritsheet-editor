import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../Store";

export const SelectedArea = createSelector(
  (state: RootState) => state.tile,
  (state) => {
    return state.areas.find((area) => area.id === state.selectedAreaId);
  }
);
