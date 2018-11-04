function onFilterChange(){onFilterChangeTimeout=null,chrome.webRequest.handlerBehaviorChanged()}function onBeforeRequest(e){if(e.tabId==-1)return{};var r=e.type;if(0!=e.frameId||e.tabId in frames||"object"!=r||(r="main_frame"),"main_frame"!=r&&"sub_frame"!=r||recordFrame(e.tabId,e.frameId,e.parentFrameId,e.url),"main_frame"==r)return{};r="sub_frame"==r?"SUBDOCUMENT":r.toUpperCase();var t="SUBDOCUMENT"!=r?e.frameId:e.parentFrameId,a=checkRequest(r,e.tabId,e.url,t);return FilterNotifier.triggerListeners("filter.hitCount",a,0,0,e.tabId),a instanceof BlockingFilter?{cancel:!0}:a instanceof RedirectFilter?{redirectUrl:a.redirect(e.url)}:{}}function onBeforeRequestDebug(e){debugPort.postMessage({type:"debugInfo",debugInfo:"request",content:e.url});var r=onBeforeRequest(e);return"undefined"!=typeof r.cancel&&r.cancel?debugPort.postMessage({type:"debugInfo",debugInfo:"block",content:e.url}):"undefined"!=typeof r.redirectUrl&&debugPort.postMessage({type:"debugInfo",debugInfo:"redirect",content:r.redirectUrl}),r}function onHeadersReceived(e){if(e.tabId!=-1){var r=e.type;if("main_frame"==r||"sub_frame"==r){var t=getFrameUrl(e.tabId,e.frameId);if(t==e.url){for(var a=null,n=null,i=0;i<e.responseHeaders.length;i++){var o=e.responseHeaders[i];if("x-adblock-key"==o.name.toLowerCase()&&o.value){var u=o.value.indexOf("_");if(u>=0){var a=o.value.substr(0,u),n=o.value.substr(u+1);break}}}if(a){var s=null;"sub_frame"==r&&(s=getFrameUrl(e.tabId,e.parentFrameId)),s||(s=t);var d=extractHostFromURL(s),f=defaultMatcher.matchesByKey(t,a.replace(/=/g,""),d);if(f){var l=new URI(t),c=l.asciiHost;l.port>0&&(c+=":"+l.port);var m=[l.path.replace(/#.*/,""),c,window.navigator.userAgent];verifySignature(a,n,m.join("\0"))&&(frames[e.tabId][e.frameId].keyException=!0)}}}}}}function recordFrame(e,r,t,a){e in frames||(frames[e]={}),frames[e][r]={url:a,parent:t}}function getFrameData(e,r){return e in frames&&r in frames[e]?frames[e][r]:r>0&&e in frames&&0 in frames[e]?frames[e][0]:null}function getFrameUrl(e,r){var t=getFrameData(e,r);return t?t.url:null}function forgetTab(e){delete frames[e]}function checkRequest(e,r,t,a){if(isFrameWhitelisted(r,a))return!1;var n=getFrameUrl(r,a);if(!n)return!1;var i=extractHostFromURL(t),o=extractHostFromURL(n),u=isThirdParty(i,o);return defaultMatcher.matchesAny(t,e,o,u)}function isFrameWhitelisted(e,r,t){for(var a=r,n=getFrameData(e,a);n;){var i=n;a=i.parent,n=getFrameData(e,a);var o=i.url,u=n?n.url:o;if("keyException"in i||isWhitelisted(o,u,t))return!0}return!1}var FilterNotifier=require("filterNotifier").FilterNotifier;"true"===localStorage.debug?(chrome.tabs.create({url:"debug.html",pinned:!0,selected:!0},function(e){var r=e.id;chrome.tabs.onUpdated.addListener(function(e,t,a){e==r&&"complete"==t.status&&(window.debugPort=chrome.tabs.connect(r,{name:"debug"}))})}),chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestDebug,{urls:["http://*/*","https://*/*"]},["blocking"])):chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest,{urls:["http://*/*","https://*/*"]},["blocking"]),chrome.tabs.onRemoved.addListener(forgetTab);var onFilterChangeTimeout=null,importantNotifications={"filter.added":!0,"filter.removed":!0,"filter.disabled":!0,"subscription.added":!0,"subscription.removed":!0,"subscription.disabled":!0,"subscription.updated":!0,load:!0};FilterNotifier.addListener(function(e){e in importantNotifications&&(null!=onFilterChangeTimeout&&window.clearTimeout(onFilterChangeTimeout),onFilterChangeTimeout=window.setTimeout(onFilterChange,2e3))});var frames={};