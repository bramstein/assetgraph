var vows = require('vows'),
    assert = require('assert'),
    AssetGraph = require('../lib');

vows.describe('minifySvgAssetsWithSvgo').addBatch({
    'After loading test case': {
        topic: function () {
            new AssetGraph({root: __dirname + '/minifySvgAssetsWithSvgo/'})
                .loadAssets('index.html')
                .populate()
                .run(this.callback);
        },
        'the graph should contain one Svg asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Svg'}).length, 1);
        },
        'then run the minifySvgAssetsWithSvgo transform': {
            topic: function (assetGraph) {
                assetGraph.minifySvgAssetsWithSvgo({type: 'Svg'}).run(this.callback);
            },
            'the graph should still contain one Svg asset': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'Svg'}).length, 1);
            },
            'then get the Svg as text': {
                topic: function (assetGraph) {
                    return assetGraph.findAssets({type: 'Svg'})[0].text;
                },
                'the Svg should be the output of the svgo compiler': function (svgText) {
                    assert.equal(svgText,
                        '<svg height="56.693" viewBox="0 0 56.693 56.693" width="56.693" xmlns="http://www.w3.org/2000/svg"><g fill="#474A56"><circle cx="47.089" cy="40.805" r="3.129"/><circle cx="9.67" cy="37.212" r="3.129"/><circle cx="14.467" cy="8.241" r="3.13"/><path d="M19.114 14.647l-1.214-2.263c-.278-.519-.922-.715-1.444-.436-.517.277-.714.924-.436 1.444l1.217 2.263c.19.357.558.564.938.564.171 0 .344-.042.505-.128.518-.278.713-.926.434-1.444zM20.27 21.313c.193.36.562.564.942.564.172 0 .342-.041.502-.127.52-.279.713-.926.436-1.445l-1.215-2.263c-.278-.518-.924-.714-1.444-.435-.52.279-.712.925-.435 1.443l1.214 2.263zM35.98 33.542l-2.469-1.411c-.513-.292-1.164-.113-1.457.397-.289.512-.113 1.163.399 1.455l2.469 1.41c.167.096.349.141.528.141.373 0 .73-.193.928-.539.293-.511.114-1.163-.398-1.453zM42.157 37.066l-2.472-1.41c-.512-.291-1.162-.113-1.455.397-.29.513-.113 1.163.397 1.456l2.47 1.409c.17.096.349.141.53.141.368 0 .728-.194.925-.539.291-.511.113-1.162-.395-1.454zM17.152 32.173l-2.487 1.375c-.517.286-.705.935-.418 1.449.194.351.559.551.934.551.174 0 .352-.043.515-.133l2.487-1.377c.517-.285.704-.934.419-1.45-.286-.514-.936-.702-1.45-.415zM48.662 9.463c0-2.629-2.138-4.766-4.767-4.766-2.625 0-4.765 2.137-4.765 4.766 0 .838.22 1.624.601 2.31l-10.869 11.406c-.986-.598-2.14-.946-3.373-.946-3.611 0-6.548 2.937-6.548 6.546 0 3.608 2.937 6.546 6.548 6.546l.197-.01 2.428 9.529c-1.356.841-2.268 2.34-2.268 4.051 0 2.628 2.14 4.765 4.767 4.765 2.626 0 4.764-2.137 4.764-4.765 0-2.541-2-4.617-4.507-4.752l-2.429-9.53c2.129-1.08 3.593-3.287 3.593-5.834 0-1.347-.408-2.601-1.109-3.642l10.87-11.405c.634.316 1.347.496 2.102.496 2.627 0 4.765-2.137 4.765-4.765zm-19.971 37.646c.481-.517 1.16-.847 1.921-.847.293 0 .571.06.835.149 1.041.351 1.798 1.325 1.798 2.483 0 1.452-1.183 2.633-2.633 2.633s-2.633-1.181-2.633-2.633c0-.69.273-1.314.712-1.785zm.397-17.501c-.166.72-.54 1.358-1.059 1.851l-.323.268c-.621.468-1.384.755-2.217.755-.185 0-.362-.028-.538-.054-.788-.116-1.498-.47-2.044-1.001-.51-.499-.878-1.142-1.035-1.866-.055-.252-.088-.512-.088-.781 0-1.031.43-1.966 1.112-2.638.496-.487 1.126-.837 1.832-.985.245-.051.5-.078.761-.078.466 0 .909.096 1.32.254.921.354 1.665 1.059 2.064 1.958.202.456.317.959.317 1.489.001.285-.039.56-.102.828zm14.807-17.513c-.168 0-.334-.019-.495-.051-1.013-.193-1.814-.97-2.055-1.965-.051-.199-.081-.404-.081-.616 0-1.452 1.181-2.634 2.631-2.634 1.452 0 2.633 1.182 2.633 2.634s-1.181 2.632-2.633 2.632z"/></g></svg>'
                    );
                }
            }
        }
    }
})['export'](module);
