use crate::InferenceResult;
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

/// Output configuration for post-processing.
#[derive(Debug, Clone)]
pub struct PostprocessOptions {
    pub include_base64: bool,
    pub include_bytes: bool,
}

impl Default for PostprocessOptions {
    fn default() -> Self {
        Self {
            include_base64: true,
            include_bytes: false,
        }
    }
}

/// Post-processed image payload ready for API delivery.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostprocessResult {
    pub request_id: Uuid,
    pub content_hash: String,
    pub image_base64: Option<String>,
    pub image_bytes: Option<Vec<u8>>,
    pub metadata: PostprocessMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostprocessMetadata {
    pub inference_time_ms: u64,
    pub steps_completed: u32,
    pub seed: u64,
    pub generated_at_ms: u64,
    pub clip_score: f32,
    pub aesthetic_score: f32,
}

pub fn prepare_output(result: &InferenceResult, options: PostprocessOptions) -> PostprocessResult {
    let base64_image = if options.include_base64 {
        Some(general_purpose::STANDARD.encode(&result.image_bytes))
    } else {
        None
    };

    let bytes = if options.include_bytes {
        Some(result.image_bytes.clone())
    } else {
        None
    };

    PostprocessResult {
        request_id: result.request_id,
        content_hash: result.content_hash.clone(),
        image_base64: base64_image,
        image_bytes: bytes,
        metadata: PostprocessMetadata {
            inference_time_ms: result.inference_time_ms,
            steps_completed: result.steps_completed,
            seed: result.seed,
            generated_at_ms: unix_ms(),
            clip_score: result.metrics.clip_score,
            aesthetic_score: result.metrics.aesthetic_score,
        },
    }
}

fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
