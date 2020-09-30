import React, { memo, Suspense } from "react";
import useMovieStore from "./store/useMovieStore";
import Next from "./store/Next";
import Prev from "./store/Prev";
import "./styles.css";

const MovieResults = memo(function MovieResults() {
  const {
    next,
    prev,
    data: { page, results, total_pages, total_results }
  } = useMovieStore((state, { callback, dispatch }) => ({
    data: state.results,
    next: callback(() => dispatch(Next)),
    prev: callback(() => dispatch(Prev))
  }));

  if (!results.length) {
    return <div>No result</div>;
  }
  return (
    <div style={{ maxWidth: 600 }}>
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
      {results.map((result) => (
        <div key={result.id}>
          <img
            src={`https://image.tmdb.org/t/p/w1280${result.poster_path}`}
            alt={result.title}
            width={80}
            style={{ float: "left", marginRight: 10 }}
          />
          <h3>
            {result.vote_average} - {result.title} ({result.release_date})
          </h3>
          <p style={{ minHeight: 100, textAlign: "justify" }}>
            {result.overview}
          </p>
        </div>
      ))}
    </div>
  );
});

export default function App() {
  const { search, keyword } = useMovieStore((state) => ({
    keyword: state.keyword,
    search: state.search
  }));

  function handleChange(e) {
    search(e.target.value);
  }

  return (
    <div className="App">
      <h1>Minsto - Movie Search</h1>
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
            borderRadius: 5
          }}
        />
        <p></p>
      </form>
      <Suspense fallback={<div>Fetching...</div>}>
        <MovieResults />
      </Suspense>
    </div>
  );
}
