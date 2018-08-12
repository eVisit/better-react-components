const { Theme } = require('../../source/styles/theme');
const { createStyleSheet } = require('../../source/styles/style-sheet');

describe("StyleSheet", function() {
  it("should be able to build a style-sheet from a factory", function() {
    var theme = new Theme({
          MAIN_COLOR: 'rgb(255, 0, 0)'
        }, 'browser'),
        factory = createStyleSheet((theme) => {
          return {
            testStyle: {
              color: theme.MAIN_COLOR,
              width: 10,
              height: 15,
              fontSize: 12
            }
          };
        });

    var sheet = factory(theme),
        style = sheet.style('testStyle');

    expect(style.color).toBe('hsl(0,100%,50%)');
    expect(style.width).toBe(10);
    expect(style.height).toBe(15);
    expect(style.fontSize).toBe(12);
  });

  it("should be able to change styles based on platform", function() {
    var androidTheme = new Theme({
          MAIN_COLOR: 'rgb(255, 0, 0)'
        }, 'android'),
        browserTheme = new Theme({
          MAIN_COLOR: 'rgb(0, 0, 255)'
        }, 'browser'),
        factory = createStyleSheet((theme) => {
          return {
            testStyle: {
              android: {
                color: 'green',
                width: 50
              },
              browser: {
                color: 'blue',
                width: 500
              },
              color: theme.MAIN_COLOR,
              width: 10,
              height: 15,
              fontSize: 12
            }
          };
        });

    var androidSheet = factory(androidTheme),
        androidStyle = androidSheet.style('testStyle'),
        browserSheet = factory(browserTheme),
        browserStyle = browserSheet.style('testStyle');

    expect(androidStyle.color).toBe('green');
    expect(androidStyle.width).toBe(50);
    expect(androidStyle.height).toBe(15);
    expect(androidStyle.fontSize).toBe(12);

    expect(browserStyle.color).toBe('blue');
    expect(browserStyle.width).toBe(500);
    expect(browserStyle.height).toBe(15);
    expect(browserStyle.fontSize).toBe(12);
  });
});
