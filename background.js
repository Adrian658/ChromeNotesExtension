//Add action when extension is installed
chrome.runtime.onInstalled.addListener(function() {
    //On page change declare new set of rules
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            //Checks if current page contains specified url
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'developer.chrome.com'},
            })],
            //action to take if previous condition checks out
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});