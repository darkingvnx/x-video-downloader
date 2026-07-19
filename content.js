const downloadIcon = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

// Hàm tìm Tweet ID từ DOM
function getTweetId(videoElement) {
  try {
    // Tìm thẻ <article> bọc ngoài cùng của một bài viết trên X
    const article = videoElement.closest('article');
    if (!article) return null;

    // Tìm thẻ <a> chứa đường dẫn thời gian của bài viết (vd: /username/status/123456789)
    const timeLink = article.querySelector('a[href*="/status/"]');
    if (timeLink) {
      const urlMatches = timeLink.href.match(/\/status\/(\d+)/);
      if (urlMatches && urlMatches.length > 1) {
        return urlMatches[1]; // Trả về dãy số ID
      }
    }
  } catch (e) {
    console.error("Lỗi khi quét Tweet ID", e);
  }
  return null;
}

function injectDownloadButton(videoElement) {
  const container = videoElement.closest('[data-testid="videoComponent"]') || videoElement.parentElement;
  
  if (!container || container.querySelector('.x-vd-overlay-container')) return;

  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }

  const btnContainer = document.createElement('div');
  btnContainer.className = 'x-vd-overlay-container';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'x-vd-download-btn';
  downloadBtn.innerHTML = `${downloadIcon} Tải bằng IDM`;
  
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Quét lấy Tweet ID
    const tweetId = getTweetId(videoElement);
    if (!tweetId) {
      alert("Không nhận diện được ID của bài viết này!");
      return;
    }

    downloadBtn.innerHTML = `Đang trích xuất...`;
    downloadBtn.style.opacity = '0.7';

    // 2. Gửi ID lên Background để nhờ API tìm link gốc
    chrome.runtime.sendMessage({ 
      action: "FETCH_VIDEO_API",
      tweetId: tweetId
    }, (response) => {
      if (response && response.status === "success") {
        downloadBtn.innerHTML = `${downloadIcon} Đang mở IDM`;
        downloadBtn.style.backgroundColor = '#17bf63';

        // 3. THỦ THUẬT KÍCH HOẠT IDM TỪ LINK TRỰC TIẾP
        // Khi đã có link nguyên bản (không phải luồng HLS), ta dùng thẻ <a> tàng hình là chuẩn nhất
        const a = document.createElement('a');
        a.href = response.url;
        a.download = response.filename;
        a.target = '_blank'; // Ép mở luồng tải mới để IDM can thiệp
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

      } else {
        downloadBtn.innerHTML = `Lỗi: Không lấy được link`;
        downloadBtn.style.backgroundColor = '#e0245e';
      }
      
      setTimeout(() => {
        downloadBtn.innerHTML = `${downloadIcon} Tải bằng IDM`;
        downloadBtn.style.backgroundColor = '';
        downloadBtn.style.opacity = '1';
      }, 3000);
    });
  });

  btnContainer.appendChild(downloadBtn);
  container.appendChild(btnContainer);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      const newVideos = document.querySelectorAll('video');
      newVideos.forEach(video => injectDownloadButton(video));
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(() => {
  document.querySelectorAll('video').forEach(video => injectDownloadButton(video));
}, 2000);