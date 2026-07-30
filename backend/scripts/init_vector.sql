-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products for semantic search recommendations
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Add embedding column to chatbot logs for memory/context retrieval
ALTER TABLE "site_chatbot_question_log" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Create HNSW Indexes using cosine similarity
CREATE INDEX IF NOT EXISTS idx_product_embedding ON "product" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chatbot_log_embedding ON "site_chatbot_question_log" USING hnsw (embedding vector_cosine_ops);
