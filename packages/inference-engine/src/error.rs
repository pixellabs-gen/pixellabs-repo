use std::fmt;

/// Errors produced by the Synthetix inference pipeline
#[derive(Debug, thiserror::Error)]
pub enum InferenceError {
    /// Prompt exceeds maximum allowed token length
    #[error("Prompt exceeds maximum token length: {tokens} tokens (max: {max})")]
    PromptTooLong { tokens: usize, max: usize },

    /// CLIP encoder failed to embed the prompt
    #[error("Text encoding failed: {message}")]
    EncodingFailed { message: String },

    /// Denoising pipeline encountered a numerical instability
    #[error("Pipeline instability at step {step}: {details}")]
    PipelineInstability { step: u32, details: String },

    /// GPU memory allocation failed
    #[error("GPU memory allocation failed: requested {requested_mib} MiB, available {available_mib} MiB")]
    OutOfMemory {
        requested_mib: u32,
        available_mib: u32,
    },

    /// Request timed out in the scheduler queue
    #[error("Request timed out after {timeout_ms}ms in scheduler queue")]
    SchedulerTimeout { timeout_ms: u64 },

    /// Invalid configuration parameter
    #[error("Invalid configuration: {field} — {reason}")]
    InvalidConfig { field: String, reason: String },

    /// I/O error during image serialization
    #[error("Image serialization error: {0}")]
    Serialization(#[from] image::ImageError),

    /// Internal anyhow error wrapper
    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl InferenceError {
    /// Returns an error code string suitable for API error responses
    pub fn error_code(&self) -> &'static str {
        match self {
            Self::PromptTooLong { .. } => "PROMPT_TOO_LONG",
            Self::EncodingFailed { .. } => "ENCODING_FAILED",
            Self::PipelineInstability { .. } => "PIPELINE_INSTABILITY",
            Self::OutOfMemory { .. } => "OUT_OF_MEMORY",
            Self::SchedulerTimeout { .. } => "SCHEDULER_TIMEOUT",
            Self::InvalidConfig { .. } => "INVALID_CONFIG",
            Self::Serialization(_) => "SERIALIZATION_ERROR",
            Self::Internal(_) => "INTERNAL_ERROR",
        }
    }

    /// Returns whether this error is retriable (transient)
    pub fn is_retriable(&self) -> bool {
        matches!(
            self,
            Self::OutOfMemory { .. } | Self::SchedulerTimeout { .. } | Self::Internal(_)
        )
    }
}
