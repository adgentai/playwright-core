'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

/**
 * @license
 * Copyright 2024 Google Inc.
 * Modifications copyright (c) Microsoft Corporation.
 * SPDX-License-Identifier: Apache-2.0
 */
exports.Permissions = void 0;
((Permissions2) => {
  ((PermissionState2) => {
    PermissionState2["Granted"] = "granted";
    PermissionState2["Denied"] = "denied";
    PermissionState2["Prompt"] = "prompt";
  })(Permissions2.PermissionState || (Permissions2.PermissionState = {}));
})(exports.Permissions || (exports.Permissions = {}));
