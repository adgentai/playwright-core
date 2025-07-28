/**
 * @license
 * Copyright 2024 Google Inc.
 * Modifications copyright (c) Microsoft Corporation.
 * SPDX-License-Identifier: Apache-2.0
 */
var Session;
((Session2) => {
  ((UserPromptHandlerType2) => {
    UserPromptHandlerType2["Accept"] = "accept";
    UserPromptHandlerType2["Dismiss"] = "dismiss";
    UserPromptHandlerType2["Ignore"] = "ignore";
  })(Session2.UserPromptHandlerType || (Session2.UserPromptHandlerType = {}));
})(Session || (Session = {}));
var BrowsingContext;
((BrowsingContext2) => {
  ((ReadinessState2) => {
    ReadinessState2["None"] = "none";
    ReadinessState2["Interactive"] = "interactive";
    ReadinessState2["Complete"] = "complete";
  })(BrowsingContext2.ReadinessState || (BrowsingContext2.ReadinessState = {}));
})(BrowsingContext || (BrowsingContext = {}));
((BrowsingContext2) => {
  ((UserPromptType2) => {
    UserPromptType2["Alert"] = "alert";
    UserPromptType2["Beforeunload"] = "beforeunload";
    UserPromptType2["Confirm"] = "confirm";
    UserPromptType2["Prompt"] = "prompt";
  })(BrowsingContext2.UserPromptType || (BrowsingContext2.UserPromptType = {}));
})(BrowsingContext || (BrowsingContext = {}));
((BrowsingContext2) => {
  ((CreateType2) => {
    CreateType2["Tab"] = "tab";
    CreateType2["Window"] = "window";
  })(BrowsingContext2.CreateType || (BrowsingContext2.CreateType = {}));
})(BrowsingContext || (BrowsingContext = {}));
var Network;
((Network2) => {
  ((SameSite2) => {
    SameSite2["Strict"] = "strict";
    SameSite2["Lax"] = "lax";
    SameSite2["None"] = "none";
  })(Network2.SameSite || (Network2.SameSite = {}));
})(Network || (Network = {}));
((Network2) => {
  ((InterceptPhase2) => {
    InterceptPhase2["BeforeRequestSent"] = "beforeRequestSent";
    InterceptPhase2["ResponseStarted"] = "responseStarted";
    InterceptPhase2["AuthRequired"] = "authRequired";
  })(Network2.InterceptPhase || (Network2.InterceptPhase = {}));
})(Network || (Network = {}));
var Script;
((Script2) => {
  ((ResultOwnership2) => {
    ResultOwnership2["Root"] = "root";
    ResultOwnership2["None"] = "none";
  })(Script2.ResultOwnership || (Script2.ResultOwnership = {}));
})(Script || (Script = {}));
var Log;
((Log2) => {
  ((Level2) => {
    Level2["Debug"] = "debug";
    Level2["Info"] = "info";
    Level2["Warn"] = "warn";
    Level2["Error"] = "error";
  })(Log2.Level || (Log2.Level = {}));
})(Log || (Log = {}));
var Input;
((Input2) => {
  ((PointerType2) => {
    PointerType2["Mouse"] = "mouse";
    PointerType2["Pen"] = "pen";
    PointerType2["Touch"] = "touch";
  })(Input2.PointerType || (Input2.PointerType = {}));
})(Input || (Input = {}));

export { BrowsingContext, Input, Log, Network, Script, Session };
