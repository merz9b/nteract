/* @flow */
import { empty } from "rxjs/observable/empty";
import { of } from "rxjs/observable/of";
import {
  tap,
  filter,
  map,
  mergeMap,
  mapTo,
  switchMap,
  catchError
} from "rxjs/operators";
import { ofType } from "redux-observable";

import {
  setNotebook,
  saveFailed,
  doneSaving,
  fetchContentFailed,
  fetchContentFulfilled
} from "../actions";

import { FETCH_CONTENT, SAVE, FETCH_CONTENT_FULFILLED } from "../actionTypes";

import * as selectors from "../selectors";

import type { ActionsObservable } from "redux-observable";

import { contents } from "rx-jupyter";

import { fromJS, toJS, stringifyNotebook } from "@nteract/commutable";

import type { FetchContent, FetchContentFulfilled } from "../actionTypes";

export function fetchContentEpic(
  action$: ActionsObservable<*>,
  store: Store<*, *>
) {
  return action$.pipe(
    ofType(FETCH_CONTENT),
    tap((action: FetchContent) => {
      if (!action.payload || !action.payload.path) {
        throw new Error("fetching content needs a path");
      }
    }),
    switchMap((action: FetchContent) => {
      const serverConfig = selectors.serverConfig(store.getState());

      return contents
        .get(serverConfig, action.payload.path, action.payload.params)
        .pipe(
          tap(xhr => {
            if (xhr.status !== 200) {
              throw new Error(xhr.response);
            }
          }),
          map(xhr => {
            return fetchContentFulfilled({
              path: action.payload.path,
              model: xhr.response,
              kernelRef: action.payload.kernelRef
            });
          }),
          catchError((xhrError: any) =>
            of(
              fetchContentFailed({
                path: action.payload.path,
                error: xhrError,
                kernelRef: action.payload.kernelRef
              })
            )
          )
        );
    })
  );
}

export function saveContentEpic(
  action$: ActionsObservable<*>,
  store: Store<*, *>
) {
  return action$.pipe(
    ofType(SAVE),
    mergeMap(action => {
      const state = store.getState();
      const currentNotebook = selectors.currentNotebook(state);

      // TODO: this will likely make more sense when this becomes less
      // notebook-centric.
      if (!currentNotebook) {
        return of(saveFailed(new Error("Notebook was not set.")));
      }

      const filename = selectors.currentFilename(state);
      // TODO: this default version should probably not be here.
      const appVersion = selectors.appVersion(state) || "0.0.0-beta";

      // contents API takes notebook as raw JSON
      const notebook = toJS(
        currentNotebook.setIn(["metadata", "nteract", "version"], appVersion)
      );

      const serverConfig = selectors.serverConfig(state);

      const model = {
        content: notebook,
        type: "notebook"
      };

      return contents
        .save(serverConfig, filename, model)
        .pipe(
          mapTo(doneSaving()),
          catchError((error: Error) => of(saveFailed(error)))
        );
    })
  );
}

// When content gets loaded, if it's a notebook, set it up as the notebook
export function setNotebookEpic(
  action$: ActionsObservable<*>,
  store: Store<*, *>
) {
  return action$.pipe(
    ofType(FETCH_CONTENT_FULFILLED),
    tap((action: FetchContentFulfilled) => {
      if (
        !action.payload ||
        !action.payload.model ||
        !action.payload.model.type
      ) {
        throw new Error("content needs a type");
      }
    }),
    filter(
      (action: FetchContentFulfilled) =>
        action.payload.model.type === "notebook"
    ),
    map((action: FetchContentFulfilled) =>
      setNotebook({
        filename: action.payload.path,
        notebook: fromJS(action.payload.model.content),
        kernelRef: action.payload.kernelRef
      })
    ),
    catchError((xhrError: any) =>
      // TODO: We should create an actionType/action for this to make it easier
      // for reducers to target.
      of({ type: "ERROR", payload: xhrError, error: true })
    )
  );
}
