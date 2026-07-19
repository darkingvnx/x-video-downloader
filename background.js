chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_VIDEO_API") {
    const tweetId = request.tweetId;
    const apiUrl = `https://api.vxtwitter.com/Twitter/status/${tweetId}`;

    // Gọi API để lấy dữ liệu gốc của Tweet
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        // Kiểm tra xem bài viết có chứa media (video) không
        if (data && data.media_extended && data.media_extended.length > 0) {
          const media = data.media_extended[0];
          
          if (media.type === 'video' || media.type === 'gif') {
            const size = media.size; // Kích thước độ phân giải vd: {width: 1280, height: 720}
            const url = media.url;   // ĐÂY CHÍNH LÀ LINK .MP4 NGUYÊN BẢN CHẤT LƯỢNG CAO!

            sendResponse({ 
              status: "success", 
              url: url,
              filename: `X_Video_${tweetId}_${size.width}x${size.height}.mp4`
            });
            return;
          }
        }
        sendResponse({ status: "not_found", message: "Không tìm thấy video trong bài viết này." });
      })
      .catch(error => {
        console.error("API Error:", error);
        sendResponse({ status: "error", message: "Lỗi kết nối API." });
      });

    return true; // Giữ cổng kết nối mở để chờ fetch API xử lý xong
  }
});