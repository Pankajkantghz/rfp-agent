import { configureStore } from "@reduxjs/toolkit";
import rfpReducer from "../features/rfpSlice";
import vendorReducer from "../features/vendorSlice";
import proposalReducer from "../features/proposalSlice";

export const store = configureStore({
  reducer: {
    rfps: rfpReducer,
    vendors: vendorReducer,
    proposals: proposalReducer
  }
});
