import { useState, useEffect, useCallback } from "react";
import type { ToastProps } from "./toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "DISMISS_TOAST":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        toasts: action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true } });
  setTimeout(() => dispatch({ type: "DISMISS_TOAST", toastId: id }), TOAST_REMOVE_DELAY);
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), TOAST_REMOVE_DELAY + 300);
  return id;
}

function useToast() {
  const [state, setState] = useState<State>(memoryState);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return { ...state, toast, dismiss: useCallback((id?: string) => dispatch({ type: "DISMISS_TOAST", toastId: id }), []) };
}

export { useToast, toast };
