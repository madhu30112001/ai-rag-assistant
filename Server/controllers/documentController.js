import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import Document from '../models/Document.js';
import { ingestDocument } from '../services/ragService.js';
const require = createRequire(import.meta.url);
const parsePdf = require('pdf-parse');
const supportedExtensions = new Set(['.pdf', '.txt', '.md', '.csv']);
// Extract text from supported uploads before they are split and embedded.
function extractText(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!supportedExtensions.has(extension)) {
    const error = new Error(
      'Supported file types are PDF,txt, Markdown, and CSV.'
    );
    error.status = 400;
    throw error;
  }

  if (extension === '.pdf')
    return parsePdf(file.buffer).then((result) => result.text);
  return Promise.resolve(file.buffer.toString('utf8'));
}

export async function listDocuments(_request, response, next) {
  try {
    const documents = await Document.aggregate([
      {
        $group: {
          _id: '$documentId',
          name: { $first: '$source' },
          chunks: { $sum: 1 },
          addedAt: { $min: '$createdAt' },
        },
      },
      { $sort: { addedAt: -1 } },
    ]);

    response.json({
      documents: documents.map(({ _id, ...document }) => ({
        id: _id,
        ...document,
      })),
    });
  } catch (error) {
    const newerror = new Error('error in listing documents');
    newerror.status = 404;
    next(newerror);
  }
}

export async function uploadDocuments(request, response, next) {
  try {
    if (!request.files?.length) {
      return response
        .status(400)
        .json({ message: 'Choose at least one document to upload.' });
    }

    const results = [];
    for (const file of request.files) {
      const documentId = randomUUID();
      const text = await extractText(file);
      const chunks = await ingestDocument({
        documentId,
        source: file.originalname,
        text,
      });
      results.push({ id: documentId, name: file.originalname, chunks });
    }

    response.status(201).json({ documents: results });
  } catch (error) {
    const newerror = new Error('error in uploading documents');
    newerror.status = 404;
    next(newerror);
  }
}

export async function deleteDocument(request, response, next) {
  try {
    const result = await Document.deleteMany({ documentId: request.params.id });
    if (!result.deletedCount)
      return response.status(404).json({ message: 'Document not found.' });
    response.json({ message: 'Document removed.' });
  } catch (error) {
    const newerror = new Error('error in deleting document');
    newerror.status = 404;
    next(newerror);
  }
}
