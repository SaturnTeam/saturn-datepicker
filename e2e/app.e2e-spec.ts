import { NgPackagedPage } from './app.po';

describe('ng-packaged App', () => {
  let page: NgPackagedPage;

  beforeEach(() => {
    page = new NgPackagedPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
