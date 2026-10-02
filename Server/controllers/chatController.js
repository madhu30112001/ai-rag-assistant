import { answerWithContext } from '../services/ragService.js';

// Validate the chat request, run retrieval, and forward service failures.
export async function chat(request, response, next) {
  try {
    const { message, history } = request.body;
    if (typeof message !== 'string' || !message.trim()) {
      return response
        .status(400)
        .json({ message: 'Enter a question before sending.' });
    }

    const result = await answerWithContext({
      message: message.trim().slice(0, 4000),
      history,
    });
    response.json(result);
  } catch (error) {
    console.error('Error in chat controller:', error);
    const newerror = new Error('embedding request failed');
    newerror.status = 404;
    next(newerror);
  }
}
