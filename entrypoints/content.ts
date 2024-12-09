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
    });

    // 初始化拖曳功能
    new TextSelectionDragger();

    const screenshotSelector = new ScreenshotSelector();

    browser.runtime.onMessage.addListener(async (message) => {
      if (message.action === 'startScreenshotSelection') {
        screenshotSelector.show(message.dataUrl);
      }
    });
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
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 4h6m-6 8h6m-6 8h6M3 20l5-5m0 5l-5-5"/>
        </svg>
      </div>
    `;
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
    // 監聽文字擇事件
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selectedText) {
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
}

class ScreenshotSelector {
  private selector: HTMLElement;
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private originalImage: string | null = null;

  constructor() {
    this.selector = this.createSelector();
    this.initializeEventListeners();
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
      background: rgba(255, 255, 255, 0.7);
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
      confirmButton.style.background = 'rgba(255, 255, 255, 0.7)';
      confirmButton.style.color = '#3b82f6';
    });

    confirmButton.addEventListener('click', () => {
      this.confirmScreenshot();
    });

    selector.appendChild(confirmButton);
    document.body.appendChild(selector);
    return selector;
  }

  private initializeEventListeners() {
    document.addEventListener('mousedown', (e) => {
      if (this.selector.style.display === 'block') {
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isSelecting) {
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        this.selector.style.left = `${width > 0 ? this.startX : e.clientX}px`;
        this.selector.style.top = `${height > 0 ? this.startY : e.clientY}px`;
        this.selector.style.width = `${Math.abs(width)}px`;
        this.selector.style.height = `${Math.abs(height)}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      this.isSelecting = false;
    });
  }

  show(dataUrl: string) {
    this.originalImage = dataUrl;
    this.selector.style.display = 'block';
  }

  private async confirmScreenshot() {
    if (!this.originalImage) return;

    const rect = this.selector.getBoundingClientRect();
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

  hide() {
    this.selector.style.display = 'none';
  }
}
