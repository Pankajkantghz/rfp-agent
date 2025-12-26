import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5000/api";

export const fetchProposalsForRfp = createAsyncThunk(
  "proposals/fetchForRfp",
  async (rfpId) => {
    const res = await axios.get(`${API}/proposals/rfp/${rfpId}`);
    return { rfpId, proposals: res.data };
  }
);

export const compareProposals = createAsyncThunk(
  "proposals/compare",
  async (rfpId) => {
    const res = await axios.get(`${API}/ai/compare/${rfpId}`);
    return res.data;
  }
);

const proposalSlice = createSlice({
  name: "proposals",
  initialState: {
    byRfp: {},
    comparison: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposalsForRfp.fulfilled, (state, action) => {
        state.byRfp[action.payload.rfpId] = action.payload.proposals;
      })
      .addCase(compareProposals.fulfilled, (state, action) => {
        state.comparison = action.payload;
      });
  }
});

export default proposalSlice.reducer;
