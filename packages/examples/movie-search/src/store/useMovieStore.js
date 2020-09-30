import { useStore } from "tenx/react";
import store from "./index";

export default function useMovieStore(selector) {
  return useStore(store, selector);
}
