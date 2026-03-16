use crate::{InferenceError, InferenceRequest};
use std::cmp::Ordering;
use std::collections::BinaryHeap;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::Mutex;

/// Scheduler configuration for queueing and timeout behavior.
#[derive(Debug, Clone)]
pub struct SchedulerConfig {
    pub max_queue: usize,
    pub timeout_ms: u64,
}

impl Default for SchedulerConfig {
    fn default() -> Self {
        Self {
            max_queue: 10_000,
            timeout_ms: 30_000,
        }
    }
}

/// Priority-aware scheduler for inference requests.
pub struct Scheduler {
    queue: Mutex<BinaryHeap<ScheduledItem>>,
    config: SchedulerConfig,
}

impl Scheduler {
    pub fn new(config: SchedulerConfig) -> Self {
        Self {
            queue: Mutex::new(BinaryHeap::new()),
            config,
        }
    }

    pub async fn enqueue(&self, request: InferenceRequest) -> Result<(), InferenceError> {
        let mut guard = self.queue.lock().await;
        if guard.len() >= self.config.max_queue {
            return Err(InferenceError::QueueFull {
                max: self.config.max_queue,
            });
        }

        guard.push(ScheduledItem::new(request));
        Ok(())
    }

    pub async fn dequeue(&self) -> Result<Option<InferenceRequest>, InferenceError> {
        let mut guard = self.queue.lock().await;
        let now_ms = unix_ms();

        while let Some(item) = guard.pop() {
            if now_ms.saturating_sub(item.queued_at_ms) > self.config.timeout_ms {
                return Err(InferenceError::SchedulerTimeout {
                    timeout_ms: self.config.timeout_ms,
                });
            }
            return Ok(Some(item.request));
        }

        Ok(None)
    }

    pub async fn queue_depth(&self) -> usize {
        let guard = self.queue.lock().await;
        guard.len()
    }
}

#[derive(Debug)]
struct ScheduledItem {
    request: InferenceRequest,
    priority: f32,
    queued_at_ms: u64,
}

impl ScheduledItem {
    fn new(request: InferenceRequest) -> Self {
        Self {
            priority: request.priority,
            queued_at_ms: unix_ms(),
            request,
        }
    }
}

impl PartialEq for ScheduledItem {
    fn eq(&self, other: &Self) -> bool {
        self.priority == other.priority && self.queued_at_ms == other.queued_at_ms
    }
}

impl Eq for ScheduledItem {}

impl PartialOrd for ScheduledItem {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ScheduledItem {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.priority.partial_cmp(&other.priority) {
            Some(Ordering::Equal) | None => other.queued_at_ms.cmp(&self.queued_at_ms),
            Some(ordering) => ordering,
        }
    }
}

fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
