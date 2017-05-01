/**
 * Created by mark on 4/29/17.
 */
'use strict';

var storagePolicy;
var policy;

function extractHostname(url) {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get the hostname
  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  }
  else {
    hostname = url.split('/')[0];
  }
  //find & remove port number
  hostname = hostname.split(':')[0];
  return hostname.trim();
}

var callback = function (details) {
  var csp_name = 'Content-Security-Policy';
  var urlPattern = '*://' + extractHostname(details.url) + '/*';

  if (urlPattern in policy && policy[urlPattern].enable) {
    details.responseHeaders.map(function (val, i, arr) {
      if (val.name == csp_name) {
        arr.splice(i, 1);
      }
    });

    var csp_value = "default-src";
    var sites = policy[urlPattern].sites;
    for (var key in sites) {
      if (sites[key].wanted) {
        csp_value += " " + key;
      }
    }
    csp_value += ";";

    console.log(csp_value);

    // need to construct csp value here
    details.responseHeaders.push({name: csp_name, value: csp_value});
  }
  return {responseHeaders: details.responseHeaders};
};



var reload = function () {
  storagePolicy = localStorage.getItem('mycsp');
  policy = storagePolicy == null ? {} : JSON.parse(storagePolicy);

  chrome.webRequest.onHeadersReceived.removeListener(callback);

  var urls = [];
  for (var key in policy) {
    if (policy[key].enable) {
      urls.push(key);
    }
  }

  console.log(urls);

  chrome.webRequest.onHeadersReceived.addListener(callback, {urls: urls}, ["blocking", "responseHeaders"]);

  return true;
};

reload();
