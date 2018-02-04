var file = require('fs');
var ccxt = require('ccxt')
var btcturk = new ccxt.btcturk();
var bitfinex = new ccxt.bitfinex();
var binance = new ccxt.binance();
var kucoin = new ccxt.kucoin();


var taxFeeDict = {};
var btcTurkProps = {};


$(() => {
    readTaxFeeList();
    getBtcTurkValues();

    $("#convertBtn").bind("click", function () {
        bitfinex.apiKey = document.getElementById('bitfinexPublicKey').value;
        bitfinex.secret = document.getElementById('bitfinexPrivateKey').value;
        kucoin.apiKey = document.getElementById('kucoinPublicKey').value;
        kucoin.secret = document.getElementById('kucoinPrivateKey').value;
        bitfinex.loadMarkets();
        convertBitfinexCoins();
        kucoin.loadMarkets();
        convertKucoinCoins();
    });
});

var addLabelAndInput = function (labelText, div, value) {

    var element = document.createElement("input");
    var label = document.createElement("Label");
    label.innerHTML = labelText;

    //Assign different attributes to the element.
    element.setAttribute("type", "text");
    element.setAttribute("value", value)
    element.setAttribute("style", "width:150px");
    label.setAttribute("style", "font-weight:normal");

    // 'foobar' is the div id, where new fields are to be added
    var accountDiv = document.getElementById(div);

    //Append the element in page (in span).
    accountDiv.appendChild(label);
    accountDiv.appendChild(element);
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
            reject(error);
        });
    });
}

var readTaxFeeList = function () {
    file.readFileSync('TaxFeeList.txt').toString().split('\n').forEach(
        function (line) {
            var keyValuePair = line.split(':');
            taxFeeDict[keyValuePair[0]] = keyValuePair[1];
        }
    )
}