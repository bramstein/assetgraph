var unexpected = require('unexpected'),
    AssetGraph = require('../lib'),
    passError = require('passerror'),
    URL = require('url'),
    Path = require('path');

describe('AssetGraph#populate()', function () {
    var expect = unexpected.clone();

    expect.addAssertion('to contain (asset|assets)', function (expect, subject, queryObj, number) {
        expect(subject.findAssets(queryObj).length, 'to equal', typeof number === 'number' ? number : 1);
    });

    expect.addAssertion('to contain (url|urls)', function (expect, subject, urls) {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }
        urls = urls.map(function (url) {
            return URL.resolve(this.obj.root, url);
        }, this);
        urls.forEach(function (url) {
            expect(subject.findAssets({url: url}).length, 'to equal', 1);
        });
    });

    expect.addAssertion('to contain (relation|relations)', function (expect, subject, queryObj, number) {
        expect(subject.findRelations(queryObj).length, 'to equal', number);
    });

    it('should populate a graph with require.js correctly', function (done) {
        new AssetGraph({root: Path.resolve(__dirname, 'browserPopulate', 'requireJsWithMultipleConfigs')})
            .on('error', done)
            .on('warn', console.warn)
            .registerRequireJsConfig()
            .loadAssets('index.html')
            .browserPopulate()
            .run(passError(done, function (assetGraph) {
                expect(assetGraph, 'to contain assets', {type: 'JavaScript'}, 6);
                expect(assetGraph, 'to contain urls', ['some/place/there.js', 'bar/quux/baz.js']);
                done();
            }));
    });
});
