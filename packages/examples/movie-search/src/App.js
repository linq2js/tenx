import React, { memo, Suspense } from "react";
import Search from "./store/Search";
import useMovieStore from "./store/useMovieStore";
import Next from "./store/Next";
import Prev from "./store/Prev";
import "./styles.css";

const MovieResults = memo(function MovieResults() {
  const {
    next,
    prev,
    data: { page, results, total_pages, total_results },
  } = useMovieStore((state, { dispatch }) => ({
    data: state.results,
    next: dispatch.get(Next),
    prev: dispatch.get(Prev),
  }));

  if (!results.length) {
    return <div>No result</div>;
  }
  return (
    <div>
      <p>
        {total_results} Results. Page: {page}/{total_pages}&nbsp;&nbsp;
        <button onClick={prev} disabled={page === 1}>
          Prev
        </button>
        &nbsp;&nbsp;
        <button onClick={next} disabled={page === total_pages}>
          Next
        </button>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {results.map((result) => (
          <div
            key={result.id}
            style={{
              width: 320,
              height: 115,
              overflow: "hidden",
              margin: "10px",
              border: "1px solid silver",
              paddingRight: 5,
              lineHeight: "20px",
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w1280${result.poster_path}`}
              alt={result.title}
              width={80}
              style={{ float: "left", marginRight: 10, flex: 1 }}
            />
            <h3>
              {result.vote_average} - {result.title} ({result.release_date})
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function App() {
  const { search, keyword } = useMovieStore((state, { dispatch }) => ({
    keyword: state.keyword,
    search: dispatch.get(Search),
  }));

  function handleChange(e) {
    search(e.target.value);
  }

  return (
    <div className="App">
      <h1>Tenx - Movie Search</h1>
      <form>
        <strong style={{ fontSize: 20 }}>Search</strong>&nbsp;&nbsp;
        <input
          type="text"
          onChange={handleChange}
          value={keyword}
          placeholder="Enter movie title"
          style={{
            fontSize: 20,
            width: "500px",
            border: "1px solid silver",
            padding: 10,
            borderRadius: 5,
          }}
        />
        <p />
      </form>
      <Suspense fallback={<div>Fetching...</div>}>
        <MovieResults />
      </Suspense>
    </div>
  );
}
