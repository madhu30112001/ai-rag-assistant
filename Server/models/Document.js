import mongoose from 'mongoose';

// Each document chunk stores its source text alongside its Gemini vector.
const DocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true },
    source: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

DocumentSchema.index({ documentId: 1 });

export default mongoose.model('documents', DocumentSchema);
