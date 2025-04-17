export default {
  async fetch(request, env) {
    try {
      // parse the URL, read the subdomain
      let workerName = new URL(request.url).hostname.split('.')[0];
      // remove the environment from the worker name
      workerName = workerName.replace(/-(dev|prod|beta|test)$/, '');
      
      // Fetch the worker based on the subdomain and environment
      let userWorker = env.dispatcher.get(workerName);
      return await userWorker.fetch(request);
    } catch (e) {
      if (e.message.startsWith('Worker not found')) {
        // Handle case where worker is not found in the dispatch namespace
        return new Response('', { status: 404 });
      }

      // Handle any other errors (e.g., fetch error or worker-specific errors)
      return new Response(e.message, { status: 500 });
    }
  }
};