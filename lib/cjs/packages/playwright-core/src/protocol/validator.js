'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const validatorPrimitives = require('./validatorPrimitives.js');

validatorPrimitives.scheme.StackFrame = validatorPrimitives.tObject({
  file: validatorPrimitives.tString,
  line: validatorPrimitives.tNumber,
  column: validatorPrimitives.tNumber,
  function: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.Metadata = validatorPrimitives.tObject({
  location: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    file: validatorPrimitives.tString,
    line: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
    column: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  title: validatorPrimitives.tOptional(validatorPrimitives.tString),
  internal: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  stepId: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ClientSideCallMetadata = validatorPrimitives.tObject({
  id: validatorPrimitives.tNumber,
  stack: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("StackFrame")))
});
validatorPrimitives.scheme.Point = validatorPrimitives.tObject({
  x: validatorPrimitives.tNumber,
  y: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.Rect = validatorPrimitives.tObject({
  x: validatorPrimitives.tNumber,
  y: validatorPrimitives.tNumber,
  width: validatorPrimitives.tNumber,
  height: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.SerializedValue = validatorPrimitives.tObject({
  n: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  b: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  s: validatorPrimitives.tOptional(validatorPrimitives.tString),
  v: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["null", "undefined", "NaN", "Infinity", "-Infinity", "-0"])),
  d: validatorPrimitives.tOptional(validatorPrimitives.tString),
  u: validatorPrimitives.tOptional(validatorPrimitives.tString),
  bi: validatorPrimitives.tOptional(validatorPrimitives.tString),
  ta: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    b: validatorPrimitives.tBinary,
    k: validatorPrimitives.tEnum(["i8", "ui8", "ui8c", "i16", "ui16", "i32", "ui32", "f32", "f64", "bi64", "bui64"])
  })),
  e: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    m: validatorPrimitives.tString,
    n: validatorPrimitives.tString,
    s: validatorPrimitives.tString
  })),
  r: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    p: validatorPrimitives.tString,
    f: validatorPrimitives.tString
  })),
  a: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SerializedValue"))),
  o: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    k: validatorPrimitives.tString,
    v: validatorPrimitives.tType("SerializedValue")
  }))),
  h: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  id: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  ref: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.SerializedArgument = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue"),
  handles: validatorPrimitives.tArray(validatorPrimitives.tChannel("*"))
});
validatorPrimitives.scheme.ExpectedTextValue = validatorPrimitives.tObject({
  string: validatorPrimitives.tOptional(validatorPrimitives.tString),
  regexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
  regexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString),
  matchSubstring: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  ignoreCase: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  normalizeWhiteSpace: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.SelectorEngine = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  source: validatorPrimitives.tString,
  contentScript: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.AXNode = validatorPrimitives.tObject({
  role: validatorPrimitives.tString,
  name: validatorPrimitives.tString,
  valueString: validatorPrimitives.tOptional(validatorPrimitives.tString),
  valueNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  description: validatorPrimitives.tOptional(validatorPrimitives.tString),
  keyshortcuts: validatorPrimitives.tOptional(validatorPrimitives.tString),
  roledescription: validatorPrimitives.tOptional(validatorPrimitives.tString),
  valuetext: validatorPrimitives.tOptional(validatorPrimitives.tString),
  disabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  expanded: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  focused: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modal: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  multiline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  multiselectable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  readonly: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  required: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  selected: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  checked: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["checked", "unchecked", "mixed"])),
  pressed: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["pressed", "released", "mixed"])),
  level: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  valuemin: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  valuemax: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  autocomplete: validatorPrimitives.tOptional(validatorPrimitives.tString),
  haspopup: validatorPrimitives.tOptional(validatorPrimitives.tString),
  invalid: validatorPrimitives.tOptional(validatorPrimitives.tString),
  orientation: validatorPrimitives.tOptional(validatorPrimitives.tString),
  children: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("AXNode")))
});
validatorPrimitives.scheme.SetNetworkCookie = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  value: validatorPrimitives.tString,
  url: validatorPrimitives.tOptional(validatorPrimitives.tString),
  domain: validatorPrimitives.tOptional(validatorPrimitives.tString),
  path: validatorPrimitives.tOptional(validatorPrimitives.tString),
  expires: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  httpOnly: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  secure: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  sameSite: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["Strict", "Lax", "None"])),
  partitionKey: validatorPrimitives.tOptional(validatorPrimitives.tString),
  _crHasCrossSiteAncestor: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.NetworkCookie = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  value: validatorPrimitives.tString,
  domain: validatorPrimitives.tString,
  path: validatorPrimitives.tString,
  expires: validatorPrimitives.tNumber,
  httpOnly: validatorPrimitives.tBoolean,
  secure: validatorPrimitives.tBoolean,
  sameSite: validatorPrimitives.tEnum(["Strict", "Lax", "None"]),
  partitionKey: validatorPrimitives.tOptional(validatorPrimitives.tString),
  _crHasCrossSiteAncestor: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.NameValue = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.IndexedDBDatabase = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  version: validatorPrimitives.tNumber,
  stores: validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    autoIncrement: validatorPrimitives.tBoolean,
    keyPath: validatorPrimitives.tOptional(validatorPrimitives.tString),
    keyPathArray: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
    records: validatorPrimitives.tArray(validatorPrimitives.tObject({
      key: validatorPrimitives.tOptional(validatorPrimitives.tAny),
      keyEncoded: validatorPrimitives.tOptional(validatorPrimitives.tAny),
      value: validatorPrimitives.tOptional(validatorPrimitives.tAny),
      valueEncoded: validatorPrimitives.tOptional(validatorPrimitives.tAny)
    })),
    indexes: validatorPrimitives.tArray(validatorPrimitives.tObject({
      name: validatorPrimitives.tString,
      keyPath: validatorPrimitives.tOptional(validatorPrimitives.tString),
      keyPathArray: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
      multiEntry: validatorPrimitives.tBoolean,
      unique: validatorPrimitives.tBoolean
    }))
  }))
});
validatorPrimitives.scheme.SetOriginStorage = validatorPrimitives.tObject({
  origin: validatorPrimitives.tString,
  localStorage: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  indexedDB: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("IndexedDBDatabase")))
});
validatorPrimitives.scheme.OriginStorage = validatorPrimitives.tObject({
  origin: validatorPrimitives.tString,
  localStorage: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  indexedDB: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("IndexedDBDatabase")))
});
validatorPrimitives.scheme.SerializedError = validatorPrimitives.tObject({
  error: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    message: validatorPrimitives.tString,
    name: validatorPrimitives.tString,
    stack: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  value: validatorPrimitives.tOptional(validatorPrimitives.tType("SerializedValue"))
});
validatorPrimitives.scheme.RecordHarOptions = validatorPrimitives.tObject({
  zip: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  content: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["embed", "attach", "omit"])),
  mode: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["full", "minimal"])),
  urlGlob: validatorPrimitives.tOptional(validatorPrimitives.tString),
  urlRegexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
  urlRegexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FormField = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  value: validatorPrimitives.tOptional(validatorPrimitives.tString),
  file: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    mimeType: validatorPrimitives.tOptional(validatorPrimitives.tString),
    buffer: validatorPrimitives.tBinary
  }))
});
validatorPrimitives.scheme.APIRequestContextInitializer = validatorPrimitives.tObject({
  tracing: validatorPrimitives.tChannel(["Tracing"])
});
validatorPrimitives.scheme.APIRequestContextFetchParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tString,
  encodedParams: validatorPrimitives.tOptional(validatorPrimitives.tString),
  params: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  method: validatorPrimitives.tOptional(validatorPrimitives.tString),
  headers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  postData: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  jsonData: validatorPrimitives.tOptional(validatorPrimitives.tString),
  formData: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  multipartData: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("FormField"))),
  timeout: validatorPrimitives.tNumber,
  failOnStatusCode: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  maxRedirects: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  maxRetries: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.APIRequestContextFetchResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tType("APIResponse")
});
validatorPrimitives.scheme.APIRequestContextFetchResponseBodyParams = validatorPrimitives.tObject({
  fetchUid: validatorPrimitives.tString
});
validatorPrimitives.scheme.APIRequestContextFetchResponseBodyResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
});
validatorPrimitives.scheme.APIRequestContextFetchLogParams = validatorPrimitives.tObject({
  fetchUid: validatorPrimitives.tString
});
validatorPrimitives.scheme.APIRequestContextFetchLogResult = validatorPrimitives.tObject({
  log: validatorPrimitives.tArray(validatorPrimitives.tString)
});
validatorPrimitives.scheme.APIRequestContextStorageStateParams = validatorPrimitives.tObject({
  indexedDB: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.APIRequestContextStorageStateResult = validatorPrimitives.tObject({
  cookies: validatorPrimitives.tArray(validatorPrimitives.tType("NetworkCookie")),
  origins: validatorPrimitives.tArray(validatorPrimitives.tType("OriginStorage"))
});
validatorPrimitives.scheme.APIRequestContextDisposeAPIResponseParams = validatorPrimitives.tObject({
  fetchUid: validatorPrimitives.tString
});
validatorPrimitives.scheme.APIRequestContextDisposeAPIResponseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.APIRequestContextDisposeParams = validatorPrimitives.tObject({
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.APIRequestContextDisposeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.APIResponse = validatorPrimitives.tObject({
  fetchUid: validatorPrimitives.tString,
  url: validatorPrimitives.tString,
  status: validatorPrimitives.tNumber,
  statusText: validatorPrimitives.tString,
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.LifecycleEvent = validatorPrimitives.tEnum(["load", "domcontentloaded", "networkidle", "commit"]);
validatorPrimitives.scheme.LocalUtilsInitializer = validatorPrimitives.tObject({
  deviceDescriptors: validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    descriptor: validatorPrimitives.tObject({
      userAgent: validatorPrimitives.tString,
      viewport: validatorPrimitives.tObject({
        width: validatorPrimitives.tNumber,
        height: validatorPrimitives.tNumber
      }),
      screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
        width: validatorPrimitives.tNumber,
        height: validatorPrimitives.tNumber
      })),
      deviceScaleFactor: validatorPrimitives.tNumber,
      isMobile: validatorPrimitives.tBoolean,
      hasTouch: validatorPrimitives.tBoolean,
      defaultBrowserType: validatorPrimitives.tEnum(["chromium", "firefox", "webkit"])
    })
  }))
});
validatorPrimitives.scheme.LocalUtilsZipParams = validatorPrimitives.tObject({
  zipFile: validatorPrimitives.tString,
  entries: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  stacksId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  mode: validatorPrimitives.tEnum(["write", "append"]),
  includeSources: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.LocalUtilsZipResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.LocalUtilsHarOpenParams = validatorPrimitives.tObject({
  file: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsHarOpenResult = validatorPrimitives.tObject({
  harId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  error: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.LocalUtilsHarLookupParams = validatorPrimitives.tObject({
  harId: validatorPrimitives.tString,
  url: validatorPrimitives.tString,
  method: validatorPrimitives.tString,
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  postData: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  isNavigationRequest: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.LocalUtilsHarLookupResult = validatorPrimitives.tObject({
  action: validatorPrimitives.tEnum(["error", "redirect", "fulfill", "noentry"]),
  message: validatorPrimitives.tOptional(validatorPrimitives.tString),
  redirectURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  status: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  headers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  body: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
});
validatorPrimitives.scheme.LocalUtilsHarCloseParams = validatorPrimitives.tObject({
  harId: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsHarCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.LocalUtilsHarUnzipParams = validatorPrimitives.tObject({
  zipFile: validatorPrimitives.tString,
  harFile: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsHarUnzipResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.LocalUtilsConnectParams = validatorPrimitives.tObject({
  wsEndpoint: validatorPrimitives.tString,
  headers: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  exposeNetwork: validatorPrimitives.tOptional(validatorPrimitives.tString),
  slowMo: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber,
  socksProxyRedirectPortForTest: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.LocalUtilsConnectResult = validatorPrimitives.tObject({
  pipe: validatorPrimitives.tChannel(["JsonPipe"]),
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.LocalUtilsTracingStartedParams = validatorPrimitives.tObject({
  tracesDir: validatorPrimitives.tOptional(validatorPrimitives.tString),
  traceName: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsTracingStartedResult = validatorPrimitives.tObject({
  stacksId: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsAddStackToTracingNoReplyParams = validatorPrimitives.tObject({
  callData: validatorPrimitives.tType("ClientSideCallMetadata")
});
validatorPrimitives.scheme.LocalUtilsAddStackToTracingNoReplyResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.LocalUtilsTraceDiscardedParams = validatorPrimitives.tObject({
  stacksId: validatorPrimitives.tString
});
validatorPrimitives.scheme.LocalUtilsTraceDiscardedResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.LocalUtilsGlobToRegexParams = validatorPrimitives.tObject({
  glob: validatorPrimitives.tString,
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  webSocketUrl: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.LocalUtilsGlobToRegexResult = validatorPrimitives.tObject({
  regex: validatorPrimitives.tString
});
validatorPrimitives.scheme.RootInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RootInitializeParams = validatorPrimitives.tObject({
  sdkLanguage: validatorPrimitives.tEnum(["javascript", "python", "java", "csharp"])
});
validatorPrimitives.scheme.RootInitializeResult = validatorPrimitives.tObject({
  playwright: validatorPrimitives.tChannel(["Playwright"])
});
validatorPrimitives.scheme.PlaywrightInitializer = validatorPrimitives.tObject({
  chromium: validatorPrimitives.tChannel(["BrowserType"]),
  firefox: validatorPrimitives.tChannel(["BrowserType"]),
  webkit: validatorPrimitives.tChannel(["BrowserType"]),
  _bidiChromium: validatorPrimitives.tChannel(["BrowserType"]),
  _bidiFirefox: validatorPrimitives.tChannel(["BrowserType"]),
  android: validatorPrimitives.tChannel(["Android"]),
  electron: validatorPrimitives.tChannel(["Electron"]),
  utils: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["LocalUtils"])),
  preLaunchedBrowser: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Browser"])),
  preConnectedAndroidDevice: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["AndroidDevice"])),
  socksSupport: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["SocksSupport"]))
});
validatorPrimitives.scheme.PlaywrightNewRequestParams = validatorPrimitives.tObject({
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  failOnStatusCode: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    origin: validatorPrimitives.tString,
    cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
    pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
  }))),
  maxRedirects: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
    send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
  })),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  storageState: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    cookies: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NetworkCookie"))),
    origins: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SetOriginStorage")))
  })),
  tracesDir: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.PlaywrightNewRequestResult = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["APIRequestContext"])
});
validatorPrimitives.scheme.RecorderSource = validatorPrimitives.tObject({
  isRecorded: validatorPrimitives.tBoolean,
  id: validatorPrimitives.tString,
  label: validatorPrimitives.tString,
  text: validatorPrimitives.tString,
  language: validatorPrimitives.tString,
  highlight: validatorPrimitives.tArray(validatorPrimitives.tObject({
    line: validatorPrimitives.tNumber,
    type: validatorPrimitives.tString
  })),
  revealLine: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  group: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.DebugControllerInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerInspectRequestedEvent = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  locator: validatorPrimitives.tString,
  ariaSnapshot: validatorPrimitives.tString
});
validatorPrimitives.scheme.DebugControllerSetModeRequestedEvent = validatorPrimitives.tObject({
  mode: validatorPrimitives.tString
});
validatorPrimitives.scheme.DebugControllerStateChangedEvent = validatorPrimitives.tObject({
  pageCount: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.DebugControllerSourceChangedEvent = validatorPrimitives.tObject({
  text: validatorPrimitives.tString,
  header: validatorPrimitives.tOptional(validatorPrimitives.tString),
  footer: validatorPrimitives.tOptional(validatorPrimitives.tString),
  actions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString))
});
validatorPrimitives.scheme.DebugControllerPausedEvent = validatorPrimitives.tObject({
  paused: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.DebugControllerInitializeParams = validatorPrimitives.tObject({
  codegenId: validatorPrimitives.tString,
  sdkLanguage: validatorPrimitives.tEnum(["javascript", "python", "java", "csharp"])
});
validatorPrimitives.scheme.DebugControllerInitializeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerSetReportStateChangedParams = validatorPrimitives.tObject({
  enabled: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.DebugControllerSetReportStateChangedResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerResetForReuseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerResetForReuseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerNavigateParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tString
});
validatorPrimitives.scheme.DebugControllerNavigateResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerSetRecorderModeParams = validatorPrimitives.tObject({
  mode: validatorPrimitives.tEnum(["inspecting", "recording", "none"]),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.DebugControllerSetRecorderModeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerHighlightParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tOptional(validatorPrimitives.tString),
  ariaTemplate: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.DebugControllerHighlightResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerHideHighlightParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerHideHighlightResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerResumeParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerResumeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerKillParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerKillResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerCloseAllBrowsersParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DebugControllerCloseAllBrowsersResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportSocksRequestedEvent = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  host: validatorPrimitives.tString,
  port: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.SocksSupportSocksDataEvent = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  data: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.SocksSupportSocksClosedEvent = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString
});
validatorPrimitives.scheme.SocksSupportSocksConnectedParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  host: validatorPrimitives.tString,
  port: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.SocksSupportSocksConnectedResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportSocksFailedParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  errorCode: validatorPrimitives.tString
});
validatorPrimitives.scheme.SocksSupportSocksFailedResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportSocksDataParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  data: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.SocksSupportSocksDataResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportSocksErrorParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString,
  error: validatorPrimitives.tString
});
validatorPrimitives.scheme.SocksSupportSocksErrorResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.SocksSupportSocksEndParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tString
});
validatorPrimitives.scheme.SocksSupportSocksEndResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserTypeInitializer = validatorPrimitives.tObject({
  executablePath: validatorPrimitives.tString,
  name: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserTypeLaunchParams = validatorPrimitives.tObject({
  channel: validatorPrimitives.tOptional(validatorPrimitives.tString),
  executablePath: validatorPrimitives.tOptional(validatorPrimitives.tString),
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  ignoreAllDefaultArgs: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  ignoreDefaultArgs: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  assistantMode: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGINT: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGTERM: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGHUP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber,
  env: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  headless: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  devtools: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  downloadsPath: validatorPrimitives.tOptional(validatorPrimitives.tString),
  tracesDir: validatorPrimitives.tOptional(validatorPrimitives.tString),
  chromiumSandbox: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  firefoxUserPrefs: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  cdpPort: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  slowMo: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.BrowserTypeLaunchResult = validatorPrimitives.tObject({
  browser: validatorPrimitives.tChannel(["Browser"])
});
validatorPrimitives.scheme.BrowserTypeLaunchPersistentContextParams = validatorPrimitives.tObject({
  channel: validatorPrimitives.tOptional(validatorPrimitives.tString),
  executablePath: validatorPrimitives.tOptional(validatorPrimitives.tString),
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  ignoreAllDefaultArgs: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  ignoreDefaultArgs: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  assistantMode: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGINT: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGTERM: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  handleSIGHUP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber,
  env: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  headless: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  devtools: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  downloadsPath: validatorPrimitives.tOptional(validatorPrimitives.tString),
  tracesDir: validatorPrimitives.tOptional(validatorPrimitives.tString),
  chromiumSandbox: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  firefoxUserPrefs: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  cdpPort: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  noDefaultViewport: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  viewport: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    origin: validatorPrimitives.tString,
    cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
    pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
  }))),
  javaScriptEnabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
  locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
  timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  permissions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
    send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
  })),
  deviceScaleFactor: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  isMobile: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  hasTouch: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
  forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
  acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
  contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"])),
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    dir: validatorPrimitives.tString,
    size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    }))
  })),
  strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  serviceWorkers: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["allow", "block"])),
  selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  userDataDir: validatorPrimitives.tString,
  slowMo: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.BrowserTypeLaunchPersistentContextResult = validatorPrimitives.tObject({
  browser: validatorPrimitives.tChannel(["Browser"]),
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.BrowserTypeConnectOverCDPParams = validatorPrimitives.tObject({
  endpointURL: validatorPrimitives.tString,
  headers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  slowMo: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.BrowserTypeConnectOverCDPResult = validatorPrimitives.tObject({
  browser: validatorPrimitives.tChannel(["Browser"]),
  defaultContext: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["BrowserContext"]))
});
validatorPrimitives.scheme.BrowserInitializer = validatorPrimitives.tObject({
  version: validatorPrimitives.tString,
  name: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserContextEvent = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.BrowserCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserCloseParams = validatorPrimitives.tObject({
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserKillForTestsParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserKillForTestsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserDefaultUserAgentForTestParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserDefaultUserAgentForTestResult = validatorPrimitives.tObject({
  userAgent: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserNewContextParams = validatorPrimitives.tObject({
  noDefaultViewport: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  viewport: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    origin: validatorPrimitives.tString,
    cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
    pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
  }))),
  javaScriptEnabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
  locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
  timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  permissions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
    send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
  })),
  deviceScaleFactor: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  isMobile: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  hasTouch: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
  forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
  acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
  contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"])),
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    dir: validatorPrimitives.tString,
    size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    }))
  })),
  strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  serviceWorkers: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["allow", "block"])),
  selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  storageState: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    cookies: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SetNetworkCookie"))),
    origins: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SetOriginStorage")))
  }))
});
validatorPrimitives.scheme.BrowserNewContextResult = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.BrowserNewContextForReuseParams = validatorPrimitives.tObject({
  noDefaultViewport: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  viewport: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    origin: validatorPrimitives.tString,
    cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
    pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
  }))),
  javaScriptEnabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
  locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
  timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  permissions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
    send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
  })),
  deviceScaleFactor: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  isMobile: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  hasTouch: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
  forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
  acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
  contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"])),
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    dir: validatorPrimitives.tString,
    size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    }))
  })),
  strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  serviceWorkers: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["allow", "block"])),
  selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  storageState: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    cookies: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SetNetworkCookie"))),
    origins: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SetOriginStorage")))
  }))
});
validatorPrimitives.scheme.BrowserNewContextForReuseResult = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.BrowserDisconnectFromReusedContextParams = validatorPrimitives.tObject({
  reason: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserDisconnectFromReusedContextResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserNewBrowserCDPSessionParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserNewBrowserCDPSessionResult = validatorPrimitives.tObject({
  session: validatorPrimitives.tChannel(["CDPSession"])
});
validatorPrimitives.scheme.BrowserStartTracingParams = validatorPrimitives.tObject({
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"])),
  screenshots: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  categories: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString))
});
validatorPrimitives.scheme.BrowserStartTracingResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserStopTracingParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserStopTracingResult = validatorPrimitives.tObject({
  artifact: validatorPrimitives.tChannel(["Artifact"])
});
validatorPrimitives.scheme.EventTargetInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.EventTargetWaitForEventInfoParams = validatorPrimitives.tObject({
  info: validatorPrimitives.tObject({
    waitId: validatorPrimitives.tString,
    phase: validatorPrimitives.tEnum(["before", "after", "log"]),
    event: validatorPrimitives.tOptional(validatorPrimitives.tString),
    message: validatorPrimitives.tOptional(validatorPrimitives.tString),
    error: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })
});
validatorPrimitives.scheme.BrowserContextWaitForEventInfoParams = validatorPrimitives.tType("EventTargetWaitForEventInfoParams");
validatorPrimitives.scheme.PageWaitForEventInfoParams = validatorPrimitives.tType("EventTargetWaitForEventInfoParams");
validatorPrimitives.scheme.WebSocketWaitForEventInfoParams = validatorPrimitives.tType("EventTargetWaitForEventInfoParams");
validatorPrimitives.scheme.ElectronApplicationWaitForEventInfoParams = validatorPrimitives.tType("EventTargetWaitForEventInfoParams");
validatorPrimitives.scheme.AndroidDeviceWaitForEventInfoParams = validatorPrimitives.tType("EventTargetWaitForEventInfoParams");
validatorPrimitives.scheme.EventTargetWaitForEventInfoResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextWaitForEventInfoResult = validatorPrimitives.tType("EventTargetWaitForEventInfoResult");
validatorPrimitives.scheme.PageWaitForEventInfoResult = validatorPrimitives.tType("EventTargetWaitForEventInfoResult");
validatorPrimitives.scheme.WebSocketWaitForEventInfoResult = validatorPrimitives.tType("EventTargetWaitForEventInfoResult");
validatorPrimitives.scheme.ElectronApplicationWaitForEventInfoResult = validatorPrimitives.tType("EventTargetWaitForEventInfoResult");
validatorPrimitives.scheme.AndroidDeviceWaitForEventInfoResult = validatorPrimitives.tType("EventTargetWaitForEventInfoResult");
validatorPrimitives.scheme.BrowserContextInitializer = validatorPrimitives.tObject({
  isChromium: validatorPrimitives.tBoolean,
  requestContext: validatorPrimitives.tChannel(["APIRequestContext"]),
  tracing: validatorPrimitives.tChannel(["Tracing"]),
  options: validatorPrimitives.tObject({
    noDefaultViewport: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    viewport: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    })),
    screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    })),
    ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
      origin: validatorPrimitives.tString,
      cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
      key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
      passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
      pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
    }))),
    javaScriptEnabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
    locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
    timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
    geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      longitude: validatorPrimitives.tNumber,
      latitude: validatorPrimitives.tNumber,
      accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
    })),
    permissions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
    extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
    offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      username: validatorPrimitives.tString,
      password: validatorPrimitives.tString,
      origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
      send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
    })),
    deviceScaleFactor: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
    isMobile: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    hasTouch: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
    reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
    forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
    acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
    contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"])),
    baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
    recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      dir: validatorPrimitives.tString,
      size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
        width: validatorPrimitives.tNumber,
        height: validatorPrimitives.tNumber
      }))
    })),
    strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
    serviceWorkers: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["allow", "block"])),
    selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
    testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })
});
validatorPrimitives.scheme.BrowserContextBindingCallEvent = validatorPrimitives.tObject({
  binding: validatorPrimitives.tChannel(["BindingCall"])
});
validatorPrimitives.scheme.BrowserContextConsoleEvent = validatorPrimitives.tObject({
  type: validatorPrimitives.tString,
  text: validatorPrimitives.tString,
  args: validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])),
  location: validatorPrimitives.tObject({
    url: validatorPrimitives.tString,
    lineNumber: validatorPrimitives.tNumber,
    columnNumber: validatorPrimitives.tNumber
  }),
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextDialogEvent = validatorPrimitives.tObject({
  dialog: validatorPrimitives.tChannel(["Dialog"])
});
validatorPrimitives.scheme.BrowserContextPageEvent = validatorPrimitives.tObject({
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextPageErrorEvent = validatorPrimitives.tObject({
  error: validatorPrimitives.tType("SerializedError"),
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextRouteEvent = validatorPrimitives.tObject({
  route: validatorPrimitives.tChannel(["Route"])
});
validatorPrimitives.scheme.BrowserContextWebSocketRouteEvent = validatorPrimitives.tObject({
  webSocketRoute: validatorPrimitives.tChannel(["WebSocketRoute"])
});
validatorPrimitives.scheme.BrowserContextVideoEvent = validatorPrimitives.tObject({
  artifact: validatorPrimitives.tChannel(["Artifact"])
});
validatorPrimitives.scheme.BrowserContextBackgroundPageEvent = validatorPrimitives.tObject({
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextServiceWorkerEvent = validatorPrimitives.tObject({
  worker: validatorPrimitives.tChannel(["Worker"])
});
validatorPrimitives.scheme.BrowserContextRequestEvent = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["Request"]),
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"]))
});
validatorPrimitives.scheme.BrowserContextRequestFailedEvent = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["Request"]),
  failureText: validatorPrimitives.tOptional(validatorPrimitives.tString),
  responseEndTiming: validatorPrimitives.tNumber,
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"]))
});
validatorPrimitives.scheme.BrowserContextRequestFinishedEvent = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["Request"]),
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"])),
  responseEndTiming: validatorPrimitives.tNumber,
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"]))
});
validatorPrimitives.scheme.BrowserContextResponseEvent = validatorPrimitives.tObject({
  response: validatorPrimitives.tChannel(["Response"]),
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"]))
});
validatorPrimitives.scheme.BrowserContextRecorderEventEvent = validatorPrimitives.tObject({
  event: validatorPrimitives.tEnum(["actionAdded", "actionUpdated", "signalAdded"]),
  data: validatorPrimitives.tAny,
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextAddCookiesParams = validatorPrimitives.tObject({
  cookies: validatorPrimitives.tArray(validatorPrimitives.tType("SetNetworkCookie"))
});
validatorPrimitives.scheme.BrowserContextAddCookiesResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextAddInitScriptParams = validatorPrimitives.tObject({
  source: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserContextAddInitScriptResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClearCookiesParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tOptional(validatorPrimitives.tString),
  nameRegexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
  nameRegexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString),
  domain: validatorPrimitives.tOptional(validatorPrimitives.tString),
  domainRegexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
  domainRegexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString),
  path: validatorPrimitives.tOptional(validatorPrimitives.tString),
  pathRegexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
  pathRegexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClearCookiesResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClearPermissionsParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClearPermissionsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextCloseParams = validatorPrimitives.tObject({
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextCookiesParams = validatorPrimitives.tObject({
  urls: validatorPrimitives.tArray(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextCookiesResult = validatorPrimitives.tObject({
  cookies: validatorPrimitives.tArray(validatorPrimitives.tType("NetworkCookie"))
});
validatorPrimitives.scheme.BrowserContextExposeBindingParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  needsHandle: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.BrowserContextExposeBindingResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextGrantPermissionsParams = validatorPrimitives.tObject({
  permissions: validatorPrimitives.tArray(validatorPrimitives.tString),
  origin: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextGrantPermissionsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextNewPageParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextNewPageResult = validatorPrimitives.tObject({
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.BrowserContextRegisterSelectorEngineParams = validatorPrimitives.tObject({
  selectorEngine: validatorPrimitives.tType("SelectorEngine")
});
validatorPrimitives.scheme.BrowserContextRegisterSelectorEngineResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetTestIdAttributeNameParams = validatorPrimitives.tObject({
  testIdAttributeName: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserContextSetTestIdAttributeNameResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetExtraHTTPHeadersParams = validatorPrimitives.tObject({
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.BrowserContextSetExtraHTTPHeadersResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetGeolocationParams = validatorPrimitives.tObject({
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  }))
});
validatorPrimitives.scheme.BrowserContextSetGeolocationResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetHTTPCredentialsParams = validatorPrimitives.tObject({
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.BrowserContextSetHTTPCredentialsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetNetworkInterceptionPatternsParams = validatorPrimitives.tObject({
  patterns: validatorPrimitives.tArray(validatorPrimitives.tObject({
    glob: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.BrowserContextSetNetworkInterceptionPatternsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetWebSocketInterceptionPatternsParams = validatorPrimitives.tObject({
  patterns: validatorPrimitives.tArray(validatorPrimitives.tObject({
    glob: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.BrowserContextSetWebSocketInterceptionPatternsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextSetOfflineParams = validatorPrimitives.tObject({
  offline: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.BrowserContextSetOfflineResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextStorageStateParams = validatorPrimitives.tObject({
  indexedDB: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.BrowserContextStorageStateResult = validatorPrimitives.tObject({
  cookies: validatorPrimitives.tArray(validatorPrimitives.tType("NetworkCookie")),
  origins: validatorPrimitives.tArray(validatorPrimitives.tType("OriginStorage"))
});
validatorPrimitives.scheme.BrowserContextPauseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextPauseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextEnableRecorderParams = validatorPrimitives.tObject({
  language: validatorPrimitives.tOptional(validatorPrimitives.tString),
  mode: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["inspecting", "recording"])),
  recorderMode: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["default", "api"])),
  pauseOnNextStatement: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  launchOptions: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  contextOptions: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  device: validatorPrimitives.tOptional(validatorPrimitives.tString),
  saveStorage: validatorPrimitives.tOptional(validatorPrimitives.tString),
  outputFile: validatorPrimitives.tOptional(validatorPrimitives.tString),
  handleSIGINT: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  omitCallTracking: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.BrowserContextEnableRecorderResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextDisableRecorderParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextDisableRecorderResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextNewCDPSessionParams = validatorPrimitives.tObject({
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"])),
  frame: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Frame"]))
});
validatorPrimitives.scheme.BrowserContextNewCDPSessionResult = validatorPrimitives.tObject({
  session: validatorPrimitives.tChannel(["CDPSession"])
});
validatorPrimitives.scheme.BrowserContextHarStartParams = validatorPrimitives.tObject({
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"])),
  options: validatorPrimitives.tType("RecordHarOptions")
});
validatorPrimitives.scheme.BrowserContextHarStartResult = validatorPrimitives.tObject({
  harId: validatorPrimitives.tString
});
validatorPrimitives.scheme.BrowserContextHarExportParams = validatorPrimitives.tObject({
  harId: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextHarExportResult = validatorPrimitives.tObject({
  artifact: validatorPrimitives.tChannel(["Artifact"])
});
validatorPrimitives.scheme.BrowserContextCreateTempFilesParams = validatorPrimitives.tObject({
  rootDirName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  items: validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    lastModifiedMs: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  }))
});
validatorPrimitives.scheme.BrowserContextCreateTempFilesResult = validatorPrimitives.tObject({
  rootDir: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["WritableStream"])),
  writableStreams: validatorPrimitives.tArray(validatorPrimitives.tChannel(["WritableStream"]))
});
validatorPrimitives.scheme.BrowserContextUpdateSubscriptionParams = validatorPrimitives.tObject({
  event: validatorPrimitives.tEnum(["console", "dialog", "request", "response", "requestFinished", "requestFailed"]),
  enabled: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.BrowserContextUpdateSubscriptionResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockFastForwardParams = validatorPrimitives.tObject({
  ticksNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  ticksString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockFastForwardResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockInstallParams = validatorPrimitives.tObject({
  timeNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockInstallResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockPauseAtParams = validatorPrimitives.tObject({
  timeNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockPauseAtResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockResumeParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockResumeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockRunForParams = validatorPrimitives.tObject({
  ticksNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  ticksString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockRunForResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockSetFixedTimeParams = validatorPrimitives.tObject({
  timeNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockSetFixedTimeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BrowserContextClockSetSystemTimeParams = validatorPrimitives.tObject({
  timeNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeString: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.BrowserContextClockSetSystemTimeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageInitializer = validatorPrimitives.tObject({
  mainFrame: validatorPrimitives.tChannel(["Frame"]),
  viewportSize: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  isClosed: validatorPrimitives.tBoolean,
  opener: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"]))
});
validatorPrimitives.scheme.PageBindingCallEvent = validatorPrimitives.tObject({
  binding: validatorPrimitives.tChannel(["BindingCall"])
});
validatorPrimitives.scheme.PageCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageCrashEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageDownloadEvent = validatorPrimitives.tObject({
  url: validatorPrimitives.tString,
  suggestedFilename: validatorPrimitives.tString,
  artifact: validatorPrimitives.tChannel(["Artifact"])
});
validatorPrimitives.scheme.PageViewportSizeChangedEvent = validatorPrimitives.tObject({
  viewportSize: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  }))
});
validatorPrimitives.scheme.PageFileChooserEvent = validatorPrimitives.tObject({
  element: validatorPrimitives.tChannel(["ElementHandle"]),
  isMultiple: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.PageFrameAttachedEvent = validatorPrimitives.tObject({
  frame: validatorPrimitives.tChannel(["Frame"])
});
validatorPrimitives.scheme.PageFrameDetachedEvent = validatorPrimitives.tObject({
  frame: validatorPrimitives.tChannel(["Frame"])
});
validatorPrimitives.scheme.PageLocatorHandlerTriggeredEvent = validatorPrimitives.tObject({
  uid: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.PageRouteEvent = validatorPrimitives.tObject({
  route: validatorPrimitives.tChannel(["Route"])
});
validatorPrimitives.scheme.PageWebSocketRouteEvent = validatorPrimitives.tObject({
  webSocketRoute: validatorPrimitives.tChannel(["WebSocketRoute"])
});
validatorPrimitives.scheme.PageVideoEvent = validatorPrimitives.tObject({
  artifact: validatorPrimitives.tChannel(["Artifact"])
});
validatorPrimitives.scheme.PageWebSocketEvent = validatorPrimitives.tObject({
  webSocket: validatorPrimitives.tChannel(["WebSocket"])
});
validatorPrimitives.scheme.PageWorkerEvent = validatorPrimitives.tObject({
  worker: validatorPrimitives.tChannel(["Worker"])
});
validatorPrimitives.scheme.PageAddInitScriptParams = validatorPrimitives.tObject({
  source: validatorPrimitives.tString
});
validatorPrimitives.scheme.PageAddInitScriptResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageCloseParams = validatorPrimitives.tObject({
  runBeforeUnload: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.PageCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageEmulateMediaParams = validatorPrimitives.tObject({
  media: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["screen", "print", "no-override"])),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
  forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
  contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"]))
});
validatorPrimitives.scheme.PageEmulateMediaResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageExposeBindingParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  needsHandle: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PageExposeBindingResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageGoBackParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber,
  waitUntil: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.PageGoBackResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"]))
});
validatorPrimitives.scheme.PageGoForwardParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber,
  waitUntil: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.PageGoForwardResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"]))
});
validatorPrimitives.scheme.PageRequestGCParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageRequestGCResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageRegisterLocatorHandlerParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  noWaitAfter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PageRegisterLocatorHandlerResult = validatorPrimitives.tObject({
  uid: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.PageResolveLocatorHandlerNoReplyParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tNumber,
  remove: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PageResolveLocatorHandlerNoReplyResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageUnregisterLocatorHandlerParams = validatorPrimitives.tObject({
  uid: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.PageUnregisterLocatorHandlerResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageReloadParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber,
  waitUntil: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.PageReloadResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"]))
});
validatorPrimitives.scheme.PageExpectScreenshotParams = validatorPrimitives.tObject({
  expected: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  timeout: validatorPrimitives.tNumber,
  isNot: validatorPrimitives.tBoolean,
  locator: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    frame: validatorPrimitives.tChannel(["Frame"]),
    selector: validatorPrimitives.tString
  })),
  comparator: validatorPrimitives.tOptional(validatorPrimitives.tString),
  maxDiffPixels: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  maxDiffPixelRatio: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  threshold: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  fullPage: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clip: validatorPrimitives.tOptional(validatorPrimitives.tType("Rect")),
  omitBackground: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  caret: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["hide", "initial"])),
  animations: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["disabled", "allow"])),
  scale: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["css", "device"])),
  mask: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    frame: validatorPrimitives.tChannel(["Frame"]),
    selector: validatorPrimitives.tString
  }))),
  maskColor: validatorPrimitives.tOptional(validatorPrimitives.tString),
  style: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.PageExpectScreenshotResult = validatorPrimitives.tObject({
  diff: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  errorMessage: validatorPrimitives.tOptional(validatorPrimitives.tString),
  actual: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  previous: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  timedOut: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  log: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString))
});
validatorPrimitives.scheme.PageScreenshotParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber,
  type: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["png", "jpeg"])),
  quality: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  fullPage: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clip: validatorPrimitives.tOptional(validatorPrimitives.tType("Rect")),
  omitBackground: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  caret: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["hide", "initial"])),
  animations: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["disabled", "allow"])),
  scale: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["css", "device"])),
  mask: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    frame: validatorPrimitives.tChannel(["Frame"]),
    selector: validatorPrimitives.tString
  }))),
  maskColor: validatorPrimitives.tOptional(validatorPrimitives.tString),
  style: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.PageScreenshotResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.PageSetExtraHTTPHeadersParams = validatorPrimitives.tObject({
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.PageSetExtraHTTPHeadersResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageSetNetworkInterceptionPatternsParams = validatorPrimitives.tObject({
  patterns: validatorPrimitives.tArray(validatorPrimitives.tObject({
    glob: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.PageSetNetworkInterceptionPatternsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageSetWebSocketInterceptionPatternsParams = validatorPrimitives.tObject({
  patterns: validatorPrimitives.tArray(validatorPrimitives.tObject({
    glob: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexSource: validatorPrimitives.tOptional(validatorPrimitives.tString),
    regexFlags: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.PageSetWebSocketInterceptionPatternsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageSetViewportSizeParams = validatorPrimitives.tObject({
  viewportSize: validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })
});
validatorPrimitives.scheme.PageSetViewportSizeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageKeyboardDownParams = validatorPrimitives.tObject({
  key: validatorPrimitives.tString
});
validatorPrimitives.scheme.PageKeyboardDownResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageKeyboardUpParams = validatorPrimitives.tObject({
  key: validatorPrimitives.tString
});
validatorPrimitives.scheme.PageKeyboardUpResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageKeyboardInsertTextParams = validatorPrimitives.tObject({
  text: validatorPrimitives.tString
});
validatorPrimitives.scheme.PageKeyboardInsertTextResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageKeyboardTypeParams = validatorPrimitives.tObject({
  text: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageKeyboardTypeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageKeyboardPressParams = validatorPrimitives.tObject({
  key: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageKeyboardPressResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageMouseMoveParams = validatorPrimitives.tObject({
  x: validatorPrimitives.tNumber,
  y: validatorPrimitives.tNumber,
  steps: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageMouseMoveResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageMouseDownParams = validatorPrimitives.tObject({
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  clickCount: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageMouseDownResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageMouseUpParams = validatorPrimitives.tObject({
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  clickCount: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageMouseUpResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageMouseClickParams = validatorPrimitives.tObject({
  x: validatorPrimitives.tNumber,
  y: validatorPrimitives.tNumber,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  clickCount: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.PageMouseClickResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageMouseWheelParams = validatorPrimitives.tObject({
  deltaX: validatorPrimitives.tNumber,
  deltaY: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.PageMouseWheelResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageTouchscreenTapParams = validatorPrimitives.tObject({
  x: validatorPrimitives.tNumber,
  y: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.PageTouchscreenTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageAccessibilitySnapshotParams = validatorPrimitives.tObject({
  interestingOnly: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  root: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.PageAccessibilitySnapshotResult = validatorPrimitives.tObject({
  rootAXNode: validatorPrimitives.tOptional(validatorPrimitives.tType("AXNode"))
});
validatorPrimitives.scheme.PagePdfParams = validatorPrimitives.tObject({
  scale: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  displayHeaderFooter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  headerTemplate: validatorPrimitives.tOptional(validatorPrimitives.tString),
  footerTemplate: validatorPrimitives.tOptional(validatorPrimitives.tString),
  printBackground: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  landscape: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  pageRanges: validatorPrimitives.tOptional(validatorPrimitives.tString),
  format: validatorPrimitives.tOptional(validatorPrimitives.tString),
  width: validatorPrimitives.tOptional(validatorPrimitives.tString),
  height: validatorPrimitives.tOptional(validatorPrimitives.tString),
  preferCSSPageSize: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  margin: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    top: validatorPrimitives.tOptional(validatorPrimitives.tString),
    bottom: validatorPrimitives.tOptional(validatorPrimitives.tString),
    left: validatorPrimitives.tOptional(validatorPrimitives.tString),
    right: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  tagged: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  outline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PagePdfResult = validatorPrimitives.tObject({
  pdf: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.PageSnapshotForAIParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageSnapshotForAIResult = validatorPrimitives.tObject({
  snapshot: validatorPrimitives.tString
});
validatorPrimitives.scheme.PageStartJSCoverageParams = validatorPrimitives.tObject({
  resetOnNavigation: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  reportAnonymousScripts: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PageStartJSCoverageResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageStopJSCoverageParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageStopJSCoverageResult = validatorPrimitives.tObject({
  entries: validatorPrimitives.tArray(validatorPrimitives.tObject({
    url: validatorPrimitives.tString,
    scriptId: validatorPrimitives.tString,
    source: validatorPrimitives.tOptional(validatorPrimitives.tString),
    functions: validatorPrimitives.tArray(validatorPrimitives.tObject({
      functionName: validatorPrimitives.tString,
      isBlockCoverage: validatorPrimitives.tBoolean,
      ranges: validatorPrimitives.tArray(validatorPrimitives.tObject({
        startOffset: validatorPrimitives.tNumber,
        endOffset: validatorPrimitives.tNumber,
        count: validatorPrimitives.tNumber
      }))
    }))
  }))
});
validatorPrimitives.scheme.PageStartCSSCoverageParams = validatorPrimitives.tObject({
  resetOnNavigation: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.PageStartCSSCoverageResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageStopCSSCoverageParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageStopCSSCoverageResult = validatorPrimitives.tObject({
  entries: validatorPrimitives.tArray(validatorPrimitives.tObject({
    url: validatorPrimitives.tString,
    text: validatorPrimitives.tOptional(validatorPrimitives.tString),
    ranges: validatorPrimitives.tArray(validatorPrimitives.tObject({
      start: validatorPrimitives.tNumber,
      end: validatorPrimitives.tNumber
    }))
  }))
});
validatorPrimitives.scheme.PageBringToFrontParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageBringToFrontResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.PageUpdateSubscriptionParams = validatorPrimitives.tObject({
  event: validatorPrimitives.tEnum(["console", "dialog", "fileChooser", "request", "response", "requestFinished", "requestFailed"]),
  enabled: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.PageUpdateSubscriptionResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameInitializer = validatorPrimitives.tObject({
  url: validatorPrimitives.tString,
  name: validatorPrimitives.tString,
  parentFrame: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Frame"])),
  loadStates: validatorPrimitives.tArray(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.FrameLoadstateEvent = validatorPrimitives.tObject({
  add: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent")),
  remove: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.FrameNavigatedEvent = validatorPrimitives.tObject({
  url: validatorPrimitives.tString,
  name: validatorPrimitives.tString,
  newDocument: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    request: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Request"]))
  })),
  error: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameEvalOnSelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.FrameEvalOnSelectorResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.FrameEvalOnSelectorAllParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.FrameEvalOnSelectorAllResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.FrameAddScriptTagParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tOptional(validatorPrimitives.tString),
  content: validatorPrimitives.tOptional(validatorPrimitives.tString),
  type: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameAddScriptTagResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tChannel(["ElementHandle"])
});
validatorPrimitives.scheme.FrameAddStyleTagParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tOptional(validatorPrimitives.tString),
  content: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameAddStyleTagResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tChannel(["ElementHandle"])
});
validatorPrimitives.scheme.FrameAriaSnapshotParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  forAI: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameAriaSnapshotResult = validatorPrimitives.tObject({
  snapshot: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameBlurParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameBlurResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameCheckParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameCheckResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameClickParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  noWaitAfter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  clickCount: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameClickResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameContentParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameContentResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameDragAndDropParams = validatorPrimitives.tObject({
  source: validatorPrimitives.tString,
  target: validatorPrimitives.tString,
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  sourcePosition: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  targetPosition: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameDragAndDropResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameDblclickParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameDblclickResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameDispatchEventParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  type: validatorPrimitives.tString,
  eventInit: validatorPrimitives.tType("SerializedArgument"),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameDispatchEventResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameEvaluateExpressionParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.FrameEvaluateExpressionResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.FrameEvaluateExpressionHandleParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.FrameEvaluateExpressionHandleResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.FrameFillParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  value: validatorPrimitives.tString,
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameFillResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameFocusParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameFocusResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameFrameElementParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameFrameElementResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tChannel(["ElementHandle"])
});
validatorPrimitives.scheme.FrameGenerateLocatorStringParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameGenerateLocatorStringResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameHighlightParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameHighlightResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameGetAttributeParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  name: validatorPrimitives.tString,
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameGetAttributeResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameGotoParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tString,
  timeout: validatorPrimitives.tNumber,
  waitUntil: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent")),
  referer: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameGotoResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"]))
});
validatorPrimitives.scheme.FrameHoverParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameHoverResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameInnerHTMLParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameInnerHTMLResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameInnerTextParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameInnerTextResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameInputValueParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameInputValueResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameIsCheckedParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameIsCheckedResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FrameIsDisabledParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameIsDisabledResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FrameIsEnabledParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameIsEnabledResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FrameIsHiddenParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameIsHiddenResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FrameIsVisibleParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameIsVisibleResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FrameIsEditableParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameIsEditableResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.FramePressParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  key: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  noWaitAfter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FramePressResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameQuerySelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameQuerySelectorResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.FrameQuerySelectorAllParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameQuerySelectorAllResult = validatorPrimitives.tObject({
  elements: validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.FrameQueryCountParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameQueryCountResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameSelectOptionParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  elements: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle"]))),
  options: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    valueOrLabel: validatorPrimitives.tOptional(validatorPrimitives.tString),
    value: validatorPrimitives.tOptional(validatorPrimitives.tString),
    label: validatorPrimitives.tOptional(validatorPrimitives.tString),
    index: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  }))),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameSelectOptionResult = validatorPrimitives.tObject({
  values: validatorPrimitives.tArray(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameSetContentParams = validatorPrimitives.tObject({
  html: validatorPrimitives.tString,
  timeout: validatorPrimitives.tNumber,
  waitUntil: validatorPrimitives.tOptional(validatorPrimitives.tType("LifecycleEvent"))
});
validatorPrimitives.scheme.FrameSetContentResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameSetInputFilesParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  payloads: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    mimeType: validatorPrimitives.tOptional(validatorPrimitives.tString),
    buffer: validatorPrimitives.tBinary
  }))),
  localDirectory: validatorPrimitives.tOptional(validatorPrimitives.tString),
  directoryStream: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["WritableStream"])),
  localPaths: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  streams: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tChannel(["WritableStream"]))),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameSetInputFilesResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameTapParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameTextContentParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameTextContentResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.FrameTitleParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameTitleResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.FrameTypeParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  text: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameTypeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameUncheckParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameUncheckResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameWaitForTimeoutParams = validatorPrimitives.tObject({
  waitTimeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameWaitForTimeoutResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.FrameWaitForFunctionParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument"),
  timeout: validatorPrimitives.tNumber,
  pollingInterval: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.FrameWaitForFunctionResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.FrameWaitForSelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber,
  state: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["attached", "detached", "visible", "hidden"])),
  omitReturnValue: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.FrameWaitForSelectorResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.FrameExpectParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tOptional(validatorPrimitives.tString),
  expression: validatorPrimitives.tString,
  expressionArg: validatorPrimitives.tOptional(validatorPrimitives.tAny),
  expectedText: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("ExpectedTextValue"))),
  expectedNumber: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  expectedValue: validatorPrimitives.tOptional(validatorPrimitives.tType("SerializedArgument")),
  useInnerText: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  isNot: validatorPrimitives.tBoolean,
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.FrameExpectResult = validatorPrimitives.tObject({
  matches: validatorPrimitives.tBoolean,
  received: validatorPrimitives.tOptional(validatorPrimitives.tType("SerializedValue")),
  timedOut: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  log: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString))
});
validatorPrimitives.scheme.WorkerInitializer = validatorPrimitives.tObject({
  url: validatorPrimitives.tString
});
validatorPrimitives.scheme.WorkerCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WorkerEvaluateExpressionParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.WorkerEvaluateExpressionResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.WorkerEvaluateExpressionHandleParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.WorkerEvaluateExpressionHandleResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.JSHandleInitializer = validatorPrimitives.tObject({
  preview: validatorPrimitives.tString
});
validatorPrimitives.scheme.JSHandlePreviewUpdatedEvent = validatorPrimitives.tObject({
  preview: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandlePreviewUpdatedEvent = validatorPrimitives.tType("JSHandlePreviewUpdatedEvent");
validatorPrimitives.scheme.JSHandleDisposeParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleDisposeParams = validatorPrimitives.tType("JSHandleDisposeParams");
validatorPrimitives.scheme.JSHandleDisposeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleDisposeResult = validatorPrimitives.tType("JSHandleDisposeResult");
validatorPrimitives.scheme.JSHandleEvaluateExpressionParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElementHandleEvaluateExpressionParams = validatorPrimitives.tType("JSHandleEvaluateExpressionParams");
validatorPrimitives.scheme.JSHandleEvaluateExpressionResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.ElementHandleEvaluateExpressionResult = validatorPrimitives.tType("JSHandleEvaluateExpressionResult");
validatorPrimitives.scheme.JSHandleEvaluateExpressionHandleParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElementHandleEvaluateExpressionHandleParams = validatorPrimitives.tType("JSHandleEvaluateExpressionHandleParams");
validatorPrimitives.scheme.JSHandleEvaluateExpressionHandleResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.ElementHandleEvaluateExpressionHandleResult = validatorPrimitives.tType("JSHandleEvaluateExpressionHandleResult");
validatorPrimitives.scheme.JSHandleGetPropertyListParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleGetPropertyListParams = validatorPrimitives.tType("JSHandleGetPropertyListParams");
validatorPrimitives.scheme.JSHandleGetPropertyListResult = validatorPrimitives.tObject({
  properties: validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    value: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
  }))
});
validatorPrimitives.scheme.ElementHandleGetPropertyListResult = validatorPrimitives.tType("JSHandleGetPropertyListResult");
validatorPrimitives.scheme.JSHandleGetPropertyParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleGetPropertyParams = validatorPrimitives.tType("JSHandleGetPropertyParams");
validatorPrimitives.scheme.JSHandleGetPropertyResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.ElementHandleGetPropertyResult = validatorPrimitives.tType("JSHandleGetPropertyResult");
validatorPrimitives.scheme.JSHandleJsonValueParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleJsonValueParams = validatorPrimitives.tType("JSHandleJsonValueParams");
validatorPrimitives.scheme.JSHandleJsonValueResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.ElementHandleJsonValueResult = validatorPrimitives.tType("JSHandleJsonValueResult");
validatorPrimitives.scheme.ElementHandleInitializer = validatorPrimitives.tObject({
  preview: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleEvalOnSelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElementHandleEvalOnSelectorResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.ElementHandleEvalOnSelectorAllParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElementHandleEvalOnSelectorAllResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.ElementHandleBoundingBoxParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleBoundingBoxResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tType("Rect"))
});
validatorPrimitives.scheme.ElementHandleCheckParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleCheckResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleClickParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  noWaitAfter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  clickCount: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleClickResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleContentFrameParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleContentFrameResult = validatorPrimitives.tObject({
  frame: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Frame"]))
});
validatorPrimitives.scheme.ElementHandleDblclickParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  button: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["left", "right", "middle"])),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleDblclickResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleDispatchEventParams = validatorPrimitives.tObject({
  type: validatorPrimitives.tString,
  eventInit: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElementHandleDispatchEventResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleFillParams = validatorPrimitives.tObject({
  value: validatorPrimitives.tString,
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleFillResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleFocusParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleFocusResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleGetAttributeParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleGetAttributeResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ElementHandleHoverParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleHoverResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleInnerHTMLParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleInnerHTMLResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleInnerTextParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleInnerTextResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleInputValueParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleInputValueResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleIsCheckedParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsCheckedResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleIsDisabledParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsDisabledResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleIsEditableParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsEditableResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleIsEnabledParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsEnabledResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleIsHiddenParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsHiddenResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleIsVisibleParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleIsVisibleResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElementHandleOwnerFrameParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleOwnerFrameResult = validatorPrimitives.tObject({
  frame: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Frame"]))
});
validatorPrimitives.scheme.ElementHandlePressParams = validatorPrimitives.tObject({
  key: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber,
  noWaitAfter: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandlePressResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleQuerySelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleQuerySelectorResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.ElementHandleQuerySelectorAllParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString
});
validatorPrimitives.scheme.ElementHandleQuerySelectorAllResult = validatorPrimitives.tObject({
  elements: validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.ElementHandleScreenshotParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber,
  type: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["png", "jpeg"])),
  quality: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  omitBackground: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  caret: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["hide", "initial"])),
  animations: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["disabled", "allow"])),
  scale: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["css", "device"])),
  mask: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    frame: validatorPrimitives.tChannel(["Frame"]),
    selector: validatorPrimitives.tString
  }))),
  maskColor: validatorPrimitives.tOptional(validatorPrimitives.tString),
  style: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ElementHandleScreenshotResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.ElementHandleScrollIntoViewIfNeededParams = validatorPrimitives.tObject({
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleScrollIntoViewIfNeededResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleSelectOptionParams = validatorPrimitives.tObject({
  elements: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle"]))),
  options: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    valueOrLabel: validatorPrimitives.tOptional(validatorPrimitives.tString),
    value: validatorPrimitives.tOptional(validatorPrimitives.tString),
    label: validatorPrimitives.tOptional(validatorPrimitives.tString),
    index: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  }))),
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleSelectOptionResult = validatorPrimitives.tObject({
  values: validatorPrimitives.tArray(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ElementHandleSelectTextParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleSelectTextResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleSetInputFilesParams = validatorPrimitives.tObject({
  payloads: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    name: validatorPrimitives.tString,
    mimeType: validatorPrimitives.tOptional(validatorPrimitives.tString),
    buffer: validatorPrimitives.tBinary
  }))),
  localDirectory: validatorPrimitives.tOptional(validatorPrimitives.tString),
  directoryStream: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["WritableStream"])),
  localPaths: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  streams: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tChannel(["WritableStream"]))),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleSetInputFilesResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleTapParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  modifiers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tEnum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"]))),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleTextContentParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleTextContentResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ElementHandleTypeParams = validatorPrimitives.tObject({
  text: validatorPrimitives.tString,
  delay: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleTypeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleUncheckParams = validatorPrimitives.tObject({
  force: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  position: validatorPrimitives.tOptional(validatorPrimitives.tType("Point")),
  timeout: validatorPrimitives.tNumber,
  trial: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.ElementHandleUncheckResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleWaitForElementStateParams = validatorPrimitives.tObject({
  state: validatorPrimitives.tEnum(["visible", "hidden", "stable", "enabled", "disabled", "editable"]),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ElementHandleWaitForElementStateResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElementHandleWaitForSelectorParams = validatorPrimitives.tObject({
  selector: validatorPrimitives.tString,
  strict: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timeout: validatorPrimitives.tNumber,
  state: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["attached", "detached", "visible", "hidden"]))
});
validatorPrimitives.scheme.ElementHandleWaitForSelectorResult = validatorPrimitives.tObject({
  element: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle"]))
});
validatorPrimitives.scheme.RequestInitializer = validatorPrimitives.tObject({
  frame: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Frame"])),
  serviceWorker: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Worker"])),
  url: validatorPrimitives.tString,
  resourceType: validatorPrimitives.tString,
  method: validatorPrimitives.tString,
  postData: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  isNavigationRequest: validatorPrimitives.tBoolean,
  redirectedFrom: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Request"]))
});
validatorPrimitives.scheme.RequestResponseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RequestResponseResult = validatorPrimitives.tObject({
  response: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Response"]))
});
validatorPrimitives.scheme.RequestRawRequestHeadersParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RequestRawRequestHeadersResult = validatorPrimitives.tObject({
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.RouteInitializer = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["Request"])
});
validatorPrimitives.scheme.RouteRedirectNavigationRequestParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tString
});
validatorPrimitives.scheme.RouteRedirectNavigationRequestResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RouteAbortParams = validatorPrimitives.tObject({
  errorCode: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.RouteAbortResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RouteContinueParams = validatorPrimitives.tObject({
  url: validatorPrimitives.tOptional(validatorPrimitives.tString),
  method: validatorPrimitives.tOptional(validatorPrimitives.tString),
  headers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  postData: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
  isFallback: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.RouteContinueResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.RouteFulfillParams = validatorPrimitives.tObject({
  status: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  headers: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  body: validatorPrimitives.tOptional(validatorPrimitives.tString),
  isBase64: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  fetchResponseUid: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.RouteFulfillResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteInitializer = validatorPrimitives.tObject({
  url: validatorPrimitives.tString
});
validatorPrimitives.scheme.WebSocketRouteMessageFromPageEvent = validatorPrimitives.tObject({
  message: validatorPrimitives.tString,
  isBase64: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteMessageFromServerEvent = validatorPrimitives.tObject({
  message: validatorPrimitives.tString,
  isBase64: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteClosePageEvent = validatorPrimitives.tObject({
  code: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString),
  wasClean: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteCloseServerEvent = validatorPrimitives.tObject({
  code: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString),
  wasClean: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteConnectParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteConnectResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteEnsureOpenedParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteEnsureOpenedResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteSendToPageParams = validatorPrimitives.tObject({
  message: validatorPrimitives.tString,
  isBase64: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteSendToPageResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteSendToServerParams = validatorPrimitives.tObject({
  message: validatorPrimitives.tString,
  isBase64: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteSendToServerResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteClosePageParams = validatorPrimitives.tObject({
  code: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString),
  wasClean: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteClosePageResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketRouteCloseServerParams = validatorPrimitives.tObject({
  code: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString),
  wasClean: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.WebSocketRouteCloseServerResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResourceTiming = validatorPrimitives.tObject({
  startTime: validatorPrimitives.tNumber,
  domainLookupStart: validatorPrimitives.tNumber,
  domainLookupEnd: validatorPrimitives.tNumber,
  connectStart: validatorPrimitives.tNumber,
  secureConnectionStart: validatorPrimitives.tNumber,
  connectEnd: validatorPrimitives.tNumber,
  requestStart: validatorPrimitives.tNumber,
  responseStart: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.ResponseInitializer = validatorPrimitives.tObject({
  request: validatorPrimitives.tChannel(["Request"]),
  url: validatorPrimitives.tString,
  status: validatorPrimitives.tNumber,
  statusText: validatorPrimitives.tString,
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")),
  timing: validatorPrimitives.tType("ResourceTiming"),
  fromServiceWorker: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ResponseBodyParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResponseBodyResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.ResponseSecurityDetailsParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResponseSecurityDetailsResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tType("SecurityDetails"))
});
validatorPrimitives.scheme.ResponseServerAddrParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResponseServerAddrResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tOptional(validatorPrimitives.tType("RemoteAddr"))
});
validatorPrimitives.scheme.ResponseRawResponseHeadersParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResponseRawResponseHeadersResult = validatorPrimitives.tObject({
  headers: validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))
});
validatorPrimitives.scheme.ResponseSizesParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ResponseSizesResult = validatorPrimitives.tObject({
  sizes: validatorPrimitives.tType("RequestSizes")
});
validatorPrimitives.scheme.SecurityDetails = validatorPrimitives.tObject({
  issuer: validatorPrimitives.tOptional(validatorPrimitives.tString),
  protocol: validatorPrimitives.tOptional(validatorPrimitives.tString),
  subjectName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  validFrom: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  validTo: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.RequestSizes = validatorPrimitives.tObject({
  requestBodySize: validatorPrimitives.tNumber,
  requestHeadersSize: validatorPrimitives.tNumber,
  responseBodySize: validatorPrimitives.tNumber,
  responseHeadersSize: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.RemoteAddr = validatorPrimitives.tObject({
  ipAddress: validatorPrimitives.tString,
  port: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.WebSocketInitializer = validatorPrimitives.tObject({
  url: validatorPrimitives.tString
});
validatorPrimitives.scheme.WebSocketOpenEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WebSocketFrameSentEvent = validatorPrimitives.tObject({
  opcode: validatorPrimitives.tNumber,
  data: validatorPrimitives.tString
});
validatorPrimitives.scheme.WebSocketFrameReceivedEvent = validatorPrimitives.tObject({
  opcode: validatorPrimitives.tNumber,
  data: validatorPrimitives.tString
});
validatorPrimitives.scheme.WebSocketSocketErrorEvent = validatorPrimitives.tObject({
  error: validatorPrimitives.tString
});
validatorPrimitives.scheme.WebSocketCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BindingCallInitializer = validatorPrimitives.tObject({
  frame: validatorPrimitives.tChannel(["Frame"]),
  name: validatorPrimitives.tString,
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SerializedValue"))),
  handle: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["ElementHandle", "JSHandle"]))
});
validatorPrimitives.scheme.BindingCallRejectParams = validatorPrimitives.tObject({
  error: validatorPrimitives.tType("SerializedError")
});
validatorPrimitives.scheme.BindingCallRejectResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.BindingCallResolveParams = validatorPrimitives.tObject({
  result: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.BindingCallResolveResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DialogInitializer = validatorPrimitives.tObject({
  page: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Page"])),
  type: validatorPrimitives.tString,
  message: validatorPrimitives.tString,
  defaultValue: validatorPrimitives.tString
});
validatorPrimitives.scheme.DialogAcceptParams = validatorPrimitives.tObject({
  promptText: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.DialogAcceptResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DialogDismissParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.DialogDismissResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingStartParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tOptional(validatorPrimitives.tString),
  snapshots: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  screenshots: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  live: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.TracingTracingStartResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingStartChunkParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tOptional(validatorPrimitives.tString),
  title: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.TracingTracingStartChunkResult = validatorPrimitives.tObject({
  traceName: validatorPrimitives.tString
});
validatorPrimitives.scheme.TracingTracingGroupParams = validatorPrimitives.tObject({
  name: validatorPrimitives.tString,
  location: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    file: validatorPrimitives.tString,
    line: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
    column: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  }))
});
validatorPrimitives.scheme.TracingTracingGroupResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingGroupEndParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingGroupEndResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingStopChunkParams = validatorPrimitives.tObject({
  mode: validatorPrimitives.tEnum(["archive", "discard", "entries"])
});
validatorPrimitives.scheme.TracingTracingStopChunkResult = validatorPrimitives.tObject({
  artifact: validatorPrimitives.tOptional(validatorPrimitives.tChannel(["Artifact"])),
  entries: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue")))
});
validatorPrimitives.scheme.TracingTracingStopParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.TracingTracingStopResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactInitializer = validatorPrimitives.tObject({
  absolutePath: validatorPrimitives.tString
});
validatorPrimitives.scheme.ArtifactPathAfterFinishedParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactPathAfterFinishedResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tString
});
validatorPrimitives.scheme.ArtifactSaveAsParams = validatorPrimitives.tObject({
  path: validatorPrimitives.tString
});
validatorPrimitives.scheme.ArtifactSaveAsResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactSaveAsStreamParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactSaveAsStreamResult = validatorPrimitives.tObject({
  stream: validatorPrimitives.tChannel(["Stream"])
});
validatorPrimitives.scheme.ArtifactFailureParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactFailureResult = validatorPrimitives.tObject({
  error: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ArtifactStreamParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactStreamResult = validatorPrimitives.tObject({
  stream: validatorPrimitives.tChannel(["Stream"])
});
validatorPrimitives.scheme.ArtifactCancelParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactCancelResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactDeleteParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ArtifactDeleteResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.StreamInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.StreamReadParams = validatorPrimitives.tObject({
  size: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.StreamReadResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.StreamCloseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.StreamCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WritableStreamInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WritableStreamWriteParams = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.WritableStreamWriteResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WritableStreamCloseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.WritableStreamCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.CDPSessionInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.CDPSessionEventEvent = validatorPrimitives.tObject({
  method: validatorPrimitives.tString,
  params: validatorPrimitives.tOptional(validatorPrimitives.tAny)
});
validatorPrimitives.scheme.CDPSessionSendParams = validatorPrimitives.tObject({
  method: validatorPrimitives.tString,
  params: validatorPrimitives.tOptional(validatorPrimitives.tAny)
});
validatorPrimitives.scheme.CDPSessionSendResult = validatorPrimitives.tObject({
  result: validatorPrimitives.tAny
});
validatorPrimitives.scheme.CDPSessionDetachParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.CDPSessionDetachResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElectronInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElectronLaunchParams = validatorPrimitives.tObject({
  executablePath: validatorPrimitives.tOptional(validatorPrimitives.tString),
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  cwd: validatorPrimitives.tOptional(validatorPrimitives.tString),
  env: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  timeout: validatorPrimitives.tNumber,
  acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
  bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString)
  })),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
  offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    dir: validatorPrimitives.tString,
    size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    }))
  })),
  strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  tracesDir: validatorPrimitives.tOptional(validatorPrimitives.tString),
  selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.ElectronLaunchResult = validatorPrimitives.tObject({
  electronApplication: validatorPrimitives.tChannel(["ElectronApplication"])
});
validatorPrimitives.scheme.ElectronApplicationInitializer = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.ElectronApplicationCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.ElectronApplicationConsoleEvent = validatorPrimitives.tObject({
  type: validatorPrimitives.tString,
  text: validatorPrimitives.tString,
  args: validatorPrimitives.tArray(validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])),
  location: validatorPrimitives.tObject({
    url: validatorPrimitives.tString,
    lineNumber: validatorPrimitives.tNumber,
    columnNumber: validatorPrimitives.tNumber
  })
});
validatorPrimitives.scheme.ElectronApplicationBrowserWindowParams = validatorPrimitives.tObject({
  page: validatorPrimitives.tChannel(["Page"])
});
validatorPrimitives.scheme.ElectronApplicationBrowserWindowResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.ElectronApplicationEvaluateExpressionParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElectronApplicationEvaluateExpressionResult = validatorPrimitives.tObject({
  value: validatorPrimitives.tType("SerializedValue")
});
validatorPrimitives.scheme.ElectronApplicationEvaluateExpressionHandleParams = validatorPrimitives.tObject({
  expression: validatorPrimitives.tString,
  isFunction: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  arg: validatorPrimitives.tType("SerializedArgument")
});
validatorPrimitives.scheme.ElectronApplicationEvaluateExpressionHandleResult = validatorPrimitives.tObject({
  handle: validatorPrimitives.tChannel(["ElementHandle", "JSHandle"])
});
validatorPrimitives.scheme.ElectronApplicationUpdateSubscriptionParams = validatorPrimitives.tObject({
  event: validatorPrimitives.tEnum(["console"]),
  enabled: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.ElectronApplicationUpdateSubscriptionResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDevicesParams = validatorPrimitives.tObject({
  host: validatorPrimitives.tOptional(validatorPrimitives.tString),
  port: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  omitDriverInstall: validatorPrimitives.tOptional(validatorPrimitives.tBoolean)
});
validatorPrimitives.scheme.AndroidDevicesResult = validatorPrimitives.tObject({
  devices: validatorPrimitives.tArray(validatorPrimitives.tChannel(["AndroidDevice"]))
});
validatorPrimitives.scheme.AndroidSocketInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidSocketDataEvent = validatorPrimitives.tObject({
  data: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.AndroidSocketCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidSocketWriteParams = validatorPrimitives.tObject({
  data: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.AndroidSocketWriteResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidSocketCloseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidSocketCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInitializer = validatorPrimitives.tObject({
  model: validatorPrimitives.tString,
  serial: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceCloseEvent = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceWebViewAddedEvent = validatorPrimitives.tObject({
  webView: validatorPrimitives.tType("AndroidWebView")
});
validatorPrimitives.scheme.AndroidDeviceWebViewRemovedEvent = validatorPrimitives.tObject({
  socketName: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceWaitParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  state: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["gone"])),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceWaitResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceFillParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  text: validatorPrimitives.tString,
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceFillResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceTapParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  duration: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceDragParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  dest: validatorPrimitives.tType("Point"),
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceDragResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceFlingParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  direction: validatorPrimitives.tEnum(["up", "down", "left", "right"]),
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceFlingResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceLongTapParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceLongTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDevicePinchCloseParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  percent: validatorPrimitives.tNumber,
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDevicePinchCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDevicePinchOpenParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  percent: validatorPrimitives.tNumber,
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDevicePinchOpenResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceScrollParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  direction: validatorPrimitives.tEnum(["up", "down", "left", "right"]),
  percent: validatorPrimitives.tNumber,
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceScrollResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceSwipeParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector"),
  direction: validatorPrimitives.tEnum(["up", "down", "left", "right"]),
  percent: validatorPrimitives.tNumber,
  speed: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  timeout: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceSwipeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInfoParams = validatorPrimitives.tObject({
  androidSelector: validatorPrimitives.tType("AndroidSelector")
});
validatorPrimitives.scheme.AndroidDeviceInfoResult = validatorPrimitives.tObject({
  info: validatorPrimitives.tType("AndroidElementInfo")
});
validatorPrimitives.scheme.AndroidDeviceScreenshotParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceScreenshotResult = validatorPrimitives.tObject({
  binary: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.AndroidDeviceInputTypeParams = validatorPrimitives.tObject({
  text: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceInputTypeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInputPressParams = validatorPrimitives.tObject({
  key: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceInputPressResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInputTapParams = validatorPrimitives.tObject({
  point: validatorPrimitives.tType("Point")
});
validatorPrimitives.scheme.AndroidDeviceInputTapResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInputSwipeParams = validatorPrimitives.tObject({
  segments: validatorPrimitives.tArray(validatorPrimitives.tType("Point")),
  steps: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceInputSwipeResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceInputDragParams = validatorPrimitives.tObject({
  from: validatorPrimitives.tType("Point"),
  to: validatorPrimitives.tType("Point"),
  steps: validatorPrimitives.tNumber
});
validatorPrimitives.scheme.AndroidDeviceInputDragResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceLaunchBrowserParams = validatorPrimitives.tObject({
  noDefaultViewport: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  viewport: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  screen: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    width: validatorPrimitives.tNumber,
    height: validatorPrimitives.tNumber
  })),
  ignoreHTTPSErrors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clientCertificates: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tObject({
    origin: validatorPrimitives.tString,
    cert: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    key: validatorPrimitives.tOptional(validatorPrimitives.tBinary),
    passphrase: validatorPrimitives.tOptional(validatorPrimitives.tString),
    pfx: validatorPrimitives.tOptional(validatorPrimitives.tBinary)
  }))),
  javaScriptEnabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  bypassCSP: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  userAgent: validatorPrimitives.tOptional(validatorPrimitives.tString),
  locale: validatorPrimitives.tOptional(validatorPrimitives.tString),
  timezoneId: validatorPrimitives.tOptional(validatorPrimitives.tString),
  geolocation: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    longitude: validatorPrimitives.tNumber,
    latitude: validatorPrimitives.tNumber,
    accuracy: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  permissions: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  extraHTTPHeaders: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("NameValue"))),
  offline: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  httpCredentials: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    username: validatorPrimitives.tString,
    password: validatorPrimitives.tString,
    origin: validatorPrimitives.tOptional(validatorPrimitives.tString),
    send: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["always", "unauthorized"]))
  })),
  deviceScaleFactor: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  isMobile: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  hasTouch: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  colorScheme: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["dark", "light", "no-preference", "no-override"])),
  reducedMotion: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["reduce", "no-preference", "no-override"])),
  forcedColors: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["active", "none", "no-override"])),
  acceptDownloads: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["accept", "deny", "internal-browser-default"])),
  contrast: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["no-preference", "more", "no-override"])),
  baseURL: validatorPrimitives.tOptional(validatorPrimitives.tString),
  recordVideo: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    dir: validatorPrimitives.tString,
    size: validatorPrimitives.tOptional(validatorPrimitives.tObject({
      width: validatorPrimitives.tNumber,
      height: validatorPrimitives.tNumber
    }))
  })),
  strictSelectors: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  serviceWorkers: validatorPrimitives.tOptional(validatorPrimitives.tEnum(["allow", "block"])),
  selectorEngines: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("SelectorEngine"))),
  testIdAttributeName: validatorPrimitives.tOptional(validatorPrimitives.tString),
  pkg: validatorPrimitives.tOptional(validatorPrimitives.tString),
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString)),
  proxy: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    server: validatorPrimitives.tString,
    bypass: validatorPrimitives.tOptional(validatorPrimitives.tString),
    username: validatorPrimitives.tOptional(validatorPrimitives.tString),
    password: validatorPrimitives.tOptional(validatorPrimitives.tString)
  }))
});
validatorPrimitives.scheme.AndroidDeviceLaunchBrowserResult = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.AndroidDeviceOpenParams = validatorPrimitives.tObject({
  command: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceOpenResult = validatorPrimitives.tObject({
  socket: validatorPrimitives.tChannel(["AndroidSocket"])
});
validatorPrimitives.scheme.AndroidDeviceShellParams = validatorPrimitives.tObject({
  command: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceShellResult = validatorPrimitives.tObject({
  result: validatorPrimitives.tBinary
});
validatorPrimitives.scheme.AndroidDeviceInstallApkParams = validatorPrimitives.tObject({
  file: validatorPrimitives.tBinary,
  args: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tString))
});
validatorPrimitives.scheme.AndroidDeviceInstallApkResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDevicePushParams = validatorPrimitives.tObject({
  file: validatorPrimitives.tBinary,
  path: validatorPrimitives.tString,
  mode: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
});
validatorPrimitives.scheme.AndroidDevicePushResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceConnectToWebViewParams = validatorPrimitives.tObject({
  socketName: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidDeviceConnectToWebViewResult = validatorPrimitives.tObject({
  context: validatorPrimitives.tChannel(["BrowserContext"])
});
validatorPrimitives.scheme.AndroidDeviceCloseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidDeviceCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.AndroidWebView = validatorPrimitives.tObject({
  pid: validatorPrimitives.tNumber,
  pkg: validatorPrimitives.tString,
  socketName: validatorPrimitives.tString
});
validatorPrimitives.scheme.AndroidSelector = validatorPrimitives.tObject({
  checkable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  checked: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  clazz: validatorPrimitives.tOptional(validatorPrimitives.tString),
  clickable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  depth: validatorPrimitives.tOptional(validatorPrimitives.tNumber),
  desc: validatorPrimitives.tOptional(validatorPrimitives.tString),
  enabled: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  focusable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  focused: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  hasChild: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    androidSelector: validatorPrimitives.tType("AndroidSelector")
  })),
  hasDescendant: validatorPrimitives.tOptional(validatorPrimitives.tObject({
    androidSelector: validatorPrimitives.tType("AndroidSelector"),
    maxDepth: validatorPrimitives.tOptional(validatorPrimitives.tNumber)
  })),
  longClickable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  pkg: validatorPrimitives.tOptional(validatorPrimitives.tString),
  res: validatorPrimitives.tOptional(validatorPrimitives.tString),
  scrollable: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  selected: validatorPrimitives.tOptional(validatorPrimitives.tBoolean),
  text: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.AndroidElementInfo = validatorPrimitives.tObject({
  children: validatorPrimitives.tOptional(validatorPrimitives.tArray(validatorPrimitives.tType("AndroidElementInfo"))),
  clazz: validatorPrimitives.tString,
  desc: validatorPrimitives.tString,
  res: validatorPrimitives.tString,
  pkg: validatorPrimitives.tString,
  text: validatorPrimitives.tString,
  bounds: validatorPrimitives.tType("Rect"),
  checkable: validatorPrimitives.tBoolean,
  checked: validatorPrimitives.tBoolean,
  clickable: validatorPrimitives.tBoolean,
  enabled: validatorPrimitives.tBoolean,
  focusable: validatorPrimitives.tBoolean,
  focused: validatorPrimitives.tBoolean,
  longClickable: validatorPrimitives.tBoolean,
  scrollable: validatorPrimitives.tBoolean,
  selected: validatorPrimitives.tBoolean
});
validatorPrimitives.scheme.JsonPipeInitializer = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.JsonPipeMessageEvent = validatorPrimitives.tObject({
  message: validatorPrimitives.tAny
});
validatorPrimitives.scheme.JsonPipeClosedEvent = validatorPrimitives.tObject({
  reason: validatorPrimitives.tOptional(validatorPrimitives.tString)
});
validatorPrimitives.scheme.JsonPipeSendParams = validatorPrimitives.tObject({
  message: validatorPrimitives.tAny
});
validatorPrimitives.scheme.JsonPipeSendResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.JsonPipeCloseParams = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));
validatorPrimitives.scheme.JsonPipeCloseResult = validatorPrimitives.tOptional(validatorPrimitives.tObject({}));

exports.ValidationError = validatorPrimitives.ValidationError;
exports.createMetadataValidator = validatorPrimitives.createMetadataValidator;
exports.findValidator = validatorPrimitives.findValidator;
exports.maybeFindValidator = validatorPrimitives.maybeFindValidator;
