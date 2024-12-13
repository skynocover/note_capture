export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Hello content.');

    browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.action === 'takeFullPageScreenshot') {
        const scrollHeight = document.documentElement.scrollHeight;

        const viewportHeight = window.innerHeight;
        const devicePixelRatio = window.devicePixelRatio;

        let scrollY = message.nextScrollY || 0;

        if (scrollY < scrollHeight) {
          window.scrollTo(0, scrollY);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for the scroll to complete

          browser.runtime.sendMessage({
            action: 'captureVisiblePart',
            nextScrollY: scrollY + viewportHeight,
          });
        } else {
          window.scrollTo(0, 0);

          browser.runtime.sendMessage({
            action: 'fullPageCaptureComplete',
            totalHeight: scrollHeight,
            width: window.innerWidth,
            devicePixelRatio,
          });
        }

        return true;
      }
      if (message.action === 'captureTables') {
        const tables = Array.from(document.querySelectorAll('table')).map((table) => {
          // 將 table 轉換成 BlockNote 格式
          const rows = Array.from(table.rows);
          const tableData = {
            id: crypto.randomUUID(),
            type: 'table',
            props: {
              textColor: 'default',
            },
            content: {
              type: 'tableContent',
              columnWidths: Array(table.rows[0]?.cells.length || 0).fill(null),
              rows: rows.map((row) => ({
                cells: Array.from(row.cells).map((cell) => [
                  {
                    type: 'text',
                    text: (cell.textContent || '').trim(),
                    styles: {},
                  },
                ]),
              })),
            },
            children: [],
          };

          return tableData;
        });

        browser.runtime.sendMessage({
          action: 'capturedTables',
          tables,
        });
        return true;
      }

      if (message.action === 'sidePanelOpened') {
        console.log('sidePanelOpened');
        return;
      }
      if (message.action === 'sidePanelClosed') {
        console.log('sidePanelClosed');
        return;
      }

      if (message.action === 'startScreenshotSelection') {
        screenshotSelector.show(message.dataUrl);
      }
    });

    // 初始化拖曳功能
    new TextSelectionDragger();

    const screenshotSelector = new ScreenshotSelector();
  },
});

/**
 * TextSelectionDragger 類別
 * 實現文字選擇後的拖曳功能，當使用者選擇文字時會顯示一個可拖曳的圖示
 */
class TextSelectionDragger {
  /** 拖曳圖示的容器元素 */
  private dragIcon: HTMLElement;
  /** 實際的圖示元素 */
  private iconElement: HTMLElement;

  constructor() {
    const elements = this.createDragElements();
    this.dragIcon = elements.dragIcon;
    this.iconElement = elements.iconElement;

    this.initializeEventListeners();
  }

  /**
   * 創建拖曳所需的 DOM 元素
   * @returns 包含拖曳圖示容器和圖示元素的物件
   */
  private createDragElements() {
    const dragIcon = document.createElement('div');
    dragIcon.innerHTML = `
      <div class="drag-wrapper" style="
        position: fixed;
        background: white;
        padding: 8px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: grab;
        z-index: 10000;
        display: none;
        user-select: none;
        -webkit-user-select: none;
        animation: fadeInScale 0.3s ease-out;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 4h6m-6 8h6m-6 8h6M3 20l5-5m0 5l-5-5"/>
        </svg>
      </div>
    `;

    // 添加動畫關鍵幀 會有淡入跟放大的效果
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes float {
        0% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-5px);
        }
        100% {
          transform: translateY(0px);
        }
      }
      
      .drag-wrapper {
        animation: float 2s ease-in-out infinite;
        background: linear-gradient(135deg, #4f46e5, #3b82f6);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }
      
      .drag-wrapper:hover {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        transform: scale(1.1);
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(dragIcon);
    return { dragIcon, iconElement: dragIcon.firstElementChild as HTMLElement };
  }

  /**
   * 隱藏拖曳圖示
   */
  private hideIcon() {
    this.iconElement.style.display = 'none';
  }

  /**
   * 創建拖曳時顯示的預覽圖像
   * @param selectedText - 被選擇的文字內容
   * @returns 用於拖曳預覽的 DOM 元素
   */
  private createDragImage(selectedText: string): HTMLElement {
    const dragImage = document.createElement('div');
    dragImage.textContent = selectedText.slice(0, 50) + (selectedText.length > 50 ? '...' : '');
    dragImage.style.cssText = `
      position: fixed;
      top: -1000px;
      background: white;
      padding: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    document.body.appendChild(dragImage);
    return dragImage;
  }

  /**
   * 初始化所有事件監聽器
   * 包含：
   * 1. 文字選擇事件 (selectionchange)
   * 2. 拖曳開始件 (dragstart)
   * 3. 拖曳結束事件 (dragend)
   */
  private initializeEventListeners() {
    // 監聽文字選擇事件
    document.addEventListener('selectionchange', async () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      const { sidePanelOpened } = await browser.storage.local.get('sidePanelOpened');

      if (!selectedText || sidePanelOpened !== 'opened') {
        this.hideIcon();
        return;
      }

      // 更新拖曳圖示的位置
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        this.iconElement.style.display = 'block';
        this.iconElement.style.left = `${(rect.left + rect.right) / 2}px`;
        this.iconElement.style.top = `${rect.bottom + 5}px`;

        // 調用新增的功能
        this.adjustIconColor(); // 自動調整圖示顏色
      }
    });

    // 設置拖曳事件
    this.iconElement.draggable = true;

    this.iconElement.addEventListener('dragstart', (e) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && e.dataTransfer) {
        const range = selection?.getRangeAt(0).cloneRange();
        e.dataTransfer.setData('text/plain', selectedText);
        e.dataTransfer.effectAllowed = 'copy';

        const dragImage = this.createDragImage(selectedText);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => dragImage.remove(), 0);

        // 保持文字選擇狀態
        setTimeout(() => {
          selection?.removeAllRanges();
          range && selection?.addRange(range);
        }, 0);
      }
    });

    this.iconElement.addEventListener('dragend', (e) => {
      this.hideIcon();
      e.preventDefault();
      e.stopPropagation();
    });
  }

  // 根據背景色調整拖曳元件的顏色
  private adjustIconColor() {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 取得選取區域背景的顏色
    const element = document.elementFromPoint(rect.left, rect.top);
    if (!element) return;

    // 遞迴向上尋找真實的背景色
    const getBgColor = (el: Element): string => {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
        return el.parentElement ? getBgColor(el.parentElement) : 'rgb(255, 255, 255)';
      }
      return bgColor;
    };

    const bgColor = getBgColor(element);

    // 解析 RGB 值
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
      const brightness =
        (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;

      if (brightness > 128) {
        this.iconElement.style.background = '#3B82F6'; // 深灰
        this.iconElement.style.color = 'white';
      } else {
        this.iconElement.style.background = 'white';
        this.iconElement.style.color = '#3b82f6';
      }
    }
  }
}

class ScreenshotSelector {
  private selector: HTMLElement;
  private originalImage: string | null = null;
  private static lastSelection: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;

  constructor() {
    this.selector = this.createSelector();
    const confirmButton = this.createConfirmButton();
    this.selector.appendChild(confirmButton);
    this.initializeEventListeners();
  }

  private createConfirmButton() {
    // 修改確認按鈕的樣式和位置
    const confirmButton = document.createElement('button');
    confirmButton.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        `;
    confirmButton.style.cssText = `
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          padding: 8px;
          background: rgba(255, 255, 255);
          color: #3b82f6;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `;

    confirmButton.addEventListener('mouseenter', () => {
      confirmButton.style.background = '#3b82f6';
      confirmButton.style.color = 'white';
    });

    confirmButton.addEventListener('mouseleave', () => {
      confirmButton.style.background = 'rgba(255, 255, 255)';
      confirmButton.style.color = '#3b82f6';
    });

    confirmButton.addEventListener('click', () => {
      this.confirmScreenshot();
    });

    return confirmButton;
  }

  private createSelector() {
    const selector = document.createElement('div');
    selector.style.cssText = `
      position: fixed;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      display: none;
      z-index: 10000;
      cursor: move;
    `;

    // Remove other resize handles and only add the bottom-right handle
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: white;
      border: 2px solid #3b82f6;
      right: -5px;
      bottom: -5px;
      cursor: se-resize;
    `;
    selector.appendChild(resizeHandle);

    document.body.appendChild(selector);
    return selector;
  }

  private initializeEventListeners() {
    let isResizing = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Add mouseover event listener
    this.selector.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.style.cursor === 'se-resize') return;
      this.selector.style.cursor = 'move';
    });

    // Add mouseout event listener
    this.selector.addEventListener('mouseout', (e) => {
      if (!isDragging) {
        this.selector.style.cursor = 'move';
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (this.selector.style.display !== 'block') return;

      const target = e.target as HTMLElement;

      // Check if the resize handle is clicked
      if (target.style.cursor === 'se-resize') {
        isResizing = true;
        e.stopPropagation();
        return;
      }

      // 如果已有選取範圍且點擊在選取範圍內，���入拖曳模式
      const rect = this.selector.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        isDragging = true;
        dragStartX = e.clientX - rect.left;
        dragStartY = e.clientY - rect.top;
        this.selector.style.cursor = 'move';
        e.stopPropagation();
        return;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isResizing) {
        // Handle resizing from the bottom-right corner
        const rect = this.selector.getBoundingClientRect();
        this.selector.style.width = `${e.clientX - rect.left}px`;
        this.selector.style.height = `${e.clientY - rect.top}px`;
        e.preventDefault();
      } else if (isDragging) {
        // 處理拖曳
        const newLeft = e.clientX - dragStartX;
        const newTop = e.clientY - dragStartY;
        this.selector.style.left = `${newLeft}px`;
        this.selector.style.top = `${newTop}px`;
        e.preventDefault();
      }
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      isDragging = false;
      this.selector.style.cursor = 'move';
    });

    // Add keyboard event listener for ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selector.style.display === 'block') {
        this.hide();
      }
    });
  }

  private async confirmScreenshot() {
    if (!this.originalImage) return;

    const rect = this.selector.getBoundingClientRect();

    // Save the current selection
    this.saveSelection(rect);

    const dpr = window.devicePixelRatio;

    // 根據 devicePixelRatio 調整裁剪座標和尺寸
    const cropData = {
      x: rect.x * dpr,
      y: rect.y * dpr,
      width: rect.width * dpr,
      height: rect.height * dpr,
    };

    const img = new Image();
    img.src = this.originalImage;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置 canvas 尺寸為裁剪後的尺寸
    canvas.width = cropData.width;
    canvas.height = cropData.height;

    ctx.drawImage(
      img,
      cropData.x,
      cropData.y,
      cropData.width,
      cropData.height,
      0,
      0,
      cropData.width,
      cropData.height,
    );

    // 轉換為 data URL 並傳送給 popup
    const croppedDataUrl = canvas.toDataURL('image/png');
    browser.runtime.sendMessage({
      action: 'screenshotCaptured',
      dataUrl: croppedDataUrl,
      width: cropData.width,
      height: cropData.height,
    });
    this.hide();
  }

  private saveSelection(rect: DOMRect) {
    ScreenshotSelector.lastSelection = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  private loadLastSelection(): { left: number; top: number; width: number; height: number } | null {
    return ScreenshotSelector.lastSelection;
  }

  show(dataUrl: string) {
    this.originalImage = dataUrl;
    this.selector.style.display = 'block';

    // Try to load last selection
    const lastSelection = this.loadLastSelection();

    if (lastSelection) {
      // Use last selection if available
      this.selector.style.left = `${lastSelection.left}px`;
      this.selector.style.top = `${lastSelection.top}px`;
      this.selector.style.width = `${lastSelection.width}px`;
      this.selector.style.height = `${lastSelection.height}px`;
    } else {
      // Default to full window if no saved selection
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      this.selector.style.left = '0px';
      this.selector.style.top = '0px';
      this.selector.style.width = `${windowWidth}px`;
      this.selector.style.height = `${windowHeight}px`;
    }
  }

  hide() {
    this.selector.style.display = 'none';
  }
}
