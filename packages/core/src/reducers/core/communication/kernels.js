// @flow
import {
  makeKernelCommunicationRecord,
  makeKernelsCommunicationRecord
} from "../../../state/communication/kernels";
import * as actionTypes from "../../../actionTypes";
import { combineReducers } from "redux-immutable";
import * as Immutable from "immutable";

// TODO: we should spec out a way to watch the killKernel lifecycle.
const byRef = (state = Immutable.Map(), action) => {
  switch (action.type) {
    case actionTypes.RESTART_KERNEL:
    case actionTypes.LAUNCH_KERNEL:
    case actionTypes.LAUNCH_KERNEL_BY_NAME:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      return state.set(
        action.payload.ref,
        makeKernelCommunicationRecord({
          error: null,
          loading: true
        })
      );
    case actionTypes.RESTART_KERNEL_SUCCESSFUL:
    case actionTypes.LAUNCH_KERNEL_SUCCESSFUL:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      return state.set(
        action.payload.ref,
        makeKernelCommunicationRecord({
          error: null,
          loading: false
        })
      );
    case actionTypes.RESTART_KERNEL_FAILED:
    case actionTypes.LAUNCH_KERNEL_FAILED:
      // TODO: #2608
      if (!action.payload.ref) {
        return state;
      }
      return state.set(
        action.payload.ref,
        makeKernelCommunicationRecord({
          error: action.payload.error,
          loading: false
        })
      );
    default:
      return state;
  }
};

export const kernels = combineReducers(
  { byRef },
  makeKernelsCommunicationRecord
);
