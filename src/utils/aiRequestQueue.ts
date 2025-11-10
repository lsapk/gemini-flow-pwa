// AI Request Queue to prevent rate limiting
// Queues AI requests and processes them sequentially with delays

type QueuedRequest = {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
};

class AIRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private readonly minDelay = 1000; // 1 second between requests

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Wait before processing next request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay));
      }
    }

    this.processing = false;
  }
}

export const aiRequestQueue = new AIRequestQueue();
