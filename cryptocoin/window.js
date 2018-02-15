var file = require('fs');
var ccxt = require('ccxt')
var btcturk = new ccxt.btcturk();
var bitfinex = new ccxt.bitfinex();
var binance = new ccxt.binance();
var kucoin = new ccxt.kucoin();


const {
    app
} = require('electron').remote;
var log = require('electron-log');
var rootUserPath = app.getAppPath();
const path = require('path');

var taxFeeDict = {};
var btcTurkProps = {};


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
    bitfinex.fetchBalance().then(response => {
        //coins in the bitfinex balance are added to div
        for (var i = 0; i < response.info.length; i++) {
            if (response.info[i].amount > 0)
                addLabelAndInput(response.info[i].currency.toUpperCase(), "bitfinexAccount", response.info[i].amount);
        }
        for (var i = 0; i < response.info.length; i++) {
            if (response.info[i].amount != 0 && response.info[i].currency != "USD") {
                var currencyCode = bitfinex.commonCurrencyCode(response.info[i].currency.toUpperCase());
                if (currencyCode != "ETH") {
                    convertEthereumtoBtcturk(bitfinex, currencyCode, response.info[i].amount, "bitfinex").then(
                        (resultObject) => {
                            addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                        }
                    );
                }
                if (currencyCode != "BTC") {
                    convertBitcointoBtcturk(bitfinex, currencyCode, response.info[i].amount, "bitfinex").then(
                        (resultObject) => {
                            addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                        }
                    );
                }
            }
        }
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
                    convertEthereumtoBtcturk(kucoin, currencyCode, response.info[i].balance, "kucoin").then(
                        (resultObject) => {
                            if (resultObject.value > 0)
                                addLabelAndInput(resultObject.symbol, "kucoinOutputDiv", resultObject.value);
                        }
                    );
                }
                if (currencyCode != "BTC") {
                    convertBitcointoBtcturk(kucoin, currencyCode, response.info[i].balance, "kucoin").then(
                        (resultObject) => {
                            if (resultObject.value > 0)
                                addLabelAndInput(resultObject.symbol, "kucoinOutputDiv", resultObject.value);
                        }
                    );
                }
            }
        }
    });
}

var convertBinanceCoins = function () {
    binance.fetchBalance().then(response => {
        debugger;
        for (var i = 0; i < response.info.balances.length; i++) {
            var currencyCode = response.info.balances[i].asset;
            if (response.info.balances[i].free > 0)
                addLabelAndInput(currencyCode.toUpperCase(), "binanceAccount", response.info.balances[i].free);
        }
        for (var i = 0; i < response.info.balances.length; i++) {
            var currencyCode = response.info.balances[i].asset;
            if (response.info.balances[i].free != 0 && currencyCode != "USD") {
                if (currencyCode != "ETH") {
                    convertEthereumtoBtcturk(binance, currencyCode, response.info.balances[i].free, "binance").then(
                        (resultObject) => {
                            if (resultObject.value > 0)
                                addLabelAndInput(resultObject.symbol, "binanceOutputDiv", resultObject.value);
                        }
                    );
                }
                if (currencyCode != "BTC") {
                    convertBitcointoBtcturk(binance, currencyCode, response.info.balances[i].free, "binance").then(
                        (resultObject) => {
                            if (resultObject.value > 0)
                                addLabelAndInput(resultObject.symbol, "binanceOutputDiv", resultObject.value);
                        }
                    );
                }
            }
        }
    });
}

function convertEthereumtoBtcturk(marketApi, ticker, amount, market) {
    return new Promise((resolve, reject) => {
        marketApi.fetchTicker(ticker + "/ETH").then(
            response => {
                var amountAfterTaxes = amount - taxFeeDict[market + "_eth"];
                var priceByEth = response.last;
                var totalCoin = amountAfterTaxes * priceByEth;
                totalBtcTurkValue = totalCoin * (btcTurkProps.ethereumTry)
                var resultObject = {
                    value: totalBtcTurkValue,
                    symbol: ticker + "/ETH"
                };
                resolve(resultObject);
            }
        ).catch((error) => {
            log.error(error);
            reject(error);
        });
    });
}

function convertBitcointoBtcturk(marketApi, ticker, amount, market) {
    return new Promise((resolve, reject) => {
        marketApi.fetchTicker(ticker + "/BTC").then(
            response => {
                var amountAfterTaxes = amount - taxFeeDict[market + "_btc"];
                var priceByBtc = response.last;
                var totalCoin = amountAfterTaxes * priceByBtc;
                totalBtcTurkValue = totalCoin * (btcTurkProps.bitcoinTry);
                var resultObject = {
                    value: totalBtcTurkValue,
                    symbol: ticker + "/BTC"
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