import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () {}

// jsdom doesn't implement ReadableStream body on fetch responses
global.ReadableStream = global.ReadableStream || class {}

