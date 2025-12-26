import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api";

export const generateStructuredRfp = createAsyncThunk(
  "rfps/generateStructuredRfp",
  async (prompt) => {
    const res = await axios.post(`${API}/ai/rfp-structure`, { prompt });
    return res.data;
  }
);

export const fetchRfps = createAsyncThunk("rfps/fetchRfps", async () => {
  const res = await axios.get(`${API}/rfps`);
  return res.data;
});

export const createRfp = createAsyncThunk("rfps/createRfp", async (rfp) => {
  const res = await axios.post(`${API}/rfps`, rfp);
  return res.data;
});

const rfpSlice = createSlice({
  name: "rfps",
  initialState: {
    items: [],
    generated: null,
    status: "idle",
    error: null
  },
  reducers: {
    clearGenerated(state) {
      state.generated = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateStructuredRfp.pending, (state) => {
        state.status = "loading";
      })
      .addCase(generateStructuredRfp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.generated = action.payload;
      })
      .addCase(generateStructuredRfp.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchRfps.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(createRfp.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.generated = null;
      });
  }
});

export const { clearGenerated } = rfpSlice.actions;
export default rfpSlice.reducer;
