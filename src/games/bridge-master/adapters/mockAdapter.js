import { createLmsAdapter } from "./lmsAdapter.js";
export function createMockAdapter() {
  const events = [],
    results = [];
  const adapter = createLmsAdapter({
    onEvent: (event) => {
      events.push(event);
      if (events.length > 200) events.shift();
    },
    onFinished: (result) => results.push(result),
  });
  return { ...adapter, events, results };
}
