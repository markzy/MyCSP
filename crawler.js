/**
 * Created by mark on 4/9/17.
 */
// crawl all the links in the webpage
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
    // Directly respond to the sender (popup),
    // through the specified callback */

    var mapper = {
      'img': 'img-src',
      'iframe': 'child-src',
      'script': 'script-src',
      'link': 'style-src',
      'video': 'media-src'
      // 'audio': 'media-src'
    };

    var result = {};
    for (var key in mapper) {
      var element = document.getElementsByTagName(key);

      if (element.length > 0) {
        result[mapper[key]] = [];

        for (var i = 0; i < element.length; i++) {
          if (key !== 'link') {
            result[mapper[key]].push(element[i].src);
          } else {
            result[mapper[key]].push(element[i].href);
          }
        }

      }

    }

    console.log(result);
    response(result);
  }
});
