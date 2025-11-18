use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Core inference pipeline for the Synthetix Vision Architecture.
/// Handles denoising steps, latent space sampling, and tensor operations
/// for high-fidelity image synthesis.
pub mod pipeline;

/// CLIP-based text encoder for semantic prompt embedding
pub mod encoder;

/// GPU/CPU scheduler for distributed inference across edge nodes
pub mod scheduler;

/// Image post-processing: upscaling, format conversion, IPFS preparation
pub mod postprocess;

/// Error types for the inference engine
pub mod error;

pub use error::InferenceError;

/// Generation quality configuration for the denoising pipeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceConfig {
    /// Number of diffusion denoising steps
    pub steps: u32,

    /// Classifier-free guidance scale
    pub guidance_scale: f32,

    /// Latent space dimensions [H, W]
    pub latent_dims: [u32; 2],

    /// Random seed for reproducibility (None = random)
    pub seed: Option<u64>,

    /// Target output resolution
    pub output_resolution: Resolution,

    /// Model variant to use for generation
    pub model: ModelVariant,
}

impl Default for InferenceConfig {
    fn default() -> Self {
        Self {
            steps: 50,
            guidance_scale: 7.5,
            latent_dims: [64, 64],
            seed: None,
            output_resolution: Resolution { width: 1024, height: 1024 },
            model: ModelVariant::SynthetixV2,
        }
    }
}

/// Output image resolution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

/// Available model variants for the Synthetix generation pipeline
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModelVariant {
    SynthetixV1,
    SynthetixV2,
    DiffusionXL,
}

/// Inference request sent to the engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    /// Unique request identifier
    pub id: Uuid,

    /// Primary text prompt
    pub prompt: String,

    /// Optional negative prompt to guide away from undesired features
    pub negative_prompt: Option<String>,

    /// Inference configuration parameters
    pub config: InferenceConfig,

    /// Priority weight for the request scheduler (0.0–1.0)
    pub priority: f32,
}

impl InferenceRequest {
    /// Creates a new inference request with default configuration
    pub fn new(prompt: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            prompt: prompt.into(),
            negative_prompt: None,
            config: InferenceConfig::default(),
            priority: 0.5,
        }
    }

    /// Attaches a negative prompt to the request
    pub fn with_negative_prompt(mut self, negative_prompt: impl Into<String>) -> Self {
        self.negative_prompt = Some(negative_prompt.into());
        self
    }

    /// Sets custom inference configuration
    pub fn with_config(mut self, config: InferenceConfig) -> Self {
        self.config = config;
        self
    }
}

/// Result of a completed inference job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    /// Original request ID
    pub request_id: Uuid,

    /// Raw PNG image bytes
    pub image_bytes: Vec<u8>,

    /// BLAKE3 hash of the image for deduplication
    pub content_hash: String,

    /// Actual number of denoising steps completed
    pub steps_completed: u32,

    /// Total wall-clock inference time in milliseconds
    pub inference_time_ms: u64,

    /// Resolved seed used (useful when None was passed)
    pub seed: u64,

    /// Quality metrics collected during inference
    pub metrics: InferenceMetrics,
}

/// Quality and performance metrics for a generation run
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InferenceMetrics {
    /// CLIP score measuring prompt-image alignment (0.0–1.0)
    pub clip_score: f32,

    /// Aesthetic score from classifier head (0.0–10.0)
    pub aesthetic_score: f32,

    /// Peak GPU memory used in MiB
    pub peak_gpu_memory_mib: u32,

    /// Throughput in tokens/second for text encoder
    pub encoder_throughput: f32,

    /// Latency per denoising step in milliseconds
    pub step_latency_ms: Vec<f32>,

    /// Additional telemetry key-value pairs
    pub telemetry: HashMap<String, serde_json::Value>,
}
