import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api";

export const fetchVendors = createAsyncThunk("vendors/fetchVendors", async () => {
  const res = await axios.get(`${API}/vendors`);
  return res.data;
});

export const createVendor = createAsyncThunk("vendors/createVendor", async (vendor) => {
  const res = await axios.post(`${API}/vendors`, vendor);
  return res.data;
});

const vendorSlice = createSlice({
  name: "vendors",
  initialState: {
    items: []
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  }
});

export default vendorSlice.reducer;
