// Background script for shopAI side panel extension

let currentHostname: string | null = null;

// Only set up webRequest listener if permission is available
if (chrome.webRequest && chrome.webRequest.onBeforeSendHeaders) {

  // Listen for ALL Rami Levy requests first to debug
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {

      // Capture from specific catalog API endpoint
      if (
        details.url.includes("rami-levy.co.il/api/catalog") &&
        details.method === "POST"
      ) {
      const headers = details.requestHeaders || [];



      // Extract the required headers (try various possible names)
      const authHeader = headers.find(
        (h) =>
          h.name.toLowerCase() === "authorization" ||
          h.name.toLowerCase() === "auth" ||
          h.name.toLowerCase() === "bearer"
      );
      const ecomtokenHeader = headers.find(
        (h) =>
          h.name.toLowerCase() === "ecomtoken" ||
          h.name.toLowerCase() === "ecom-token" ||
          h.name.toLowerCase() === "x-ecom-token"
      );


      // Always capture credentials when we detect the target API call
      
      const credentials: any = {};

      // Get headers from the request (auth/ecomtoken only, cookies are filtered out)
      if (authHeader) {
        credentials.authorization = authHeader.value;
      }

      if (ecomtokenHeader) {
        credentials.ecomtoken = ecomtokenHeader.value;
      }

      // Get cookies via Chrome cookies API for the exact domain (if permission available)
      if (chrome.cookies && chrome.cookies.getAll) {
        chrome.cookies
          .getAll({
            url: details.url, // Use the exact URL to get cookies that would be sent
          })
          .then((cookies) => {

          if (cookies.length > 0) {
              const url = new URL(details.url);
              const filteredCookies = cookies.filter(cookie => {
                const matches = (
                  cookie.domain === url.hostname ||
                  cookie.domain === '.' + url.hostname ||
                  url.hostname.endsWith(cookie.domain.replace('.', ''))
                );
                return matches;
              });
              
              
              // Convert cookies to cookie header format, matching what the browser would send
              const cookieHeader = filteredCookies
                .map((cookie) => `${cookie.name}=${cookie.value}`)
                .join("; ");

              if (cookieHeader) {
                credentials.cookie = cookieHeader;
            }
          }

          // Store the captured credentials
          return chrome.storage.local.set({
            "rami-levy-captured-headers": {
              ...credentials,
              capturedAt: Date.now(),
              source: "network-intercepted-with-cookies",
              url: details.url
            },
          });
        })
        .then(() => {

          // Verify storage
          return chrome.storage.local.get("rami-levy-captured-headers");
        })
        .catch((error) => {
          // Failed to save credentials - log in development only
          if (process.env.NODE_ENV === 'development') {
            console.error("Failed to save captured Rami Levy credentials:", error);
          }
        });
      } else {
        // No cookies permission - store incomplete credentials
        chrome.storage.local.set({
          "rami-levy-captured-headers": {
            ...credentials,
            capturedAt: Date.now(),
            source: "network-intercepted-no-cookies",
            url: details.url,
            error: "MISSING_COOKIES_PERMISSION",
            note: "Cookies not available - missing permission"
          },
        }).catch(() => {
          // Failed to save - silent in production
        });
      }
    }

    return { requestHeaders: details.requestHeaders };
  },
  {
    urls: ["https://www.rami-levy.co.il/*", "https://rami-levy.co.il/*"],
    types: ["xmlhttprequest", "main_frame", "sub_frame"],
  },
  ["requestHeaders"]
  );
}

chrome.runtime.onInstalled.addListener(async (details) => {
  
  // Handle version tracking for changelog functionality
  const currentVersion = chrome.runtime.getManifest().version;
  
  try {
    // Get existing version info
    const result = await chrome.storage.local.get('versionInfo');
    const existingVersionInfo = result.versionInfo;
    
    const now = new Date();
    
    if (details.reason === 'install') {
      // First time install
      const versionInfo = {
        currentVersion,
        installDate: now,
        lastUpdateDate: now,
        lastSeenChangelogVersion: currentVersion // Don't show changelog on first install
      };
      
      await chrome.storage.local.set({ versionInfo });
      console.log('New installation, version info saved:', versionInfo);
    } else if (details.reason === 'update') {
      // Extension updated
      const versionInfo = {
        currentVersion,
        previousVersion: existingVersionInfo?.currentVersion || undefined,
        installDate: existingVersionInfo?.installDate || now,
        lastUpdateDate: now,
        lastSeenChangelogVersion: existingVersionInfo?.lastSeenChangelogVersion
      };
      
      await chrome.storage.local.set({ versionInfo });
      console.log('Extension updated, version info updated:', versionInfo);
      
      // If this is a version change, the useChangelog hook will detect it and show changelog
    }
  } catch (error) {
    console.error('Failed to handle version tracking:', error);
  }
});

// Test storage function (debug only)
const testStorage = async () => {
  await chrome.storage.local.set({
    "test-key": { value: "test-value", timestamp: Date.now() },
  });
  await chrome.storage.local.get("test-key");
  await chrome.storage.local.get("rami-levy-captured-headers");
};

// Make test function available
(globalThis as any).testStorage = testStorage;

// Test captured credentials function (debug only)
const testCapturedCredentials = async () => {
  try {
    const result = await chrome.storage.local.get("rami-levy-captured-headers");
    // Credentials tested - check console for detailed logs if needed
    return result["rami-levy-captured-headers"];
  } catch (error) {
    console.error("Failed to test captured credentials:", error);
  }
};

// Test cookie retrieval function (debug only)
const testCookies = async () => {
  try {
    if (chrome.cookies && chrome.cookies.getAll) {
      const cookies = await chrome.cookies.getAll({
        domain: "rami-levy.co.il",
      });

      if (cookies.length > 0) {
        const cookieHeader = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; ");

        await chrome.storage.local.set({
          "test-cookies": {
            cookie: cookieHeader,
            capturedAt: Date.now(),
          },
        });
      }
    } else {
      console.log("⚠️ Cookies API not available - missing permission");
      await chrome.storage.local.set({
        "test-cookies": {
          error: "Cookies API not available",
          capturedAt: Date.now(),
        },
      });
    }
  } catch (error) {
    console.error("Cookie test failed:", error);
  }
};

(globalThis as any).testCookies = testCookies;
(globalThis as any).testCapturedCredentials = testCapturedCredentials;

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Utility function to extract hostname from URL
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

// Listen for tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    const hostname = extractHostname(tab.url);

    if (hostname !== currentHostname) {
      currentHostname = hostname;

      // Notify sidepanel about hostname change
      try {
        await chrome.runtime.sendMessage({
          type: "HOSTNAME_CHANGED",
          data: { hostname },
        });
      } catch (error) {
        // Sidepanel might not be open, that's okay
      }
    }
  }
});

// Listen for tab URL changes
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    const hostname = extractHostname(changeInfo.url);

    if (hostname !== currentHostname) {
      currentHostname = hostname;

      // Notify sidepanel about hostname change
      try {
        await chrome.runtime.sendMessage({
          type: "HOSTNAME_CHANGED",
          data: { hostname },
        });
      } catch (error) {
        // Sidepanel might not be open, that's okay
      }
    }
  }
});

// Get current hostname utility
async function getCurrentHostname(): Promise<string> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        resolve(extractHostname(tabs[0].url));
      } else {
        resolve('unknown');
      }
    });
  });
}

// Simplified message handling (conversation management moved to backend)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleMessage = async () => {
    switch (message.type) {
      case "PING":
        return { success: true, message: "pong" };

      case "GET_CURRENT_HOSTNAME": {
        const hostname = await getCurrentHostname();
        currentHostname = hostname;
        return { hostname };
      }

      default:
        return { error: "Unknown message type" };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));

  return true; // Will respond asynchronously
});
