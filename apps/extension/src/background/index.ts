// Background script for shopAI side panel extension

let currentHostname: string | null = null;

// Debug: Log when background script starts
console.log("🚀 Shopping assistant background script loaded");

// Listen for ALL Rami Levy requests first to debug
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {

    // Capture from specific catalog API endpoint
    if (
      details.url.includes("rami-levy.co.il/api/catalog") &&
      details.method === "POST"
    ) {
      console.log("🎯 Target API request detected!");
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
      console.log("💾 Capturing credentials for target API call...");
      
      const credentials: any = {};

      // Get headers from the request (auth/ecomtoken only, cookies are filtered out)
      if (authHeader) {
        credentials.authorization = authHeader.value;
      }

      if (ecomtokenHeader) {
        credentials.ecomtoken = ecomtokenHeader.value;
      }

      // Always get cookies via Chrome cookies API for the exact domain
      chrome.cookies
        .getAll({
          url: details.url, // Use the exact URL to get cookies that would be sent
        })
        .then((cookies) => {
          console.log("🍪 Retrieved", cookies.length, "cookies via Chrome API for URL:", details.url);

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
            
            console.log(`🍪 ${filteredCookies.length} cookies match the request domain`);
            
            // Convert cookies to cookie header format, matching what the browser would send
            const cookieHeader = filteredCookies
              .map((cookie) => `${cookie.name}=${cookie.value}`)
              .join("; ");

            if (cookieHeader) {
              credentials.cookie = cookieHeader;
            } else {
              console.log("⚠️ No cookie header constructed (empty after filtering)");
            }
          } else {
            console.log("⚠️ No cookies found for this URL");
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
          console.log(
            "✅ Rami Levy credentials captured from network request:",
            {
              hasAuth: !!credentials.authorization,
              hasCookie: !!credentials.cookie,
              hasEcomToken: !!credentials.ecomtoken,
              cookieLength: credentials.cookie?.length || 0,
              capturedAt: new Date().toLocaleTimeString(),
            }
          );

          // Verify storage
          return chrome.storage.local.get("rami-levy-captured-headers");
        })
        .then((_result) => {
          // console.log("✅ Verification - stored data:", _result); // Keep this commented out for debugging
        })
        .catch((error) => {
          console.error(
            "❌ Failed to save captured Rami Levy credentials:",
            error
          );
        });
    }

    return { requestHeaders: details.requestHeaders };
  },
  {
    urls: ["https://www.rami-levy.co.il/*", "https://rami-levy.co.il/*"],
    types: ["xmlhttprequest", "main_frame", "sub_frame"],
  },
  ["requestHeaders"]
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("shopAI extension installed");

  // Test storage access
  setTimeout(() => {
    chrome.storage.local.get(null).then((all) => {
      console.log("📦 All stored data:", all);
    });
  }, 1000);
});

// Add a test function to manually check storage
const testStorage = async () => {
  console.log("🧪 Testing storage...");

  // Test write
  await chrome.storage.local.set({
    "test-key": { value: "test-value", timestamp: Date.now() },
  });
  console.log("✅ Test write completed");

  // Test read
  const result = await chrome.storage.local.get("test-key");
  console.log("✅ Test read result:", result);

  // Check for Rami Levy data
  const ramiData = await chrome.storage.local.get("rami-levy-captured-headers");
  console.log("🛒 Rami Levy data:", ramiData);
};

// Make test function available
(globalThis as any).testStorage = testStorage;

// Add a function to test captured credentials
const testCapturedCredentials = async () => {
  console.log("🧪 Testing captured credentials...");
  
  try {
    const result = await chrome.storage.local.get("rami-levy-captured-headers");
    const captured = result["rami-levy-captured-headers"];
    
    if (captured) {
      console.log("✅ Captured credentials found:", {
        hasAuth: !!captured.authorization,
        hasEcomToken: !!captured.ecomtoken,
        hasCookie: !!captured.cookie,
        cookieLength: captured.cookie?.length || 0,
        capturedAt: new Date(captured.capturedAt).toLocaleTimeString(),
        source: captured.source,
        url: captured.url
      });
      
      if (captured.cookie) {
        console.log("🍪 Cookie preview:", captured.cookie.substring(0, 200) + (captured.cookie.length > 200 ? "..." : ""));
      }
      
      if (captured.authorization) {
        console.log("🔑 Authorization preview:", captured.authorization.substring(0, 50) + "...");
      }
      
      if (captured.ecomtoken) {
        console.log("🎫 Ecom token preview:", captured.ecomtoken.substring(0, 50) + "...");
      }
    } else {
      console.log("❌ No captured credentials found");
    }
  } catch (error) {
    console.error("❌ Failed to test captured credentials:", error);
  }
};

// Add a function to manually test cookie retrieval
const testCookies = async () => {
  console.log("🧪 Testing cookie retrieval...");

  try {
    const cookies = await chrome.cookies.getAll({
      domain: "rami-levy.co.il",
    });

    console.log("🍪 Retrieved cookies:", cookies.length);

    if (cookies.length > 0) {
      const cookieHeader = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      console.log("🍪 Cookie header:", cookieHeader.substring(0, 200) + "...");

      // Store as test
      await chrome.storage.local.set({
        "test-cookies": {
          cookie: cookieHeader,
          capturedAt: Date.now(),
        },
      });

      console.log("✅ Test cookies stored");
    } else {
      console.log("❌ No cookies found for rami-levy.co.il");
    }
  } catch (error) {
    console.error("❌ Cookie test failed:", error);
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

      case "GET_CURRENT_HOSTNAME":
        const hostname = await getCurrentHostname();
        currentHostname = hostname;
        return { hostname };

      default:
        return { error: "Unknown message type" };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));

  return true; // Will respond asynchronously
});
