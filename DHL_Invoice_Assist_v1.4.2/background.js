chrome.action.onClicked.addListener(() => chrome.tabs.create({url:chrome.runtime.getURL('organizer.html')}));
