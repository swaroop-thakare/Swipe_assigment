import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiService from '../services/api'
import websocketService from '../services/websocket'

const initialState = {
  candidates: [],
  currentCandidate: null,
  currentInterview: null,
  interviewInProgress: false,
  loading: false,
  error: null,
  connectionStatus: 'disconnected'
}

// Async thunks for API calls
export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getCandidates(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createCandidate = createAsyncThunk(
  'candidates/createCandidate',
  async (candidateData, { rejectWithValue }) => {
    try {
      const response = await apiService.createCandidate(candidateData)
      return response
    } catch (error) {
      // If candidate already exists, try to find and return the existing candidate
      if (error.message.includes('already exists')) {
        try {
          const existingCandidates = await apiService.getCandidates({ search: candidateData.email })
          if (existingCandidates.candidates && existingCandidates.candidates.length > 0) {
            return {
              candidate: existingCandidates.candidates[0],
              message: 'Using existing candidate profile'
            }
          }
        } catch (findError) {
          console.error('Error finding existing candidate:', findError)
        }
      }
      return rejectWithValue(error.message)
    }
  }
)

export const uploadResume = createAsyncThunk(
  'candidates/uploadResume',
  async (file, { rejectWithValue }) => {
    try {
      const response = await apiService.uploadResume(file)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const startInterview = createAsyncThunk(
  'candidates/startInterview',
  async (candidateId, { rejectWithValue }) => {
    try {
      const response = await apiService.startInterview(candidateId)
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitAnswer = createAsyncThunk(
  'candidates/submitAnswer',
  async ({ interviewId, answer, timeSpent, autoSubmitted = false }, { rejectWithValue }) => {
    try {
      const response = await apiService.submitAnswer(interviewId, {
        answer,
        timeSpent,
        autoSubmitted
      })
      return response
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload
    },
    setCurrentInterview: (state, action) => {
      state.currentInterview = action.payload
      state.interviewInProgress = action.payload ? true : false
    },
    updateConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload.connected ? 'connected' : 'disconnected'
    },
    clearError: (state) => {
      state.error = null
    },
    resetCurrentInterview: (state) => {
      state.currentInterview = null
      state.interviewInProgress = false
    }
  },
  extraReducers: (builder) => {
    // Fetch candidates
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false
        state.candidates = action.payload.candidates
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Create candidate
    builder
      .addCase(createCandidate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.loading = false
        state.currentCandidate = action.payload.candidate
        state.candidates.push(action.payload.candidate)
      })
      .addCase(createCandidate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Upload resume
    builder
      .addCase(uploadResume.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.loading = false
        // Handle resume upload result
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Start interview
    builder
      .addCase(startInterview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.loading = false
        state.currentCandidate = action.payload.candidate
        state.currentInterview = action.payload.interview
        state.interviewInProgress = true
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Submit answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false
        if (state.currentInterview) {
          state.currentInterview.answers.push(action.payload.answer)
          state.currentInterview.currentQuestionIndex += 1
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const {
  setCurrentCandidate,
  setCurrentInterview,
  updateConnectionStatus,
  clearError,
  resetCurrentInterview
} = candidatesSlice.actions

export default candidatesSlice.reducer
