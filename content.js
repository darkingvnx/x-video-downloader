// Icon SVG tải xuống
const downloadIcon = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

/**
 * Hàm tạo và chèn nút Download vào video container
 * @param {HTMLElement} videoElement - Thẻ <video> bắt được trên DOM
 */
function injectDownloadButton(videoElement) {
  // Twitter bọc video trong một cấu trúc phức tạp.
  // Ta tìm element cha chứa video để làm mốc gắn overlay.
  const container = videoElement.closest('[data-testid="videoComponent"]') || videoElement.parentElement;
  
  // Tránh việc chèn nút nhiều lần vào cùng một video
  if (!container || container.querySelector('.x-vd-overlay-container')) return;

  // Đảm bảo container cha có thuộc tính relative để nút absolute canh đúng vị trí
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }

  // Khởi tạo cụm nút UI
  const btnContainer = document.createElement('div');
  btnContainer.className = 'x-vd-overlay-container';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'x-vd-download-btn';
  downloadBtn.innerHTML = `${downloadIcon} Tải xuống`;
  
  // Xử lý sự kiện click tải video
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn chặn Twitter xử lý click (play/pause video)
    
    // Thay đổi UI tạm thời báo hiệu đang xử lý
    downloadBtn.innerHTML = `Đang bắt link...`;
    downloadBtn.style.opacity = '0.7';

    // Gửi tín hiệu về Background Script để lấy link và tải
    chrome.runtime.sendMessage({ action: "REQUEST_DOWNLOAD" }, (response) => {
      if (response && response.status === "success") {
        downloadBtn.innerHTML = `${downloadIcon} Đã tải`;
        downloadBtn.style.backgroundColor = '#17bf63'; // Đổi sang màu xanh lá
      } else {
        downloadBtn.innerHTML = `Lỗi: Không tìm thấy link`;
        downloadBtn.style.backgroundColor = '#e0245e'; // Đổi sang màu đỏ
        alert("Chưa bắt được luồng video. Hãy thử cho video chạy vài giây rồi bấm lại.");
      }
      
      // Trả lại UI cũ sau 3 giây
      setTimeout(() => {
        downloadBtn.innerHTML = `${downloadIcon} Tải xuống`;
        downloadBtn.style.backgroundColor = '';
        downloadBtn.style.opacity = '1';
      }, 3000);
    });
  });

  btnContainer.appendChild(downloadBtn);
  container.appendChild(btnContainer);
}

/**
 * Sử dụng MutationObserver để lắng nghe sự kiện cuộn (scroll)
 * và DOM render của Single Page Application
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // Chỉ xử lý khi có node mới được thêm vào
    if (mutation.addedNodes.length > 0) {
      // Tìm tất cả các thẻ video mới sinh ra
      const newVideos = document.querySelectorAll('video');
      newVideos.forEach(video => {
        injectDownloadButton(video);
      });
    }
  });
});

// Bắt đầu quét toàn bộ thay đổi của thẻ <body>
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Chạy lần đầu tiên cho các video đã có sẵn khi trang vừa load xong
setTimeout(() => {
  document.querySelectorAll('video').forEach(video => {
    injectDownloadButton(video);
  });
}, 2000);