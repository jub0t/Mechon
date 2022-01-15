[![Build status][build-image]][build-url]
[![Tests coverage][cov-image]][cov-url]
[![npm version][npm-image]][npm-url]

# log

## Universal logging utility

**Configurable, environment and presentation agnostic, with log levels and namespacing ([debug](https://github.com/visionmedia/debug#debug) style) support**

### Usage

#### 1. Write application/library logs

```javascript
// Default logger (writes at 'info' level)
const log = require("log");

// Log 'info' level message:
log.info("some info message %s", "injected string");

// Get namespaced logger (debug lib style)
const myLibLog = log.get("my-lib");

// Log 'info' level message in context of 'my-lib' namespace:
myLibLog.info("some info message in 'my-lib' namespace context");

// Namespaces can be further nested
const myLibFuncLog = log.get("func");

// Log 'info' level message in context of 'my-lib:func' namespace:
myLibFuncLog.info("some info message in 'my-lib:func' namespace context");

// Log 'error' level message in context of 'my-lib:func' namespace:
myLibFuncLog.error("some error message");

// log output can be dynamically enabled/disabled during runtime
const { restore } = myLibFuncLog.error.disable();
myLibFuncLog.error("error message not really logged");
// Restore previous logs visibiity state
restore();
myLibFuncLog.error("error message to be logged");
```

#### 2. Initialize log writer in main (starting) process module

e.g. if target is Node.js, then install `log-node`, and at the top of main module initialize it

```javascript
require("log-node")();
```

### Available log levels

Mirror of applicable syslog levels (in severity order):

- `debug` - debugging information (hidden by default)
- `info` - a purely informational message (hidden by default)
- `notice` - condition normal, but significant
- `warning` (also aliased as `warn`) - condition warning
- `error` - condition error - to notify of errors accompanied with recovery mechanism (hence reported as log and not as uncaught exception)

_Note: `critical`, `alert`, `emergency` are not exposed as seem to not serve a use case in context of JS applications,
such errors should be exposed as typical exceptions_

### Output message formatting

`log` doesn't force any specific arguments handling. Still it is recommended to assume [printf-like](https://en.wikipedia.org/wiki/Printf_format_string) message
format, as all currently available writers are setup to support it. Placeholders support reflects one implemented in Node.js [format](https://nodejs.org/api/util.html#util_util_format_format_args) util

Excerpt from Node.js documentation:

_The first argument is a string containing zero or more placeholder tokens. Each placeholder token is replaced with the converted value from the corresponding argument. Supported placeholders are:_

- _`%s` - String._
- _`%d` - Number (integer or floating point value)._
- _`%i` - Integer._
- _`%f` - Floating point value._
- _`%j` - JSON. Replaced with the string '[Circular]' if the argument contains circular references._
- _`%o` - Object. A string representation of an object with generic JavaScript object formatting. Similar to util.inspect() with options { showHidden: true, depth: 4, showProxy: true }. This will show the full object including non-enumerable symbols and properties._
- _`%O` - Object. A string representation of an object with generic JavaScript object formatting. Similar to util.inspect() without options. This will show the full object not including non-enumerable symbols and properties._
- _`%%` - single percent sign ('%'). This does not consume an argument._

_Note to log writer configuration developers: For cross-env compatibility it is advised to base implementation on [sprintf-kit](https://github.com/medikoo/sprintf-kit)_

### Enabling log writing

`log` on its own doesn't write anything to the console or any other means (it just emits events to be consumed by preloaded log writers).

To have logs written, the pre-chosen log writer needs to be initialized in the main (starting) module of a process.

#### List of available log writers

- [`log-node`](https://github.com/medikoo/log-node) - For typical Node.js processes
- [`log-aws-lambda`](https://github.com/medikoo/log-aws-lambda) - For AWS lambda environment

_Note: if some writer is missing, propose a PR_

### Logs Visibility

Default visibility depends on the enviroment (see chosen log writer for more information), and in most cases is setup through the following environment variables:

##### `LOG_LEVEL`

(defaults to `notice`) Lowest log level from which (upwards) all logs will be exposed.

##### `LOG_DEBUG`

Eventual list of namespaces to expose at levels below `LOG_LEVEL` threshold

List is comma separated as e.g. `foo,-foo:bar` (expose all `foo` but not `foo:bar`).

It follows convention configured within [debug](https://github.com/visionmedia/debug#windows-note). To ease eventual migration from [debug](https://github.com/visionmedia/debug), configuration fallbacks to `DEBUG` env var if `LOG_DEBUG` is not present.

### Timestamps logging

When following env var is set writers are recommended to expose timestamps aside each log message

##### `LOG_TIME`

- `rel` (default) - Logs time elapsed since logger initialization
- `abs` - Logs absolute time in ISO 8601 format

## Tests

    $ npm test

Project cross-browser compatibility supported by:

<a href="https://browserstack.com"><img src="https://bstacksupport.zendesk.com/attachments/token/Pj5uf2x5GU9BvWErqAr51Jh2R/?name=browserstack-logo-600x315.png" height="150" /></a>

## Security contact information

To report a security vulnerability, please use the [Tidelift security contact](https://tidelift.com/security). Tidelift will coordinate the fix and disclosure.

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-log?utm_source=npm-log&utm_medium=referral&utm_campaign=readme">Get professional support for d with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>

[build-image]: https://github.com/medikoo/log/workflows/Integrate/badge.svg
[build-url]: https://github.com/medikoo/log/actions?query=workflow%3AIntegrate
[cov-image]: https://img.shields.io/codecov/c/github/medikoo/log.svg
[cov-url]: https://codecov.io/gh/medikoo/log
[npm-image]: https://img.shields.io/npm/v/log.svg
[npm-url]: https://www.npmjs.com/package/log
