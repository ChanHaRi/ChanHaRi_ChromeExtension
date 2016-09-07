/**
 * Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @author opensource@google.com
 * @license Apache License, Version 2.0.
 */
var tabId;
var tablink = 'defaultURL';
var tab;

chrome.commands.onCommand.addListener(function(command) {
        console.log('Command:', command);
});

chrome.tabs.query({'currentWindow': true,'active': true}, function (tabs) {
    tab = tabs[0];
    tabId = tabs[0].id;
    tablink = tabs[0].url;
});

function handleRequest(request, sender, cb) {
  // Simply relay the request. This lets content.js talk to bar.js.
   if (request.type === 'getURL') {
        request.results = sender.tab;
   }

  chrome.tabs.sendMessage(sender.tab.id, request, cb);
}
chrome.runtime.onMessage.addListener(handleRequest);

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, {type: 'toggleBar'});
});
//chrome.tab.getCurrent(function(tab)){
//    console.log(tab.url);
//}
