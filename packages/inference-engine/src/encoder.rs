use crate::InferenceError;
use rand::{rngs::StdRng, Rng, SeedableRng};
use sha2::{Digest, Sha256};

const EMBEDDING_DIM: usize = 768;
const MAX_TOKENS: usize = 77;

/// Embedding output for a prompt and its optional negative prompt.
#[derive(Debug, Clone)]
pub struct PromptEmbedding {
    pub embedding: Vec<f32>,
    pub negative_embedding: Option<Vec<f32>>,
    pub token_count: usize,
    pub negative_token_count: usize,
}

/// Encodes a prompt (and optional negative prompt) into deterministic embeddings.
pub fn encode_prompt(
    prompt: &str,
    negative_prompt: Option<&str>,
) -> Result<PromptEmbedding, InferenceError> {
    let token_count = count_tokens(prompt);
    if token_count > MAX_TOKENS {
        return Err(InferenceError::PromptTooLong {
            tokens: token_count,
            max: MAX_TOKENS,
        });
    }

    let embedding = embedding_from_text(prompt);

    let (negative_embedding, negative_token_count) = if let Some(text) = negative_prompt {
        let neg_count = count_tokens(text);
        if neg_count > MAX_TOKENS {
            return Err(InferenceError::PromptTooLong {
                tokens: neg_count,
                max: MAX_TOKENS,
            });
        }
        (Some(embedding_from_text(text)), neg_count)
    } else {
        (None, 0)
    };

    Ok(PromptEmbedding {
        embedding,
        negative_embedding,
        token_count,
        negative_token_count,
    })
}

/// Counts whitespace-delimited tokens in a prompt.
pub fn count_tokens(text: &str) -> usize {
    tokenize(text).len()
}

fn tokenize(text: &str) -> Vec<&str> {
    text.split_whitespace().collect()
}

fn embedding_from_text(text: &str) -> Vec<f32> {
    let seed = seed_from_text(text);
    let mut rng = StdRng::seed_from_u64(seed);
    (0..EMBEDDING_DIM)
        .map(|_| rng.gen_range(-1.0..1.0))
        .collect()
}

fn seed_from_text(text: &str) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    let digest = hasher.finalize();
    let mut bytes = [0u8; 8];
    bytes.copy_from_slice(&digest[..8]);
    u64::from_le_bytes(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn count_tokens_splits_on_whitespace() {
        let text = "neon temple  with  haze";
        assert_eq!(count_tokens(text), 4);
    }

    #[test]
    fn encode_prompt_rejects_long_prompt() {
        let prompt = vec!["token"; MAX_TOKENS + 1].join(" ");
        let error = encode_prompt(&prompt, None).expect_err("should reject long prompt");
        match error {
            InferenceError::PromptTooLong { tokens, max } => {
                assert_eq!(tokens, MAX_TOKENS + 1);
                assert_eq!(max, MAX_TOKENS);
            }
            _ => panic!("unexpected error type"),
        }
    }
}
