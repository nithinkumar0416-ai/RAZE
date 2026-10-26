import { Response } from 'express';
import { SSEEvent } from '../models/types.js';

class EventBus {
  private clients: Map<string, Set<Response>> = new Map();

  public subscribe(runId: string, res: Response) {
    if (!this.clients.has(runId)) {
      this.clients.set(runId, new Set());
    }
    this.clients.get(runId)!.add(res);

    // Heartbeat every 15s to keep connection alive
    const timer = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
      } catch {
        clearInterval(timer);
      }
    }, 15000);

    res.on('close', () => {
      clearInterval(timer);
      const set = this.clients.get(runId);
      if (set) {
        set.delete(res);
        if (set.size === 0) {
          this.clients.delete(runId);
        }
      }
    });
  }

  public emit(event: SSEEvent) {
    const clients = this.clients.get(event.run_id);
    if (!clients || clients.size === 0) return;

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        console.error('Error writing SSE event:', err);
      }
    }
  }

  public emitGlobal(event: { type: string; data: any }) {
    for (const [, clientSet] of this.clients.entries()) {
      const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
      for (const res of clientSet) {
        try {
          res.write(payload);
        } catch {
          // Handled on close
        }
      }
    }
  }
}

export const eventBus = new EventBus();
