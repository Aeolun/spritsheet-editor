import { configureStore } from "@reduxjs/toolkit";
import { tileReducer } from "./tile/slice";

export const store = configureStore({
  reducer: {
    tile: tileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
