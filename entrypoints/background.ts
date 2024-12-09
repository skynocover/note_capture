export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  /* @ts-ignore*/
  browser.sidePanel
    // 當使用者點擊擴充功能時 開啟side panel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: any) => console.error(error));

  // 監聽擴充功能按鈕點擊事件
  browser.action.onClicked.addListener(async (tab) => {
    console.log('Extension button clicked!', tab);
    const a = await browser.sidePanel.getPanelBehavior();
    console.log({ a });
  });

  // 處理截圖區域的訊息
  browser.runtime.onMessage.addListener(async (message, sender) => {});
});
