# tightrope

Tightrope is a Javascript framework for trading cryptocurrencies by managing candlesticks and a live orderbook.
It currently supports Poloniex and a rebalancing strategy.

## Credentials

To use Poloniex, you'll need to create a credentials file (e.g. named `creds-traderbotx.json`) with the following format:

```
{
  "apiKey": "AB2Q8OZ7-XXWXAI22-YNHUL0SK-SY219TLZ",
  "secret": "5b6782de3fd34c0d8a282962ecf82d546cff6203ed7f2b25b6ce9d20afa8f5d0d3252cbfc4b36c1fef9c77a7896db51c6a6897e88587a31f631983b5109286e5"
}
```
## Running Rebalance

You can run the rebalance strategy with this credentials file.

```
node rebalance.js creds-traderbotx.json BTC ETH live | tee rebalance_BTC_ETH.log
```

If you omit the last parameter, you will be running the bot in demo mode, where buys and sells will
be output to the console but not actually submitted to the exchange.

## Private Methods

You can also use tightrope to get your balances, trade history, deposit addresses, and other information.
You'll need to use your credentials file to access this private information associated with your exchange account.

```
node myBalances.js creds-traderbot2.json
```

The output will show you the total value of your balancies on all currencies.
```
BTC available: 0.08163465 onOrders 0.00046241
5850.89500057
Total: 480.3412779154953
ETH available: 1.36822587 onOrders 0
338.81553
Total: 463.57617330376115
Total Total 943.9174512192565
```
