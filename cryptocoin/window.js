var file = require('fs');
var ccxt = require('ccxt')
var btcturk = new ccxt.btcturk();
var bitfinex = new ccxt.bitfinex();
var binance = new ccxt.binance();
var kucoin = new ccxt.kucoin();

var log = require('electron-log');


var taxFeeDict = {};
var btcTurkProps = {};
var btcTurkTotalValues = {
    totalBitfinexBtcValue: 0,
    totalBitfinexEthValue: 0,
    totalKucoinBtcValue: 0,
    totalKucoinEthValue: 0,
    totalBinanceBtcValue: 0,
    totalBinanceEthValue: 0
};

$(() => {
    readTaxFeeList();
    getBtcTurkValues();

    $("#connectBitfinex").bind("click", function () {
        bitfinex.apiKey = document.getElementById('bitfinexPublicKey').value;
        bitfinex.secret = document.getElementById('bitfinexPrivateKey').value;
        bitfinex.loadMarkets();
        convertBitfinexCoins();
    });
    $("#connectKucoin").bind("click", function () {
        kucoin.apiKey = document.getElementById('kucoinPublicKey').value;
        kucoin.secret = document.getElementById('kucoinPrivateKey').value;
        kucoin.loadMarkets();
        convertKucoinCoins();
    });
    $("#connectBinance").bind("click", function () {
        binance.apiKey = document.getElementById('binancePublicKey').value;
        binance.secret = document.getElementById('binancePrivateKey').value;
        binance.loadMarkets();
        convertBinanceCoins();
    });
});

var addLabelAndInput = function (labelText, div, value) {

    var textDiv = document.createElement("div");
    var element = document.createElement("input");
    var label = document.createElement("Label");

    label.innerHTML = labelText;
    element.setAttribute("type", "text");
    element.setAttribute("value", value)
    element.setAttribute("style", "width:150px");
    label.setAttribute("style", "font-weight:normal");

    textDiv.appendChild(label);
    textDiv.appendChild(element);
    var accountDiv = document.getElementById(div);
    accountDiv.appendChild(textDiv);
}

var getBtcTurkValues = function () {
    //load btc latest values
    btcturk.fetchTickers().then(response => {
        btcTurkProps.bitcoinTry = response["BTC/TRY"].last;
        btcTurkProps.ethereumTry = response["ETH/TRY"].last;

        $('#bitcoin').text(btcTurkProps.bitcoinTry)
        $('#ethereum').text(btcTurkProps.ethereumTry)
    });
}

var convertBitfinexCoins = function () {
    var promises = [];
    bitfinex.fetchBalance().then(response => {
        response.info.
        filter(result => result.amount > 0 && result.currencyCode != "USD")
            .forEach(filteredResult => {
                addLabelAndInput(filteredResult.currency.toUpperCase(), "bitfinexAccount", filteredResult.amount);
                var currencyCode = bitfinex.commonCurrencyCode(filteredResult.currency.toUpperCase());
                if (currencyCode == "ETH") {
                    btcTurkTotalValues.totalBitfinexEthValue += filteredResult.amount * btcTurkProps.ethereumTry;
                }
                if (currencyCode != "ETH") {
                    promises.push(convertToBtcturk(bitfinex, currencyCode, filteredResult.amount, "bitfinex", "ETH").then(
                        (resultObject) => {
                            if (resultObject.value > 1) {
                                btcTurkTotalValues.totalBitfinexEthValue += resultObject.value;
                            } //under 1 turkish lira will not be seen
                            addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                        }
                    ));
                }
                if (currencyCode == "BTC") {
                    btcTurkTotalValues.totalBitfinexBtcValue += btcTurkProps.bitcoinTry;
                }
                if (currencyCode != "BTC") {
                    promises.push(convertToBtcturk(bitfinex, currencyCode, filteredResult.amount, "bitfinex", "BTC").then(
                        (resultObject) => {
                            if (resultObject.value > 1) {
                                btcTurkTotalValues.totalBitfinexBtcValue += resultObject.value;
                            } //under 1 turkish lira will not be seen
                            addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                        }
                    ));
                }
            });
        Promise.all(promises).then(() => {
            $('#totalBitfinexBtcValue').text(btcTurkTotalValues.totalBitfinexBtcValue);
            $('#totalBitfinexEthValue').text(btcTurkTotalValues.totalBitfinexEthValue);
        });
    });
}

var convertKucoinCoins = function () {
    kucoin.fetchBalance().then(response => {
        for (var i = 0; i < response.info.length; i++) {
            var currencyCode = response.info[i].coinType;
            if (response.info[i].balance > 0)
                addLabelAndInput(currencyCode.toUpperCase(), "kucoinAccount", response.info[i].balance);
        }
        for (var i = 0; i < response.info.length; i++) {
            var currencyCode = response.info[i].coinType;
            if (response.info[i].balance != 0 && currencyCode != "USD") {
                if (currencyCode != "ETH") {
                    convertToBtcturk(kucoin, currencyCode, response.info[i].balance, "kucoin").then(
                        (resultObject) => {
                            if (resultObject.value > 1) //under 1 turkish lira will not be seen
                                addLabelAndInput(resultObject.symbol, "kucoinOutputDiv", resultObject.value);
                        }
                    );
                }
                if (currencyCode != "BTC") {
                    convertToBtcturk(kucoin, currencyCode, response.info[i].balance, "kucoin").then(
                        (resultObject) => {
                            if (resultObject.value > 1) //under 1 turkish lira will not be seen
                                addLabelAndInput(resultObject.symbol, "kucoinOutputDiv", resultObject.value);
                        }
                    );
                }
            }
        }
    });
}

var convertBinanceCoins = function () {
    return new Promise((resolve, reject) => {
        binance.fetchBalance().then(response => {
            for (var i = 0; i < response.info.balances.length; i++) {
                var currencyCode = response.info.balances[i].asset;
                if (response.info.balances[i].free > 0)
                    addLabelAndInput(currencyCode.toUpperCase(), "binanceAccount", response.info.balances[i].free);
            }
            for (var i = 0; i < response.info.balances.length; i++) {
                var currencyCode = response.info.balances[i].asset;
                if (response.info.balances[i].free != 0 && currencyCode != "USD") {
                    if (currencyCode != "ETH") {
                        convertToBtcturk(binance, currencyCode, response.info.balances[i].free, "binance").then(
                            (resultObject) => {
                                if (resultObject.value > 1) //under 1 turkish lira will not be seen
                                    addLabelAndInput(resultObject.symbol, "binanceOutputDiv", resultObject.value);
                            }
                        );
                    }
                    if (currencyCode != "BTC") {
                        convertToBtcturk(binance, currencyCode, response.info.balances[i].free, "binance").then(
                            (resultObject) => {
                                if (resultObject.value > 1) //under 1 turkish lira will not be seen
                                    addLabelAndInput(resultObject.symbol, "binanceOutputDiv", resultObject.value);
                            }
                        );
                    }
                }
            }
        });
    });

}

function convertToBtcturk(marketApi, ticker, amount, market, convertTo) {
    return new Promise((resolve, reject) => {
        debugger;
        marketApi.fetchTicker(ticker + "/" + convertTo).then(
            response => {
                var amountAfterTaxes = amount - taxFeeDict[market + "_" + convertTo];
                var price = response.last;
                var totalCoin = amountAfterTaxes * price;
                if (convertTo == "ETH")
                    totalBtcTurkValue = totalCoin * (btcTurkProps.ethereumTry)
                if (convertTo == "BTC")
                    totalBtcTurkValue = totalCoin * (btcTurkProps.bitcoinTry)
                var resultObject = {
                    value: totalBtcTurkValue,
                    symbol: ticker + "/" + convertTo
                };
                resolve(resultObject);
            }
        ).catch((error) => {
            log.error(error);
            reject(error);
        });
    });
}

var readTaxFeeList = function () {
    try {
        file.readFileSync('TaxFeeList.txt').toString().split('\n').forEach(
            function (line) {
                var keyValuePair = line.split(':');
                taxFeeDict[keyValuePair[0]] = keyValuePair[1];
            }
        )
    } catch (error) {
        log.error(error);
    }
}