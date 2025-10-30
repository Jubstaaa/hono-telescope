import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { telescopeApi } from '../api/telescopeApi';

export const store = configureStore({
  reducer: {
    [telescopeApi.reducerPath]: telescopeApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(telescopeApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
