'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

/**
 * @license
 * Copyright 2024 Google Inc.
 * Modifications copyright (c) Microsoft Corporation.
 * SPDX-License-Identifier: Apache-2.0
 */
exports.Session = void 0;
((Session2) => {
  ((UserPromptHandlerType2) => {
    UserPromptHandlerType2["Accept"] = "accept";
    UserPromptHandlerType2["Dismiss"] = "dismiss";
    UserPromptHandlerType2["Ignore"] = "ignore";
  })(Session2.UserPromptHandlerType || (Session2.UserPromptHandlerType = {}));
})(exports.Session || (exports.Session = {}));
exports.BrowsingContext = void 0;
((BrowsingContext2) => {
  ((ReadinessState2) => {
    ReadinessState2["None"] = "none";
    ReadinessState2["Interactive"] = "interactive";
    ReadinessState2["Complete"] = "complete";
  })(BrowsingContext2.ReadinessState || (BrowsingContext2.ReadinessState = {}));
})(exports.BrowsingContext || (exports.BrowsingContext = {}));
((BrowsingContext2) => {
  ((UserPromptType2) => {
    UserPromptType2["Alert"] = "alert";
    UserPromptType2["Beforeunload"] = "beforeunload";
    UserPromptType2["Confirm"] = "confirm";
    UserPromptType2["Prompt"] = "prompt";
  })(BrowsingContext2.UserPromptType || (BrowsingContext2.UserPromptType = {}));
})(exports.BrowsingContext || (exports.BrowsingContext = {}));
((BrowsingContext2) => {
  ((CreateType2) => {
    CreateType2["Tab"] = "tab";
    CreateType2["Window"] = "window";
  })(BrowsingContext2.CreateType || (BrowsingContext2.CreateType = {}));
})(exports.BrowsingContext || (exports.BrowsingContext = {}));
exports.Network = void 0;
((Network2) => {
  ((SameSite2) => {
    SameSite2["Strict"] = "strict";
    SameSite2["Lax"] = "lax";
    SameSite2["None"] = "none";
  })(Network2.SameSite || (Network2.SameSite = {}));
})(exports.Network || (exports.Network = {}));
((Network2) => {
  ((InterceptPhase2) => {
    InterceptPhase2["BeforeRequestSent"] = "beforeRequestSent";
    InterceptPhase2["ResponseStarted"] = "responseStarted";
    InterceptPhase2["AuthRequired"] = "authRequired";
  })(Network2.InterceptPhase || (Network2.InterceptPhase = {}));
})(exports.Network || (exports.Network = {}));
exports.Script = void 0;
((Script2) => {
  ((ResultOwnership2) => {
    ResultOwnership2["Root"] = "root";
    ResultOwnership2["None"] = "none";
  })(Script2.ResultOwnership || (Script2.ResultOwnership = {}));
})(exports.Script || (exports.Script = {}));
exports.Log = void 0;
((Log2) => {
  ((Level2) => {
    Level2["Debug"] = "debug";
    Level2["Info"] = "info";
    Level2["Warn"] = "warn";
    Level2["Error"] = "error";
  })(Log2.Level || (Log2.Level = {}));
})(exports.Log || (exports.Log = {}));
exports.Input = void 0;
((Input2) => {
  ((PointerType2) => {
    PointerType2["Mouse"] = "mouse";
    PointerType2["Pen"] = "pen";
    PointerType2["Touch"] = "touch";
  })(Input2.PointerType || (Input2.PointerType = {}));
})(exports.Input || (exports.Input = {}));
