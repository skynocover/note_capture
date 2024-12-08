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
  },
});
