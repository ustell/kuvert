export let bootReady: Promise<void> = Promise.resolve();

// вызывать из main.ts
export function setBootReady(p: Promise<any>) {
  bootReady = p.then(() => {}).catch(() => {});
}
