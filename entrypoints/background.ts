export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  /* @ts-ignore*/
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: any) => console.error(error));
});
