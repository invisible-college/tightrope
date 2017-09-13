// A Sync is an object which polls Poloniex for remote state and duplicates it locally,
// and allows a client / trader to register callbacks for when certain state changes.
//
// Two use cases:
// 1. Open Orders, which are keyed by orderId, get open, and then can close or be cancelled.
// 2. Candlesticks themselves:wq
