// src/preloads/gemini-preload.js

(() => {
    const spoofedUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36';
    const spoofedAppVersion = '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36';
    const spoofedBrands = Object.freeze([
        { brand: 'Not A(Brand', version: '99' },
        { brand: 'Chromium', version: '124' },
        { brand: 'Google Chrome', version: '124' }
    ]);
    const spoofedLanguages = Object.freeze(['en-US', 'en']);
    const spoofedLanguage = spoofedLanguages[0];
    const fullChromeVersion = '124.0.6367.118';

    const highEntropyByHint = {
        architecture: 'x86',
        bitness: '64',
        model: '',
        platformVersion: '14.4.1',
        uaFullVersion: fullChromeVersion,
        fullVersionList: Object.freeze([
            { brand: 'Not A(Brand', version: '99.0.0.0' },
            { brand: 'Chromium', version: fullChromeVersion },
            { brand: 'Google Chrome', version: fullChromeVersion }
        ]),
        wow64: false,
        formFactors: Object.freeze(['Desktop'])
    };

    const getHighEntropyValues = async (requestedHints = []) => {
        const result = {};
        requestedHints.forEach((hint) => {
            if (hint === 'full-version-list') {
                result.fullVersionList = highEntropyByHint.fullVersionList;
                return;
            }
            if (hint === 'ua-full-version') {
                result.uaFullVersion = highEntropyByHint.uaFullVersion;
                return;
            }
            if (hint === 'form-factors') {
                result.formFactors = highEntropyByHint.formFactors;
                return;
            }
            if (Object.prototype.hasOwnProperty.call(highEntropyByHint, hint)) {
                result[hint] = highEntropyByHint[hint];
            }
        });
        return result;
    };

    const spoofedUAData = {
        brands: spoofedBrands,
        mobile: false,
        platform: 'macOS',
        getHighEntropyValues,
        toJSON: () => ({
            brands: spoofedBrands,
            mobile: false,
            platform: 'macOS'
        })
    };

    const overrideNavigatorProp = (propName, getterFn) => {
        const descriptor = {
            get: getterFn,
            configurable: true
        };

        try {
            Object.defineProperty(Navigator.prototype, propName, descriptor);
            return;
        } catch (error) {
            /* fall through */
        }

        try {
            Object.defineProperty(window.navigator, propName, descriptor);
            return;
        } catch (error) {
            /* fall through */
        }

        try {
            Object.defineProperty(window.navigator, propName, {
                value: getterFn(),
                configurable: true
            });
        } catch (error) {
            // Ignore if the property cannot be redefined.
        }
    };

    overrideNavigatorProp('userAgent', () => spoofedUserAgent);
    overrideNavigatorProp('appVersion', () => spoofedAppVersion);
    overrideNavigatorProp('platform', () => 'MacIntel');
    overrideNavigatorProp('vendor', () => 'Google Inc.');
    overrideNavigatorProp('product', () => 'Gecko');
    overrideNavigatorProp('productSub', () => '20030107');
    overrideNavigatorProp('vendorSub', () => '');
    overrideNavigatorProp('language', () => spoofedLanguage);
    overrideNavigatorProp('languages', () => spoofedLanguages.slice());
    overrideNavigatorProp('hardwareConcurrency', () => 8);
    overrideNavigatorProp('deviceMemory', () => 8);
    overrideNavigatorProp('maxTouchPoints', () => 0);

    try {
        Object.defineProperty(Navigator.prototype, 'userAgentData', {
            get() {
                return spoofedUAData;
            },
            configurable: true
        });
    } catch (error) {
        try {
            Object.defineProperty(window.navigator, 'userAgentData', {
                get() {
                    return spoofedUAData;
                },
                configurable: true
            });
        } catch (innerError) {
            try {
                Object.defineProperty(window.navigator, 'userAgentData', {
                    value: spoofedUAData,
                    configurable: true
                });
            } catch (finalError) {
                // Give up quietly; header spoofing will still apply.
            }
        }
    }

    overrideNavigatorProp('webdriver', () => undefined);

    if (typeof window.chrome === 'undefined') {
        Object.defineProperty(window, 'chrome', {
            value: { runtime: {} },
            configurable: true
        });
    }
})();
