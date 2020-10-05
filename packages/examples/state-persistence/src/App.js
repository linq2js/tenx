import React, { Suspense } from "react";
import "./App.css";
import tenx from "tenx";
import { useStore } from "tenx/react";

async function loadStateFromServer() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return JSON.parse(localStorage.getItem("asyncState")) || {};
}

async function uploadStateToServer(state) {
  localStorage.setItem("asyncState", JSON.stringify(state));
}

const syncStore = tenx(
  {
    count: 0,
  },
  {
    init({ count, watch }) {
      const state = JSON.parse(localStorage.getItem("syncState")) || {};
      if (typeof state.count !== "undefined") {
        count.value = state.count;
      }
      watch("count", (e) =>
        localStorage.setItem("syncState", JSON.stringify({ count: e.current }))
      );
      setInterval(() => count.value++, 1000);
    },
  }
);

const asyncStore = tenx(
  {
    count: 0,
  },
  {
    async init({ count, watch }) {
      const state = await loadStateFromServer();
      if (typeof state.count !== "undefined") {
        count.value = state.count;
      }
      watch("count", (e) => uploadStateToServer({ count: e.current }));
      setInterval(() => count.value++, 1000);
    },
  }
);

function SyncStateConsumer() {
  const count = useStore(syncStore, (state) => state.count);
  return <h1>{count}</h1>;
}

function AsyncStateConsumer() {
  const count = useStore(asyncStore, (state) => state.count);
  return <h1>{count}</h1>;
}

function App() {
  return (
    <div className="App">
      <SyncStateConsumer />
      <Suspense fallback="Loading...">
        <AsyncStateConsumer />
      </Suspense>
    </div>
  );
}

export default App;
