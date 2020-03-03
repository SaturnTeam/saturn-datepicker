import { NgPackagedPage } from './app.po';

describe('ng-packaged App', (): void => {
  let page: NgPackagedPage;

  beforeEach(() => {
    page = new NgPackagedPage();
  });

  it('should display message saying app works', async (): Promise<void> => {
    await page.navigateTo();
    expect(await page.getParagraphText()).toEqual('SatDatepicker features');
  });
});
