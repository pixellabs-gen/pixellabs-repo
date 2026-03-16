use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use pixellabs_inference::{
    postprocess::{prepare_output, PostprocessOptions},
    scheduler::{Scheduler, SchedulerConfig},
    InferenceConfig, InferenceError, InferenceRequest, ModelVariant, Resolution, SynthetixPipeline,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let port = std::env::var("PIXELLABS_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(8080);

    let pipeline = SynthetixPipeline::new(InferenceConfig::default());
    let scheduler = Scheduler::new(SchedulerConfig::default());
    let state = Arc::new(AppState { pipeline, scheduler });

    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/generate", post(generate))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!(%addr, "PixelLabs inference server started");

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

#[derive(Clone)]
struct AppState {
    pipeline: SynthetixPipeline,
    scheduler: Scheduler,
}

#[derive(Debug, Deserialize)]
struct GenerateRequestBody {
    prompt: String,
    negative_prompt: Option<String>,
    steps: Option<u32>,
    guidance_scale: Option<f32>,
    seed: Option<u64>,
    width: Option<u32>,
    height: Option<u32>,
    model: Option<String>,
    priority: Option<f32>,
    include_base64: Option<bool>,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

async fn generate(
    State(state): State<Arc<AppState>>,
    Json(body): Json<GenerateRequestBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let config = build_config(&body)?;
    let priority = body.priority.unwrap_or(0.5);
    if !(0.0..=1.0).contains(&priority) {
        return Err(ApiError::from(InferenceError::InvalidConfig {
            field: "priority".to_string(),
            reason: "priority must be between 0.0 and 1.0".to_string(),
        }));
    }

    let request = InferenceRequest {
        id: Uuid::new_v4(),
        prompt: body.prompt.clone(),
        negative_prompt: body.negative_prompt.clone(),
        config,
        priority,
    };

    state.scheduler.enqueue(request.clone()).await?;
    let Some(next_request) = state.scheduler.dequeue().await? else {
        return Err(ApiError::from(InferenceError::SchedulerTimeout {
            timeout_ms: 0,
        }));
    };

    let result = state.pipeline.run(&next_request).await?;
    let options = PostprocessOptions {
        include_base64: body.include_base64.unwrap_or(true),
        include_bytes: false,
    };
    let payload = prepare_output(&result, options);

    Ok(Json(serde_json::json!({
        "id": payload.request_id,
        "content_hash": payload.content_hash,
        "image_base64": payload.image_base64,
        "metadata": payload.metadata,
    })))
}

fn build_config(body: &GenerateRequestBody) -> Result<InferenceConfig, ApiError> {
    let mut config = InferenceConfig::default();

    if let Some(steps) = body.steps {
        if !(10..=150).contains(&steps) {
            return Err(ApiError::from(InferenceError::InvalidConfig {
                field: "steps".to_string(),
                reason: "steps must be between 10 and 150".to_string(),
            }));
        }
        config.steps = steps;
    }

    if let Some(guidance) = body.guidance_scale {
        if !(1.0..=20.0).contains(&guidance) {
            return Err(ApiError::from(InferenceError::InvalidConfig {
                field: "guidance_scale".to_string(),
                reason: "guidance_scale must be between 1.0 and 20.0".to_string(),
            }));
        }
        config.guidance_scale = guidance;
    }

    if let Some(seed) = body.seed {
        config.seed = Some(seed);
    }

    if body.width.is_some() || body.height.is_some() {
        let width = body.width.unwrap_or(config.output_resolution.width);
        let height = body.height.unwrap_or(config.output_resolution.height);
        validate_resolution(width, height)?;
        config.output_resolution = Resolution { width, height };
    }

    if let Some(model) = body.model.as_deref() {
        config.model = parse_model(model)?;
    }

    Ok(config)
}

fn validate_resolution(width: u32, height: u32) -> Result<(), ApiError> {
    if width < 256 || height < 256 {
        return Err(ApiError::from(InferenceError::InvalidConfig {
            field: "resolution".to_string(),
            reason: "width/height must be at least 256".to_string(),
        }));
    }
    if width > 2048 || height > 2048 {
        return Err(ApiError::from(InferenceError::InvalidConfig {
            field: "resolution".to_string(),
            reason: "width/height must be at most 2048".to_string(),
        }));
    }
    if width % 64 != 0 || height % 64 != 0 {
        return Err(ApiError::from(InferenceError::InvalidConfig {
            field: "resolution".to_string(),
            reason: "width/height must be divisible by 64".to_string(),
        }));
    }
    Ok(())
}

fn parse_model(model: &str) -> Result<ModelVariant, ApiError> {
    match model {
        "synthetix-v1" => Ok(ModelVariant::SynthetixV1),
        "synthetix-v2" => Ok(ModelVariant::SynthetixV2),
        "diffusion-xl" => Ok(ModelVariant::DiffusionXL),
        _ => Err(ApiError::from(InferenceError::InvalidConfig {
            field: "model".to_string(),
            reason: "unsupported model variant".to_string(),
        })),
    }
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    error: InferenceError,
}

impl From<InferenceError> for ApiError {
    fn from(error: InferenceError) -> Self {
        let status = match error {
            InferenceError::PromptTooLong { .. } => StatusCode::BAD_REQUEST,
            InferenceError::EncodingFailed { .. } => StatusCode::UNPROCESSABLE_ENTITY,
            InferenceError::InvalidConfig { .. } => StatusCode::BAD_REQUEST,
            InferenceError::QueueFull { .. } => StatusCode::TOO_MANY_REQUESTS,
            InferenceError::SchedulerTimeout { .. } => StatusCode::REQUEST_TIMEOUT,
            InferenceError::OutOfMemory { .. } => StatusCode::SERVICE_UNAVAILABLE,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        Self { status, error }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = Json(ApiErrorBody {
            code: self.error.error_code(),
            message: self.error.to_string(),
        });

        (self.status, body).into_response()
    }
}

#[derive(Debug, Serialize)]
struct ApiErrorBody {
    code: &'static str,
    message: String,
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        error!(?error, "Unhandled error in inference server");
        ApiError::from(InferenceError::Internal(error))
    }
}
