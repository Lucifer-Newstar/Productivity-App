export class FixedWindowLimiter {
  private readonly buckets = new Map<string, { start: number; count: number }>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly maximumBuckets = 1000) {}
  allow(key: string, now = Date.now()): boolean {
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.start >= this.windowMs) { bucket = { start: now, count: 0 }; this.buckets.set(key, bucket); }
    bucket.count++;
    if (this.buckets.size > this.maximumBuckets) this.prune(now);
    return bucket.count <= this.limit;
  }
  prune(now = Date.now()): void {
    for (const [key, bucket] of this.buckets) if (now - bucket.start >= this.windowMs) this.buckets.delete(key);
    while (this.buckets.size > this.maximumBuckets) this.buckets.delete(this.buckets.keys().next().value as string);
  }
}
