// Bộ nhớ đệm lưu trữ các URL video bắt được
// Trong môi trường MV3 thực tế lớn hơn, có thể dùng chrome.storage.session để tránh bị xóa khi SW ngủ
let capturedMedia = new Map();

// Lắng nghe các request tải video
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    // Lọc các luồng video thực tế từ server của Twitter
    if (url.includes("video.twimg.com")) {
      if (url.includes(".mp4") || url.includes(".m3u8")) {
        // Sử dụng ID của tab để map video với tab đang hoạt động
        const tabId = details.tabId;
        if (tabId !== -1) {
          if (!capturedMedia.has(tabId)) {
            capturedMedia.set(tabId, new Set());
          }
          capturedMedia.get(tabId).add(url);
        }
      }
    }
  },
  { urls: ["*://video.twimg.com/*"] }
);

// Lắng nghe tin nhắn từ Content Script (khi người dùng bấm nút Download)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "REQUEST_DOWNLOAD") {
    const tabId = sender.tab.id;
    const mediaUrls = capturedMedia.get(tabId) ? Array.from(capturedMedia.get(tabId)) : [];
    
    if (mediaUrls.length > 0) {
      // Ưu tiên file .mp4 thay vì .m3u8 (vì m3u8 là playlist, khó tải nguyên khối trên trình duyệt)
      const mp4Urls = mediaUrls.filter(url => url.includes(".mp4"));
      const targetUrl = mp4Urls.length > 0 ? mp4Urls[mp4Urls.length - 1] : mediaUrls[mediaUrls.length - 1];

      // Kích hoạt API tải xuống của Chrome
      chrome.downloads.download({
        url: targetUrl,
        filename: `X_Video_${Date.now()}.mp4`,
        saveAs: false
      });
      
      sendResponse({ status: "success", url: targetUrl });
    } else {
      sendResponse({ status: "not_found" });
    }
  }
  return true; // Giữ cổng kết nối mở cho async response
});

// Dọn dẹp bộ nhớ khi đóng tab
chrome.tabs.onRemoved.addListener((tabId) => {
  if (capturedMedia.has(tabId)) {
    capturedMedia.delete(tabId);
  }
});