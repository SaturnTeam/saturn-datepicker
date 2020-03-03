import { browser, by, element } from 'protractor';

export class NgPackagedPage {
  public async navigateTo(): Promise<void> {
    return browser.get('/');
  }

  public async getParagraphText(): Promise<string> {
    return element(by.css('app-root h1')).getText();
  }
}
