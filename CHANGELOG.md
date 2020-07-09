# v2.4

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
