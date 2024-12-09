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
    });

    // 初始化拖曳功能
    new TextSelectionDragger();
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
   * 2. 拖曳開始事件 (dragstart)
   * 3. 拖曳結束事件 (dragend)
   */
  private initializeEventListeners() {
    // 監聽文字選擇事件
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
