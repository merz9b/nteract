// @flow
import {
  makeLocalKernelRecord,
  makeRemoteKernelRecord,
  makeKernelsRecord
} from "../../../state/entities/kernels";
import * as actionTypes from "../../../actionTypes";
import { combineReducers } from "redux-immutable";
import * as Immutable from "immutable";

// TODO: we need to clean up references to old kernels at some point. Listening
// for KILL_KERNEL_SUCCESSFUL seems like a good candidate, but I think you can
// also end up with a dead kernel if that fails and you hit KILL_KERNEL_FAILED.
const byRef = (state = Immutable.Map(), action) => {
  switch (action.type) {
    case actionTypes.SET_LANGUAGE_INFO:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      // TODO: Should the kernel hold language info?
      return state;
    case actionTypes.SET_EXECUTION_STATE:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      return state.setIn(
        [action.payload.ref, "status"],
        action.payload.kernelStatus
      );
    case actionTypes.LAUNCH_KERNEL_SUCCESSFUL:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      switch (action.payload.kernel.type) {
        case "zeromq":
          return state.set(
            action.payload.ref,
            makeLocalKernelRecord(action.payload.kernel)
          );
        case "websocket":
          return state.set(
            action.payload.ref,
            makeRemoteKernelRecord(action.payload.kernel)
          );
        default:
          throw new Error(
            `Unrecognized kernel type "${action.payload.kernel.type}".`
          );
      }
    default:
      return state;
  }
};

export const kernels = combineReducers({ byRef }, makeKernelsRecord);
