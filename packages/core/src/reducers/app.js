// @flow
import {
  makeAppRecord,
  makeLocalKernelRecord,
  makeRemoteKernelRecord
} from "../state";

import type { AppRecord } from "../state";

import * as actionTypes from "../actionTypes";

import type {
  NewKernelAction,
  SetExecutionStateAction,
  SetNotificationSystemAction,
  SetGithubTokenAction,
  DoneSavingAction,
  StartSavingAction
} from "../actionTypes";

function setGithubToken(state: AppRecord, action: SetGithubTokenAction) {
  const { githubToken } = action;
  return state.set("githubToken", githubToken);
}

function startSaving(state: AppRecord) {
  return state.set("isSaving", true);
}

function doneSaving(state: AppRecord) {
  return state.set("isSaving", false).set("lastSaved", new Date());
}

export function launchKernelSuccessful(
  state: AppRecord,
  action: NewKernelAction
) {
  if (!action.payload.kernel || !action.payload.kernel.type) {
    // unset on lack of kernel
    return state.set("kernel", null);
  }

  let kernel = null;

  // We create a record based on the kernel type
  switch (action.payload.kernel.type) {
    case "websocket":
      kernel = makeRemoteKernelRecord(action.payload.kernel);
      break;
    case "zeromq":
      kernel = makeLocalKernelRecord(action.payload.kernel);
      break;
    default:
      kernel = null;
  }

  return state.set("kernel", kernel);
}

export function setExecutionState(
  state: AppRecord,
  action: SetExecutionStateAction
) {
  return state.mergeIn(["kernel"], { status: action.payload.kernelStatus });
}

function setNotificationsSystem(
  state: AppRecord,
  action: SetNotificationSystemAction
) {
  return state.set("notificationSystem", action.notificationSystem);
}

export default function handleApp(
  state: AppRecord = makeAppRecord(),
  action:
    | SetNotificationSystemAction
    | SetExecutionStateAction
    | NewKernelAction
    | SetGithubTokenAction
    | StartSavingAction
    | DoneSavingAction
) {
  switch (action.type) {
    case actionTypes.LAUNCH_KERNEL_SUCCESSFUL:
      return launchKernelSuccessful(state, action);
    case actionTypes.SET_EXECUTION_STATE:
      return setExecutionState(state, action);
    case actionTypes.START_SAVING:
      return startSaving(state);
    case actionTypes.DONE_SAVING:
      return doneSaving(state);
    case actionTypes.SET_NOTIFICATION_SYSTEM:
      return setNotificationsSystem(state, action);
    case actionTypes.SET_GITHUB_TOKEN:
      return setGithubToken(state, action);
    default:
      return state;
  }
}
