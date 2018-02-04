var ccxt = require('ccxt')
var btcturk = new ccxt.btcturk();
var bitfinex = new ccxt.bitfinex();
var binance = new ccxt.binance();

var bitfinexProps = {
    ethereumWithdrawalFee: 0.01,
    bitcoinWithdrawlFee: 0.0008
};

var btcTurkProps = {};


$(() => {
    //load btc latest values
    var btcturk = new ccxt.btcturk();
    btcturk.fetchTickers().then(response => {
        btcTurkProps.bitcoinTry = response["BTC/TRY"].last;
        btcTurkProps.ethereumTry = response["ETH/TRY"].last;

        $('#bitcoin').text(btcTurkProps.bitcoinTry)
        $('#ethereum').text(btcTurkProps.ethereumTry)
    })


    $("#convertBtn").bind("click", function () {
        bitfinex.apiKey = document.getElementById('publicKey').value;
        bitfinex.secret = document.getElementById('privateKey').value;
        bitfinex.loadMarkets();
        bitfinex.fetchBalance().then(response => {
            //coins in the balance are added to div
            for (var i = 0; i < response.info.length; i++) {
                if (response.info[i].amount > 0)
                    addLabelAndInput(response.info[i].currency.toUpperCase(), "bitfinexAccount", response.info[i].amount);
            }
            for (var i = 0; i < response.info.length; i++) {
                debugger;
                if (response.info[i].amount != 0 && response.info[i].currency != "USD") {
                    var currencyCode = bitfinex.commonCurrencyCode(response.info[i].currency.toUpperCase());
                    if (currencyCode != "BTC") {
                        convertToBitcoinBtcTurk(currencyCode, response.info[i].amount, 0.01).then(
                            (resultObject) => {
                                addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                            }
                        );
                        convertToEthereumForBtcTurk(currencyCode, response.info[i].amount, 0.01).then(
                            (resultObject) => {
                                addLabelAndInput(resultObject.symbol, "bitfinexOutputDiv", resultObject.value);
                            }
                        );
                    }
                }
            }
        })

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

function convertToEthereumForBtcTurk(ticker, amount, commission) {
    return new Promise((resolve, reject) => {
        bitfinex.fetchTicker(ticker + "/ETH").then(
            response => {
                var priceByEth = response.last;
                var totalCoin = amount * priceByEth;
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

function convertToBitcoinBtcTurk(ticker, amount, commission) {
    return new Promise((resolve, reject) => {
        bitfinex.fetchTicker(ticker + "/BTC").then(
            response => {
                var priceByBtc = response.last;
                var totalCoin = amount * priceByBtc;
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