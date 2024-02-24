# v4.0.1

- patch: log cleanup

# v4.0.0

- major: build for ES2020
- major: changed options method yield response instead of json
- minor: typing overhaul

# v3.0.1

- fix: error property types

# v3.0.0

- breaking: changed backoff options for consistency with throttle options
- feature: add throttle

# v2.5.0

- feature: add backoff

# v2.4.4

- fix: json methods typescript type

# v2.4.3

- fix: json/text/arraybuffer/blob init was not working when expected status is not supplied

# v2.4.2

- fix: alway upper case init.method before passing to fetch
- fix: added method type to be uppercase methods

# v2.4.1

- fix: errors have "init" set with options passed to fetch

# v2.4.0

- feature: add `text` method for text responses
- feature: add `arrayBuffer` method for ArrayBuffer responses
- feature: add `blob` method for Blob responses

# v2.3.1

- fix: commit dist folder

# v2.3.0

- feature: add response headers to StatusCodeError and InvalidResponseError

# v2.2.0

- feature: pass path to getInit

# v2.1.1

- patch: export QueryParamsType

# v2.1.0

- feature: add NetworkError

# v2.0.0

- feature: add json method
- breaking: make all http method methods (get, put, post, delete, ...) assume json response/request bodies

# v1.3.0

- feature: dynamic default init can be provided via a function or async function for `defaultInit`

# v1.2.0

- feature: set accept and content-type headers to application/json when using json option
- fix: correct stringify query error message

# v1.1.1

- fix: export ExtendedRequestInit

# v1.1.0

- feature: add support for query opt that supports json query params

# v1.0.1

- fix: package.json main and module properties

# v1.0.0

- breaking: removed support for < node v12
- feature: added typescript support
