import React, { Suspense } from "react";
import "./App.css";
import tenx from "tenx";
import { useStore } from "tenx/react";

const converters = {
  hex: "Decimal to Hex",
  bin: "Decimal to Binary",
  date: "Timestamp to Date",
  postTitle: "Post title of https://jsonplaceholder.typicode.com/posts/{value}",
};

const store = tenx(
  {
    value: 100,
    computed: {
      normalizedValue(state) {
        return parseInt(state.value, 10) || 0;
      },
      hex: ["normalizedValue", (value) => value.toString(16)],
      bin: ["normalizedValue", (value) => value.toString(2)],
      date: ["normalizedValue", (value) => new Date(value).toISOString()],
      postTitle: [
        "normalizedValue",
        (value) =>
          fetch("https://jsonplaceholder.typicode.com/posts/" + value)
            .then((res) => res.json())
            .then((res) => res.title),
      ],
    },
  },
  {
    changeValue({ value }, payload) {
      value.value = payload;
    },
  }
);

function Converter({ text, stateProp }) {
  const { rawValue, convertedValue } = useStore(store, function (state) {
    return {
      rawValue: state.value,
      convertedValue: state[stateProp],
    };
  });
  return (
    <div>
      <h3>{text.replace(/\{value}/g, rawValue)}</h3>
      <p>{convertedValue}</p>
    </div>
  );
}

function App() {
  const value = useStore(store, (state) => state.value);

  return (
    <div className="App">
      <p>
        <input
          type="text"
          value={value}
          onChange={(e) => store.changeValue(e.target.value)}
        />
      </p>
      {Object.entries(converters).map(([stateProp, text]) => (
        <Suspense fallback="Converting...">
          <Converter stateProp={stateProp} text={text} />
        </Suspense>
      ))}
    </div>
  );
}

export default App;
