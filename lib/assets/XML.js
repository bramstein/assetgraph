var util = require('util'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    domtohtml = require('../3rdparty/jsdom/domtohtml'),
    error = require('../error'),
    memoizeAsyncAccessor = require('../memoizeAsyncAccessor'),
    Base = require('./Base').Base;

function XML(config) {
    Base.call(this, config);
}

util.inherits(XML, Base);

_.extend(XML.prototype, {
    contentType: 'text/xml',

    defaultExtension: 'xml',

    isPretty: false,

    getParseTree: memoizeAsyncAccessor('parseTree', function (cb) {
        var that = this;
        this.getOriginalSrc(error.passToFunction(cb, function (src) {
            var parseTree = jsdom.jsdom(src, undefined, {features: {ProcessExternalResources: [], FetchExternalResources: []}});
            // Jsdom (or its XML parser) doesn't strip the newline after the <!DOCTYPE> for some reason.
            // Issue reported here: https://github.com/tmpvar/jsdom/issues/160
            if (parseTree.firstChild && parseTree.firstChild.nodeName === '#text' && parseTree.firstChild.nodeValue === "\n") {
                parseTree.removeChild(parseTree.firstChild);
            }
            cb(null, parseTree);
        }));
    }),

    minify: function (cb) {
        var that = this;
        that.getParseTree(error.passToFunction(cb, function (parseTree) {
            var q = [parseTree];
            while (q.length) {
                var element = q.shift();
                // Whitespace-only text node?
                if (element.nodeType === 3 && /^[\r\n\s\t]*$/.test(element.nodeValue)) {
                    element.parentNode.removeChild(element);
                }
            }
            that.isPretty = false;
            cb();
        }));
    },

    prettyPrint: function (cb) {
        this.isPretty = true;
        process.nextTick(cb);
    },

    serialize: function (cb) {
        var that = this;
        that.getParseTree(error.passToFunction(cb, function (parseTree) {
            cb(null, (parseTree.doctype ? parseTree.doctype + "\n" : "") + domtohtml.domToHtml(parseTree, !that.isPretty));
        }));
    },

    attachRelation: function (relation, position, adjacentRelation) {
        _.extend(relation, {
            from: this,
            node: relation.createNode(this.parseTree)
        });

        var parentNode = adjacentRelation.node.parentNode;
        if (position === 'after') {
            parentNode.insertBefore(relation.node, adjacentRelation.node.nextSibling);
        } else if (position === 'before') {
            parentNode.insertBefore(relation.node, adjacentRelation.node);
        } else {
            throw new Error("XML.attachRelation: Unsupported 'position' value: " + position);
        }
    },

    detachRelation: function (relation) {
        relation.node.parentNode.removeChild(relation.node);
        delete relation.node;
    }
});

exports.XML = XML;