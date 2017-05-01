var app = angular.module('myCSP', ['ngMaterial', 'ngMessages']);

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

app.controller('PopupController', function ($scope, $mdBottomSheet, $timeout,$mdDialog) {
  $scope.initial = {'\'unsafe-inline\'':{level: 'white', wanted: true, description: '', rule: 'default-src', sub:{}}};
  $scope.sites = $scope.initial;
  $scope.update = true;

  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    $scope.currentSite = extractHostname(tabs[0].url);
    $scope.currentSitePattern = "*://" + $scope.currentSite + "/*";
    var storagePolicy = localStorage.getItem('mycsp');
    var policy = storagePolicy == null ? {} : JSON.parse(storagePolicy);
    if ($scope.currentSitePattern in policy){
      $scope.update = !policy[$scope.currentSitePattern].enable;
      $scope.switch = !$scope.update;
      $scope.sites = policy[$scope.currentSitePattern].sites;
      $timeout(function () {
        $scope.$apply();
      });
    }
  });

  $scope.show = function (site) {
    $mdBottomSheet.show({
      templateUrl: 'bottom-sheet.html',
      controller: 'BottomController',
      locals: {
        Item: {
          site: site
        }
      }
    });
  };

  $scope.switchChange = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      if ($scope.switch == true && $scope.update) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'DOMInfo'}, function (res) {
          for (var key in res) {
            // loop json object
            for (var i = 0; i < res[key].length; i++) {
              var cspSite = extractHostname(res[key][i].trim());
              if (cspSite.length > 0 && !(cspSite in $scope.sites)) {
                $scope.sites[cspSite] = {level: 'white', wanted: true, description: '', rule: key, sub:{}};
              }
            }
          }
          $timeout(function () {
            $scope.$apply();
          });
        });
      }
      else {
        $scope.sites = $scope.initial;
        $timeout(function () {
          $scope.$apply();
        });
        $scope.disable();
        $scope.update = true;
      }
    });
  };

  $scope.disable = function () {
    var storagePolicy = localStorage.getItem('mycsp');
    var policy = storagePolicy == null ? {} : JSON.parse(storagePolicy);

    policy[$scope.currentSitePattern] = {
      'enable': false
    };

    localStorage.setItem('mycsp', JSON.stringify(policy));

    // reload background page
    var bg = chrome.extension.getBackgroundPage();
    bg.reload();
  };

  $scope.savePolicy = function () {
    var storagePolicy = localStorage.getItem('mycsp');
    var policy = storagePolicy == null ? {} : JSON.parse(storagePolicy);

    policy[$scope.currentSitePattern] = {
      'enable': $scope.switch,
      'sites': $scope.sites
    };

    localStorage.setItem('mycsp', JSON.stringify(policy));

    // reload background page
    var bg = chrome.extension.getBackgroundPage();
    bg.reload();
  };

  $scope.clean = function () {
    localStorage.setItem('mycsp',JSON.stringify({}));
    $scope.update = true;
    $scope.switch = false;
    $scope.sites = $scope.initial;
    console.log($scope.sites);
    $timeout(function () {
      $scope.$apply();
    });
    var bg = chrome.extension.getBackgroundPage();
    bg.reload();
  };
});

app.controller('BottomController', function ($scope, Item) {
  $scope.bottomSite = Item.site.name;
  $scope.bottomLevel = Item.site.level;
  $scope.bottomDes = Item.site.description;
});


app.filter('custom', function() {
  return function(input, search) {
    if (!input) return input;
    if (!search) return input;
    var expected = ('' + search).toLowerCase();
    var result = {};
    angular.forEach(input, function(value, key) {
      var actual = ('' + key).toLowerCase();
      if (actual.indexOf(expected) !== -1) {
        result[key] = value;
      }
    });
    return result;
  }
});