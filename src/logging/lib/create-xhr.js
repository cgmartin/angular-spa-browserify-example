'use strict';

// Pulled out XHR into own module so that it can be mocked
module.exports = function createXhr() {
    return new XMLHttpRequest();
};
